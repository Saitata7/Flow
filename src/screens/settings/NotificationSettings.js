// screens/settings/NotificationSettings.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import Button from '../../components/common/Button';

const NotificationSettings = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const { 
    settings, 
    loading, 
    error, 
    updating, 
    updateSettings 
  } = useSettings();

  const [notificationData, setNotificationData] = useState({
    dailyReminders: true,
    weeklyReports: true,
    achievementAlerts: true,
    communityUpdates: false,
    reminderTime: '09:00',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Initialize notification data when settings load
  useEffect(() => {
    if (settings?.notifications) {
      setNotificationData({
        dailyReminders: settings.notifications.dailyReminders ?? true,
        weeklyReports: settings.notifications.weeklyReports ?? true,
        achievementAlerts: settings.notifications.achievementAlerts ?? true,
        communityUpdates: settings.notifications.communityUpdates ?? false,
        reminderTime: settings.notifications.reminderTime || '09:00',
        quietHours: {
          enabled: settings.notifications.quietHours?.enabled ?? false,
          start: settings.notifications.quietHours?.start || '22:00',
          end: settings.notifications.quietHours?.end || '08:00'
        }
      });
    }
  }, [settings]);

  const handleToggleChange = (field, value) => {
    setNotificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuietHoursToggle = (enabled) => {
    setNotificationData(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled
      }
    }));
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        notifications: notificationData
      });
      Alert.alert('Success', 'Notification settings updated successfully!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.progressBackground,
    },
    headerTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
    },
    backButton: {
      padding: 8,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 16,
    },
    toggleItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    toggleLabel: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryText,
      flex: 1,
    },
    toggleDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginTop: 4,
    },
    timeDisplay: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.semibold,
    },
    quietHoursSection: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.progressBackground,
    },
    quietHoursItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    saveButton: {
      marginTop: 24,
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  if (loading && !settings) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.primaryText} 
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General Notifications */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>General Notifications</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Daily Reminders</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Get reminded to complete your daily habits
              </Text>
            </View>
            <Switch
              value={notificationData.dailyReminders}
              onValueChange={(value) => handleToggleChange('dailyReminders', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={notificationData.dailyReminders ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Weekly Reports</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Receive weekly progress summaries
              </Text>
            </View>
            <Switch
              value={notificationData.weeklyReports}
              onValueChange={(value) => handleToggleChange('weeklyReports', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={notificationData.weeklyReports ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Achievement Alerts</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Get notified when you earn badges or reach milestones
              </Text>
            </View>
            <Switch
              value={notificationData.achievementAlerts}
              onValueChange={(value) => handleToggleChange('achievementAlerts', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={notificationData.achievementAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Community Updates</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Get updates about community challenges and events
              </Text>
            </View>
            <Switch
              value={notificationData.communityUpdates}
              onValueChange={(value) => handleToggleChange('communityUpdates', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={notificationData.communityUpdates ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Timing */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Timing</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Reminder Time</Text>
              <Text style={dynamicStyles.toggleDescription}>
                When to send daily reminders
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={dynamicStyles.timeDisplay}>
                {notificationData.reminderTime}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.quietHoursSection}>
            <View style={dynamicStyles.toggleItem}>
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.toggleLabel}>Quiet Hours</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  Disable notifications during these hours
                </Text>
              </View>
              <Switch
                value={notificationData.quietHours.enabled}
                onValueChange={handleQuietHoursToggle}
                trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                thumbColor={notificationData.quietHours.enabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            {notificationData.quietHours.enabled && (
              <>
                <View style={dynamicStyles.quietHoursItem}>
                  <Text style={dynamicStyles.toggleLabel}>Start Time</Text>
                  <Text style={dynamicStyles.timeDisplay}>
                    {notificationData.quietHours.start}
                  </Text>
                </View>
                <View style={dynamicStyles.quietHoursItem}>
                  <Text style={dynamicStyles.toggleLabel}>End Time</Text>
                  <Text style={dynamicStyles.timeDisplay}>
                    {notificationData.quietHours.end}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Save Button */}
        <Button
          title={updating ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          variant="primary"
          style={dynamicStyles.saveButton}
          disabled={updating}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettings;
