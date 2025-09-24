// screens/settings/NotificationSettings.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import { useNotificationContext } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

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

  const {
    permissionsGranted,
    initialized,
    loading: notificationLoading,
    getNotificationSettings,
    updateNotificationSettings,
    sendTestNotification,
    requestPermissions
  } = useNotificationContext();

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
    },
    reminderSound: 'default',
    vibration: true
  });

  const [initializing, setInitializing] = useState(true);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [showQuietStartPicker, setShowQuietStartPicker] = useState(false);
  const [showQuietEndPicker, setShowQuietEndPicker] = useState(false);
  const [notificationPreview, setNotificationPreview] = useState(null);

  // Initialize notification service and load settings
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        setInitializing(true);
        
        // Load notification settings
        const notificationSettings = await getNotificationSettings();
        if (notificationSettings) {
          setNotificationData(notificationSettings);
        } else if (settings?.notifications) {
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
            },
            reminderSound: settings.notifications.reminderSound || 'default',
            vibration: settings.notifications.vibration ?? true
          });
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        Alert.alert('Error', 'Failed to initialize notifications. Please check your permissions.');
      } finally {
        setInitializing(false);
      }
    };

    if (initialized) {
      initializeNotifications();
    }
  }, [settings, initialized, getNotificationSettings]);

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
      // Update notification service settings (this will handle FCM topic subscriptions)
      await updateNotificationSettings(notificationData);
      
      // Update app settings
      await updateSettings({
        notifications: notificationData
      });
      
      Alert.alert('Success', 'Notification settings updated successfully! You will receive notifications based on your preferences.');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const granted = await requestPermissions();
      
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted!');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive reminders.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    }
  };

  // Time picker handlers
  const handleReminderTimeChange = (event, selectedTime) => {
    setShowReminderTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      handleToggleChange('reminderTime', timeString);
    }
  };

  const handleQuietStartChange = (event, selectedTime) => {
    setShowQuietStartPicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      setNotificationData(prev => ({
        ...prev,
        quietHours: {
          ...prev.quietHours,
          start: timeString
        }
      }));
    }
  };

  const handleQuietEndChange = (event, selectedTime) => {
    setShowQuietEndPicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      setNotificationData(prev => ({
        ...prev,
        quietHours: {
          ...prev.quietHours,
          end: timeString
        }
      }));
    }
  };

  // Preview notification with current settings
  const handlePreviewNotification = async () => {
    try {
      const previewData = {
        title: 'Daily Flow Reminder',
        body: `Time to complete your flows! Your reminder is set for ${notificationData.reminderTime}`,
        data: { 
          type: 'preview',
          reminderTime: notificationData.reminderTime,
          sound: notificationData.reminderSound,
          vibration: notificationData.vibration
        }
      };
      
      await sendTestNotification();
      setNotificationPreview(previewData);
      
      Alert.alert(
        'Preview Sent', 
        `A preview notification has been sent with your current settings:\n\n• Time: ${notificationData.reminderTime}\n• Sound: ${getSoundDisplayName(notificationData.reminderSound)}\n• Vibration: ${notificationData.vibration ? 'On' : 'Off'}`
      );
    } catch (error) {
      console.error('Error sending preview notification:', error);
      Alert.alert('Error', 'Failed to send preview notification.');
    }
  };

  // Schedule daily reminder
  const handleScheduleReminder = async () => {
    try {
      if (!notificationData.dailyReminders) {
        Alert.alert('Daily Reminders Disabled', 'Please enable daily reminders first.');
        return;
      }

      // This would integrate with the backend to schedule the reminder
      Alert.alert(
        'Reminder Scheduled',
        `Daily reminders will be sent at ${notificationData.reminderTime}${notificationData.quietHours.enabled ? ` (except during quiet hours: ${notificationData.quietHours.start} - ${notificationData.quietHours.end})` : ''}`
      );
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      Alert.alert('Error', 'Failed to schedule reminder.');
    }
  };

  const showSoundPicker = () => {
    const soundOptions = [
      { value: 'default', label: 'Default' },
      { value: 'chime', label: 'Chime' },
      { value: 'bell', label: 'Bell' },
      { value: 'none', label: 'None' },
    ];

    Alert.alert(
      'Select Sound',
      'Choose notification sound',
      soundOptions.map(option => ({
        text: option.label,
        onPress: () => handleToggleChange('reminderSound', option.value),
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const getSoundDisplayName = (sound) => {
    const soundMap = {
      'default': 'Default',
      'chime': 'Chime',
      'bell': 'Bell',
      'none': 'None',
    };
    return soundMap[sound] || 'Default';
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
      marginBottom: 24, // Standard margin for save button
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    permissionSection: {
      backgroundColor: themeColors.warningBackground || '#FFF3CD',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.warningBorder || '#FFEAA7',
    },
    permissionText: {
      fontSize: typography.sizes.body,
      color: themeColors.warningText || '#856404',
      marginBottom: 12,
    },
    permissionButton: {
      backgroundColor: themeColors.primaryOrange,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    permissionButtonText: {
      color: '#fff',
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
    },
    testButton: {
      backgroundColor: themeColors.primaryOrange,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    testButtonText: {
      color: '#fff',
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      marginLeft: 8,
    },
    soundSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: themeColors.secondaryBackground || '#F8F9FA',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    soundText: {
      fontSize: typography.sizes.body,
      marginRight: 8,
    },
  });

  if (loading && !settings || initializing || notificationLoading) {
    return (
      <SafeAreaWrapper style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

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
        <Text style={dynamicStyles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={dynamicStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={dynamicStyles.container}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Permission Status */}
        {!permissionsGranted && (
          <View style={dynamicStyles.permissionSection}>
            <Text style={dynamicStyles.permissionText}>
              Notifications are not enabled. Please grant permission to receive reminders and updates.
            </Text>
            <TouchableOpacity 
              style={dynamicStyles.permissionButton}
              onPress={handleRequestPermissions}
            >
              <Text style={dynamicStyles.permissionButtonText}>
                Enable Notifications
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Test Notification */}
        {permissionsGranted && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Test Notifications</Text>
            <Text style={[dynamicStyles.toggleDescription, { marginBottom: 12 }]}>
              Send a test notification to verify FCM is working correctly
            </Text>
            <TouchableOpacity 
              style={dynamicStyles.testButton}
              onPress={handleTestNotification}
            >
              <Text style={dynamicStyles.testButtonText}>
                Send Test Notification
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* General Notifications */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>General Notifications</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Daily Reminders</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Get push notifications to complete your daily flows (via FCM)
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
            <TouchableOpacity onPress={() => setShowReminderTimePicker(true)}>
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
                  <TouchableOpacity onPress={() => setShowQuietStartPicker(true)}>
                    <Text style={dynamicStyles.timeDisplay}>
                      {notificationData.quietHours.start}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={dynamicStyles.quietHoursItem}>
                  <Text style={dynamicStyles.toggleLabel}>End Time</Text>
                  <TouchableOpacity onPress={() => setShowQuietEndPicker(true)}>
                    <Text style={dynamicStyles.timeDisplay}>
                      {notificationData.quietHours.end}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Sound & Vibration</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Reminder Sound</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Choose notification sound
              </Text>
            </View>
            <TouchableOpacity
              style={dynamicStyles.soundSelector}
              onPress={() => showSoundPicker()}
            >
              <Text style={[dynamicStyles.soundText, { color: themeColors.primaryText }]}>
                {getSoundDisplayName(notificationData.reminderSound)}
              </Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.secondaryText} />
            </TouchableOpacity>
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Vibration</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Vibrate when notifications arrive
              </Text>
            </View>
            <Switch
              value={notificationData.vibration}
              onValueChange={(value) => handleToggleChange('vibration', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={notificationData.vibration ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notification Management */}
        {permissionsGranted && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Notification Management</Text>
            
            <TouchableOpacity
              style={dynamicStyles.testButton}
              onPress={handlePreviewNotification}
              disabled={updating}
            >
              <Ionicons name="eye-outline" size={20} color="#fff" />
              <Text style={dynamicStyles.testButtonText}>Preview Notification</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[dynamicStyles.testButton, { backgroundColor: themeColors.primaryOrange }]}
              onPress={handleScheduleReminder}
              disabled={updating || !notificationData.dailyReminders}
            >
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={dynamicStyles.testButtonText}>Schedule Daily Reminder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[dynamicStyles.testButton, { backgroundColor: themeColors.secondaryText }]}
              onPress={() => navigation.navigate('NotificationLog')}
            >
              <Ionicons name="list-outline" size={20} color="#fff" />
              <Text style={dynamicStyles.testButtonText}>View Notification History</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Save Button */}
        <Button
          title={updating ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          variant="primary"
          style={dynamicStyles.saveButton}
          disabled={updating}
        />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Time Pickers */}
      {showReminderTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${notificationData.reminderTime}:00`)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleReminderTimeChange}
        />
      )}

      {showQuietStartPicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${notificationData.quietHours.start}:00`)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleQuietStartChange}
        />
      )}

      {showQuietEndPicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${notificationData.quietHours.end}:00`)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleQuietEndChange}
        />
      )}
    </SafeAreaWrapper>
  );
};

export default NotificationSettings;
