import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, layout } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { Button, Card, Badge } from '../../components';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'achievement',
      title: 'Streak Milestone!',
      message: 'You\'ve completed 7 days of "Morning Workout"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      icon: 'trophy',
    },
    {
      id: '2',
      type: 'reminder',
      title: 'Daily Reminder',
      message: 'Don\'t forget to log your "Drink Water" flow',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      icon: 'water',
    },
    {
      id: '3',
      type: 'weekly',
      title: 'Weekly Report',
      message: 'Your weekly progress summary is ready',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
      icon: 'bar-chart',
    },
  ]);
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getNotificationIcon = (type, icon) => {
    const iconMap = {
      achievement: 'trophy',
      reminder: 'notifications',
      weekly: 'bar-chart',
      social: 'people',
      system: 'settings',
    };
    return iconMap[type] || icon || 'notifications';
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      achievement: themeColors.success,
      reminder: themeColors.warning,
      weekly: themeColors.info,
      social: themeColors.accent,
      system: themeColors.secondaryText,
    };
    return colorMap[type] || themeColors.primaryOrange;
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: themeColors.cardBackground },
        !item.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) }
        ]}>
          <Ionicons
            name={getNotificationIcon(item.type, item.icon)}
            size={20}
            color={themeColors.cardBackground}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.notificationTitle,
            { color: themeColors.primaryText },
            !item.read && styles.unreadText
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.notificationMessage,
            { color: themeColors.secondaryText }
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.timestamp,
            { color: themeColors.tertiaryText }
          ]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        {!item.read && (
          <View style={[
            styles.unreadDot,
            { backgroundColor: themeColors.primaryOrange }
          ]} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={[styles.markAllText, { color: themeColors.primaryOrange }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-outline"
              size={64}
              color={themeColors.tertiaryText}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptyMessage, { color: themeColors.secondaryText }]}>
              We'll notify you about your progress, achievements, and reminders here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={themeColors.primaryOrange}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    padding: layout.spacing.sm,
    marginRight: layout.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.title1,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  markAllButton: {
    padding: layout.spacing.sm,
  },
  markAllText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: layout.spacing.md,
  },
  notificationItem: {
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.spacing.sm,
    ...layout.shadows.small,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.light.primaryOrange,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: layout.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layout.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    marginBottom: layout.spacing.xs,
  },
  unreadText: {
    fontWeight: typography.weights.bold,
  },
  notificationMessage: {
    fontSize: typography.sizes.caption1,
    lineHeight: 20,
    marginBottom: layout.spacing.xs,
  },
  timestamp: {
    fontSize: typography.sizes.caption2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: layout.spacing.sm,
    marginLeft: layout.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.bold,
    marginTop: layout.spacing.lg,
    marginBottom: layout.spacing.sm,
  },
  emptyMessage: {
    fontSize: typography.sizes.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationScreen;
