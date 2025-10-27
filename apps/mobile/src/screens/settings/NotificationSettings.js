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
import notificationService from '../../services/notificationService';

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
    requestPermissions,
    scheduleFlowReminder,
    cancelFlowReminder,
    cancelAllFlowReminders,
  } = useNotificationContext();

  const [notificationData, setNotificationData] = useState({
    dailyReminders: true,
    weeklyReports: true,
    achievementAlerts: true,
    communityUpdates: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    vibration: true,
    flowLevels: {
      level2: {
        ringtone: 'default',
        customRingtone: null,
        description: '🔔 Moderate push with ringtone'
      },
      level3: {
        ringtone: 'default',
        customRingtone: null,
        description: '🚨 Urgent alarm with ringtone (repeats until completed)'
      }
    }
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
          // Ensure flowLevels is always present with default values
          const settingsWithFlowLevels = {
            ...notificationSettings,
            flowLevels: notificationSettings.flowLevels || {
              level2: {
                ringtone: 'default',
                customRingtone: null,
                description: '🔔 Moderate push with ringtone'
              },
              level3: {
                ringtone: 'default',
                customRingtone: null,
                description: '🚨 Urgent alarm with ringtone (repeats until completed)'
              }
            }
          };
          setNotificationData(settingsWithFlowLevels);
        } else if (settings?.notifications) {
          setNotificationData({
            dailyReminders: settings.notifications.dailyReminders ?? true,
            weeklyReports: settings.notifications.weeklyReports ?? true,
            achievementAlerts: settings.notifications.achievementAlerts ?? true,
            communityUpdates: settings.notifications.communityUpdates ?? false,
            quietHours: {
              enabled: settings.notifications.quietHours?.enabled ?? false,
              start: settings.notifications.quietHours?.start || '22:00',
              end: settings.notifications.quietHours?.end || '08:00'
            },
            vibration: settings.notifications.vibration ?? true,
            flowLevels: {
              level2: {
                ringtone: 'default',
                customRingtone: null,
                description: '🔔 Moderate push with ringtone'
              },
              level3: {
                ringtone: 'default',
                customRingtone: null,
                description: '🚨 Urgent alarm with ringtone (repeats until completed)'
              }
            }
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

  // Handle test notification
  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Test Notification Sent', 'You should receive a test notification shortly.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Please try again.');
    }
  };

  // Handle test flow level ringtones
  const handleTestFlowLevelRingtones = async () => {
    try {
      Alert.alert(
        'Test Ringtones',
        'Choose which ringtone to test:',
        [
          {
            text: 'Level 2 Ringtone',
            onPress: async () => {
              await scheduleFlowReminder('test-level2', 'Test Level 2 Ringtone', 2, '09:00');
              Alert.alert('Test Scheduled', 'Level 2 ringtone test scheduled for 9:00 AM');
            }
          },
          {
            text: 'Level 3 Ringtone',
            onPress: async () => {
              await scheduleFlowReminder('test-level3', 'Test Level 3 Ringtone', 3, '09:00');
              Alert.alert('Test Scheduled', 'Level 3 ringtone test scheduled for 9:00 AM');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error testing ringtones:', error);
      Alert.alert('Error', 'Failed to test ringtones.');
    }
  };

  // Handle preview notification
  const handlePreviewNotification = async () => {
    try {
      await sendTestNotification();
      setNotificationPreview({
        title: 'Flow Reminder',
        body: 'This is a preview of how notifications will look.',
        time: new Date().toLocaleTimeString()
      });
      Alert.alert('Preview Sent', 'You should see a notification preview now.');
    } catch (error) {
      console.error('Error previewing notification:', error);
      Alert.alert('Error', 'Failed to preview notification.');
    }
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

  // Test different notification levels
  const handleTestLevelNotifications = async () => {
    try {
      Alert.alert(
        'Test Notification Levels',
        'Choose which notification level to test:',
        [
          {
            text: 'Level 1 - Notification',
            onPress: async () => {
              await scheduleFlowReminder('test-flow-1', 'Test Flow Level 1', 1, '09:00');
              Alert.alert('Level 1 Scheduled', 'A Level 1 notification has been scheduled for 9:00 AM');
            }
          },
          {
            text: 'Level 2 - Alarm',
            onPress: async () => {
              await scheduleFlowReminder('test-flow-2', 'Test Flow Level 2', 2, '12:00');
              Alert.alert('Level 2 Scheduled', 'A Level 2 alarm has been scheduled for 12:00 PM');
            }
          },
          {
            text: 'Level 3 - Urgent Alarm',
            onPress: async () => {
              await scheduleFlowReminder('test-flow-3', 'Test Flow Level 3', 3, '18:00');
              Alert.alert('Level 3 Scheduled', 'A Level 3 urgent alarm has been scheduled for 6:00 PM (will repeat until completed)');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error testing level notifications:', error);
      Alert.alert('Error', 'Failed to test notifications.');
    }
  };

  const handleTestQuietHours = async () => {
    try {
      const success = await notificationService.testQuietHours();
      if (success) {
        Alert.alert(
          'Quiet Hours Test',
          'Quiet hours functionality has been tested! Check the console logs for detailed results.'
        );
      } else {
        Alert.alert('Error', 'Failed to test quiet hours functionality.');
      }
    } catch (error) {
      console.error('Error testing quiet hours:', error);
      Alert.alert('Error', 'Failed to test quiet hours.');
    }
  };

  // Handle test notification
  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Test Notification Sent', 'You should receive a test notification shortly.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Please try again.');
    }
  };

  // Handle test flow level ringtones
  const handleTestFlowLevelRingtones = async () => {
    try {
      Alert.alert(
        'Test Ringtones',
        'Choose which ringtone to test:',
        [
          {
            text: 'Level 2 Ringtone',
            onPress: async () => {
              await scheduleFlowReminder('test-level2', 'Test Level 2 Ringtone', 2, '09:00');
              Alert.alert('Test Scheduled', 'Level 2 ringtone test scheduled for 9:00 AM');
            }
          },
          {
            text: 'Level 3 Ringtone',
            onPress: async () => {
              await scheduleFlowReminder('test-level3', 'Test Level 3 Ringtone', 3, '09:00');
              Alert.alert('Test Scheduled', 'Level 3 ringtone test scheduled for 9:00 AM');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error testing ringtones:', error);
      Alert.alert('Error', 'Failed to test ringtones.');
    }
  };

  // Handle preview notification
  const handlePreviewNotification = async () => {
    try {
      await sendTestNotification();
      setNotificationPreview({
        title: 'Flow Reminder',
        body: 'This is a preview of how notifications will look.',
        time: new Date().toLocaleTimeString()
      });
      Alert.alert('Preview Sent', 'You should see a notification preview now.');
    } catch (error) {
      console.error('Error previewing notification:', error);
      Alert.alert('Error', 'Failed to preview notification.');
    }
  };

  // Schedule daily reminder
  const handleScheduleReminder = async () => {
    try {
      if (!notificationData.dailyReminders) {
        Alert.alert('Daily Reminders Disabled', 'Please enable daily reminders first.');
        return;
      }

      // Schedule reminders for each flow level
      const levels = [
        { level: 1, time: notificationData.flowLevels?.level1?.time || '09:00', enabled: notificationData.flowLevels?.level1?.enabled || false },
        { level: 2, time: notificationData.flowLevels?.level2?.time || '12:00', enabled: notificationData.flowLevels?.level2?.enabled || false },
        { level: 3, time: notificationData.flowLevels?.level3?.time || '18:00', enabled: notificationData.flowLevels?.level3?.enabled || false },
      ];

      let scheduledCount = 0;
      for (const { level, time, enabled } of levels) {
        if (enabled) {
          const success = await scheduleFlowReminder(
            `test-flow-${level}`,
            `Test Flow Level ${level}`,
            level,
            time
          );
          if (success) {
            scheduledCount++;
          }
        }
      }

      Alert.alert(
        'Reminders Scheduled',
        `Successfully scheduled ${scheduledCount} flow reminders${notificationData.quietHours.enabled ? ` (except during quiet hours: ${notificationData.quietHours.start} - ${notificationData.quietHours.end})` : ''}`
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

  // Flow level handlers
  const handleRingtoneChange = (level, ringtoneType) => {
    setNotificationData(prev => ({
      ...prev,
      flowLevels: {
        ...prev.flowLevels,
        [level]: {
          ...prev.flowLevels[level],
          ringtone: ringtoneType,
          customRingtone: ringtoneType === 'custom' ? prev.flowLevels[level]?.customRingtone : null
        }
      }
    }));
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
    sectionDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginBottom: 16,
      lineHeight: 18,
    },
    flowLevelSection: {
      backgroundColor: themeColors.surface || '#F8F9FA',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    flowLevelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    flowLevelTitle: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
    },
    flowLevelDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginTop: 2,
    },
    flowLevelOptions: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    flowLevelOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    flowLevelOptionLabel: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      fontWeight: typography.weights.medium,
    },
    timeButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    timeButtonText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.semibold,
    },
    approachButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    approachButtonText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryText,
      marginRight: 4,
    },
    levelSection: {
      backgroundColor: themeColors.surface || '#F8F9FA',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    levelHeader: {
      flex: 1,
      marginBottom: 8,
    },
    levelTitle: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 4,
    },
    levelDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      lineHeight: 18,
    },
    levelControls: {
      alignItems: 'flex-end',
    },
    ringtoneOptions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    ringtoneOption: {
      flex: 1,
      padding: 12,
      backgroundColor: themeColors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
      alignItems: 'center',
    },
    ringtoneOptionSelected: {
      backgroundColor: themeColors.primaryOrange,
      borderColor: themeColors.primaryOrange,
    },
    ringtoneOptionText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryText,
      fontWeight: typography.weights.medium,
    },
    ringtoneOptionTextSelected: {
      color: '#fff',
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
              onPress={handleTestLevelNotifications}
            >
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <Text style={dynamicStyles.testButtonText}>
                Test Level Notifications
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={dynamicStyles.testButton}
              onPress={handleTestNotification}
            >
              <Text style={dynamicStyles.testButtonText}>
                Send Test Notification
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[dynamicStyles.testButton, { marginTop: 8 }]}
              onPress={handleTestFlowLevelRingtones}
            >
              <Text style={dynamicStyles.testButtonText}>
                Test Flow Level Ringtones
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[dynamicStyles.testButton, { marginTop: 8 }]}
              onPress={handleTestQuietHours}
            >
              <Text style={dynamicStyles.testButtonText}>
                Test Quiet Hours
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
          <Text style={dynamicStyles.sectionTitle}>Flow Level Ringtones</Text>
          <Text style={dynamicStyles.sectionDescription}>
            Configure ringtones for Level 2 and Level 3 notifications
          </Text>
          
          {/* Level 1 - No Settings */}
          <View style={dynamicStyles.levelSection}>
            <View style={dynamicStyles.levelHeader}>
              <Text style={dynamicStyles.levelTitle}>🌱 Level 1 - Gentle Notification</Text>
              <Text style={dynamicStyles.levelDescription}>
                Standard notification sound (no settings required)
              </Text>
            </View>
          </View>

          {/* Level 2 - Ringtone Selection */}
          <View style={dynamicStyles.levelSection}>
            <View style={dynamicStyles.levelHeader}>
              <Text style={dynamicStyles.levelTitle}>🔔 Level 2 - Moderate Push</Text>
              <Text style={dynamicStyles.levelDescription}>
                Choose ringtone for moderate notifications
              </Text>
            </View>
            <View style={dynamicStyles.ringtoneOptions}>
              <TouchableOpacity
                style={[
                  dynamicStyles.ringtoneOption,
                  notificationData.flowLevels?.level2?.ringtone === 'default' && dynamicStyles.ringtoneOptionSelected
                ]}
                onPress={() => handleRingtoneChange('level2', 'default')}
              >
                <Text style={[
                  dynamicStyles.ringtoneOptionText,
                  notificationData.flowLevels?.level2?.ringtone === 'default' && dynamicStyles.ringtoneOptionTextSelected
                ]}>
                  Default Ringtone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.ringtoneOption,
                  notificationData.flowLevels?.level2?.ringtone === 'custom' && dynamicStyles.ringtoneOptionSelected
                ]}
                onPress={() => handleRingtoneChange('level2', 'custom')}
              >
                <Text style={[
                  dynamicStyles.ringtoneOptionText,
                  notificationData.flowLevels?.level2?.ringtone === 'custom' && dynamicStyles.ringtoneOptionTextSelected
                ]}>
                  Choose Custom File
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Level 3 - Ringtone Selection */}
          <View style={dynamicStyles.levelSection}>
            <View style={dynamicStyles.levelHeader}>
              <Text style={dynamicStyles.levelTitle}>🚨 Level 3 - Urgent Alarm</Text>
              <Text style={dynamicStyles.levelDescription}>
                Choose ringtone for urgent alarms (repeats until completed)
              </Text>
            </View>
            <View style={dynamicStyles.ringtoneOptions}>
              <TouchableOpacity
                style={[
                  dynamicStyles.ringtoneOption,
                  notificationData.flowLevels?.level3?.ringtone === 'default' && dynamicStyles.ringtoneOptionSelected
                ]}
                onPress={() => handleRingtoneChange('level3', 'default')}
              >
                <Text style={[
                  dynamicStyles.ringtoneOptionText,
                  notificationData.flowLevels?.level3?.ringtone === 'default' && dynamicStyles.ringtoneOptionTextSelected
                ]}>
                  Default Ringtone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.ringtoneOption,
                  notificationData.flowLevels?.level3?.ringtone === 'custom' && dynamicStyles.ringtoneOptionSelected
                ]}
                onPress={() => handleRingtoneChange('level3', 'custom')}
              >
                <Text style={[
                  dynamicStyles.ringtoneOptionText,
                  notificationData.flowLevels?.level3?.ringtone === 'custom' && dynamicStyles.ringtoneOptionTextSelected
                ]}>
                  Choose Custom File
                </Text>
              </TouchableOpacity>
            </View>
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
