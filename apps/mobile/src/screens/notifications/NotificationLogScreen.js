// screens/notifications/NotificationLogScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { apiClient } from '../../config/api';

const NotificationLogScreen = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setOffset(0);
      } else {
        setLoading(true);
      }

      const currentOffset = isRefresh ? 0 : offset;
      const response = await apiClient.get('/notifications/logs', {
        params: {
          limit,
          offset: currentOffset,
        },
      });

      if (response.data && response.data.success) {
        const newNotifications = response.data.data;
        
        if (isRefresh) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setHasMore(response.data.pagination.hasMore);
        setOffset(currentOffset + newNotifications.length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notification history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadNotifications(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'reminder':
        return 'time-outline';
      case 'achievement':
        return 'trophy-outline';
      case 'report':
        return 'bar-chart-outline';
      case 'community':
        return 'people-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'reminder':
        return themeColors.primaryOrange;
      case 'achievement':
        return '#FFD700';
      case 'report':
        return '#4CAF50';
      case 'community':
        return '#2196F3';
      default:
        return themeColors.primaryText;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationItem = ({ item }) => (
    <View style={[styles.notificationItem, { backgroundColor: themeColors.cardBackground }]}>
      <View style={styles.notificationHeader}>
        <View style={styles.categoryIcon}>
          <Ionicons 
            name={getCategoryIcon(item.category)} 
            size={20} 
            color={getCategoryColor(item.category)} 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: themeColors.primaryText }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: themeColors.secondaryText }]}>
            {item.body}
          </Text>
        </View>
        <Text style={[styles.notificationTime, { color: themeColors.secondaryText }]}>
          {formatDate(item.sentAt)}
        </Text>
      </View>
      
      {item.data && Object.keys(item.data).length > 0 && (
        <View style={styles.notificationData}>
          <Text style={[styles.dataLabel, { color: themeColors.secondaryText }]}>
            Additional Data:
          </Text>
          <Text style={[styles.dataText, { color: themeColors.primaryText }]}>
            {JSON.stringify(item.data, null, 2)}
          </Text>
        </View>
      )}
      
      <View style={styles.notificationFooter}>
        <View style={styles.statusContainer}>
          <Ionicons 
            name="checkmark-circle" 
            size={16} 
            color={item.successCount > 0 ? '#4CAF50' : '#FF5722'} 
          />
          <Text style={[styles.statusText, { color: themeColors.secondaryText }]}>
            {item.successCount} sent
          </Text>
        </View>
        
        {item.failureCount > 0 && (
          <View style={styles.statusContainer}>
            <Ionicons 
              name="close-circle" 
              size={16} 
              color="#FF5722" 
            />
            <Text style={[styles.statusText, { color: '#FF5722' }]}>
              {item.failureCount} failed
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="notifications-off-outline" 
        size={64} 
        color={themeColors.secondaryText} 
      />
      <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>
        No Notifications Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
        Your notification history will appear here once you start receiving notifications.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || notifications.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={themeColors.primaryOrange} />
      </View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
    },
    backButton: {
      padding: 8,
    },
  });

  return (
    <SafeAreaWrapper style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.primaryText} 
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Notification History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primaryOrange}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: typography.sizes.caption,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
  },
  notificationData: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  dataLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  dataText: {
    fontSize: typography.sizes.caption,
    fontFamily: 'monospace',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: typography.sizes.caption,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default NotificationLogScreen;
