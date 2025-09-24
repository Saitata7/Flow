import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlowsContext } from '../../context/FlowContext';
import { ThemeContext } from '../../context/ThemeContext';
import ImportExport from '../../components/Settings/ImportExport';
import NotificationSettings from '../../components/Settings/Notification';
import ColorPicker from '../../components/Settings/ColorPicker';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const SETTINGS_STORAGE_KEY = 'app_settings';

const defaultSettings = {
  theme: 'light',
  accentColor: '#007AFF',
  textSize: 'medium',
  highContrast: false,
  cheatMode: false,
  highlightDayStreak: true,
  closeTime: '21:00',
  habitDefaults: {
    type: 'binary',
    goalFrequency: 'daily',
    repeatTimesPerWeek: 7,
    reminderMethod: 'notification',
  },
  scoring: {
    showDetailedStats: true,
    showEmotionNotes: true,
    motivationalInsights: true,
  },
  emotionalLogging: {
    promptFrequency: 'always',
    customEmotions: ['Happy', 'Sad', 'Motivated'],
  },
  social: {
    shareProgress: false,
    communityChallenges: false,
    peerEncouragement: false,
  },
  dataPrivacy: {
    cloudBackup: false,
    localBackup: false,
    clinicianConsent: false,
  },
  clinician: {
    enableDashboard: false,
    sharedData: 'stats',
    clinicians: [],
  },
  integrations: {
    wearables: [],
    externalApps: [],
  },
  appBehavior: {
    defaultLandingPage: 'dashboard',
  },
};

const SettingsScreen = () => {
  const flowsContext = useContext(FlowsContext);
  const themeContext = useContext(ThemeContext);

  if (!flowsContext) {
    console.warn('FlowsContext is undefined.');
    return (
      <SafeAreaWrapper>
        <Text>Error: FlowsContext not available</Text>
      </SafeAreaWrapper>
    );
  }
  if (!themeContext) {
    console.warn('ThemeContext is undefined.');
    return (
      <SafeAreaWrapper>
        <Text>Error: ThemeContext not available</Text>
      </SafeAreaWrapper>
    );
  }

  const { resetFlows, setFlows } = flowsContext;
  const { theme, textSize, highContrast, updateThemeSettings } = themeContext;
  const [settings, setSettings] = useState(defaultSettings);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [newEmotion, setNewEmotion] = useState('');
  const scaleAnim = new Animated.Value(1);

  // Load settings only on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          const mergedSettings = { ...defaultSettings, ...parsedSettings };
          setSettings(mergedSettings);
          // Update theme settings only if necessary
          if (
            mergedSettings.theme !== theme ||
            mergedSettings.accentColor !== settings.accentColor ||
            mergedSettings.textSize !== textSize ||
            mergedSettings.highContrast !== highContrast
          ) {
            updateThemeSettings({
              theme: mergedSettings.theme,
              accentColor: mergedSettings.accentColor,
              textSize: mergedSettings.textSize,
              highContrast: mergedSettings.highContrast,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
        Alert.alert('Error', 'Failed to load settings');
      }
    };
    loadSettings();
  }, []); // Empty dependency array ensures this runs only on mount

  // Memoized saveSettings to prevent unnecessary re-renders
  const saveSettings = useCallback(
    async (updatedSettings) => {
      try {
        // Only save if settings have changed
        if (JSON.stringify(updatedSettings) !== JSON.stringify(settings)) {
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
          setSettings(updatedSettings);
          // Only update theme if relevant fields have changed
          if (
            updatedSettings.theme !== theme ||
            updatedSettings.accentColor !== settings.accentColor ||
            updatedSettings.textSize !== textSize ||
            updatedSettings.highContrast !== highContrast
          ) {
            updateThemeSettings({
              theme: updatedSettings.theme,
              accentColor: updatedSettings.accentColor,
              textSize: updatedSettings.textSize,
              highContrast: updatedSettings.highContrast,
            });
          }
        }
      } catch (e) {
        console.error('Failed to save settings:', e);
        Alert.alert('Error', 'Failed to save settings');
      }
    },
    [settings, theme, textSize, highContrast, updateThemeSettings]
  );

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  // Theme & Accessibility
  const toggleTheme = () => {
    saveSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const selectAccentColor = (color) => {
    saveSettings({ ...settings, accentColor: color });
    setShowCustomColor(false);
  };

  const selectTextSize = (size) => {
    saveSettings({ ...settings, textSize: size });
  };

  const toggleHighContrast = () => {
    saveSettings({ ...settings, highContrast: !settings.highContrast });
  };

  // Habit Defaults
  const updateHabitType = (type) => {
    saveSettings({
      ...settings,
      habitDefaults: { ...settings.habitDefaults, type },
    });
  };

  const updateGoalFrequency = (frequency) => {
    saveSettings({
      ...settings,
      habitDefaults: { ...settings.habitDefaults, goalFrequency: frequency },
    });
  };

  const updateRepeatTimes = (times) => {
    const num = parseInt(times);
    if (isNaN(num) || num < 1 || num > 7) {
      Alert.alert('Error', 'Please enter a number between 1 and 7');
      return;
    }
    saveSettings({
      ...settings,
      habitDefaults: { ...settings.habitDefaults, repeatTimesPerWeek: num },
    });
  };

  const updateReminderMethod = (method) => {
    saveSettings({
      ...settings,
      habitDefaults: { ...settings.habitDefaults, reminderMethod: method },
    });
  };

  // Scoring & Feedback
  const toggleScoringOption = (key) => {
    saveSettings({
      ...settings,
      scoring: { ...settings.scoring, [key]: !settings.scoring[key] },
    });
  };

  // Emotional Logging
  const updatePromptFrequency = (frequency) => {
    saveSettings({
      ...settings,
      emotionalLogging: { ...settings.emotionalLogging, promptFrequency: frequency },
    });
  };

  const addCustomEmotion = () => {
    if (!newEmotion.trim()) {
      Alert.alert('Error', 'Please enter an emotion');
      return;
    }
    if (settings.emotionalLogging.customEmotions.includes(newEmotion.trim())) {
      Alert.alert('Error', 'Emotion already exists');
      return;
    }
    saveSettings({
      ...settings,
      emotionalLogging: {
        ...settings.emotionalLogging,
        customEmotions: [...settings.emotionalLogging.customEmotions, newEmotion.trim()],
      },
    });
    setNewEmotion('');
  };

  // Social Features
  const toggleSocialOption = (key) => {
    saveSettings({
      ...settings,
      social: { ...settings.social, [key]: !settings.social[key] },
    });
  };

  // Data Privacy
  const toggleDataPrivacyOption = (key) => {
    saveSettings({
      ...settings,
      dataPrivacy: { ...settings.dataPrivacy, [key]: !settings.dataPrivacy[key] },
    });
  };

  // Clinician Features
  const toggleClinicianDashboard = () => {
    saveSettings({
      ...settings,
      clinician: { ...settings.clinician, enableDashboard: !settings.clinician.enableDashboard },
    });
  };

  const updateSharedData = (data) => {
    saveSettings({
      ...settings,
      clinician: { ...settings.clinician, sharedData: data },
    });
  };

  // Integrations
  const addIntegration = (type, name) => {
    saveSettings({
      ...settings,
      integrations: {
        ...settings.integrations,
        [type]: [...settings.integrations[type], name],
      },
    });
  };

  // App Behavior
  const updateDefaultLandingPage = (page) => {
    saveSettings({
      ...settings,
      appBehavior: { ...settings.appBehavior, defaultLandingPage: page },
    });
  };

  // Reset All Data
  const resetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all habits, settings, and account data. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetFlows();
              await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
              setSettings(defaultSettings);
              updateThemeSettings({
                theme: defaultSettings.theme,
                accentColor: defaultSettings.accentColor,
                textSize: defaultSettings.textSize,
                highContrast: defaultSettings.highContrast,
              });
              Alert.alert('Success', 'All data has been reset');
            } catch (e) {
              console.error('Failed to reset data:', e);
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme === 'light' ? '#f8f9fa' : '#121212',
    },
    card: {
      backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e',
      shadowColor: highContrast ? '#fff' : theme === 'light' ? '#000' : '#fff',
      shadowOpacity: highContrast ? 0.3 : 0.1,
    },
    label: {
      color: theme === 'light' ? '#333' : '#e0e0e0',
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      fontWeight: highContrast ? '700' : '500',
    },
    text: {
      color: theme === 'light' ? '#666' : '#a0a0a0',
      fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
    },
    button: {
      backgroundColor: highContrast ? '#000' : settings.accentColor || '#007AFF',
      borderWidth: highContrast ? 2 : 0,
      borderColor: highContrast ? '#fff' : 'transparent',
    },
    buttonText: {
      color: highContrast ? '#fff' : '#fff',
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      fontWeight: '600',
    },
    input: {
      color: theme === 'light' ? '#333' : '#e0e0e0',
      borderColor: theme === 'light' ? '#ccc' : '#444',
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      backgroundColor: theme === 'light' ? '#fff' : '#2a2a2a',
    },
  });

  return (
    <SafeAreaWrapper style={[styles.safeContainer, dynamicStyles.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.header, dynamicStyles.label]}>Settings</Text>
          <Text style={[styles.subtitle, dynamicStyles.text]}>
            Customize your app experience
          </Text>
        </View>

        {/* Appearance */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Appearance</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Theme</Text>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.theme === 'dark' ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Accent Color</Text>
            <TouchableOpacity
              onPress={() => setShowCustomColor(!showCustomColor)}
              style={[styles.colorPreview, { backgroundColor: settings.accentColor }]}
            />
          </View>
          {showCustomColor && (
            <ColorPicker
              onSelectColor={selectAccentColor}
              onClose={() => setShowCustomColor(false)}
            />
          )}
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Text Size</Text>
            <View style={styles.textSizeOptions}>
              {['small', 'medium', 'large'].map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => selectTextSize(size)}
                  style={[
                    styles.textSizeButton,
                    settings.textSize === size && {
                      backgroundColor: settings.accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.text,
                      dynamicStyles.text,
                      settings.textSize === size && { color: '#fff' },
                    ]}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>High Contrast Mode</Text>
            <Switch
              value={settings.highContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.highContrast ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Notifications</Text>
          <NotificationSettings
            globalNotifications={settings.habitDefaults.reminderMethod !== 'none'}
            defaultReminderMethod={settings.habitDefaults.reminderMethod}
            closeTime={settings.closeTime}
            onUpdateNotifications={(value) =>
              updateReminderMethod(value ? 'notification' : 'none')
            }
            onUpdateReminderMethod={updateReminderMethod}
            onUpdateCloseTime={(time) => saveSettings({ ...settings, closeTime: time })}
          />
        </View>

        {/* Habit Defaults */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Habit Defaults</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Default Habit Type</Text>
            <View style={styles.textSizeOptions}>
              {['binary', 'quantitative', 'time-based'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => updateHabitType(type)}
                  style={[
                    styles.textSizeButton,
                    settings.habitDefaults.type === type && {
                      backgroundColor: settings.accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.text,
                      dynamicStyles.text,
                      settings.habitDefaults.type === type && { color: '#fff' },
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Goal Frequency</Text>
            <View style={styles.textSizeOptions}>
              {['daily', 'weekly', 'custom'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => updateGoalFrequency(freq)}
                  style={[
                    styles.textSizeButton,
                    settings.habitDefaults.goalFrequency === freq && {
                      backgroundColor: settings.accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.text,
                      dynamicStyles.text,
                      settings.habitDefaults.goalFrequency === freq && { color: '#fff' },
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {settings.habitDefaults.goalFrequency === 'weekly' && (
            <View style={styles.settingRow}>
              <Text style={[styles.label, dynamicStyles.label]}>Repeat Times/Week</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                value={settings.habitDefaults.repeatTimesPerWeek.toString()}
                onChangeText={updateRepeatTimes}
                keyboardType="numeric"
                placeholder="1-7"
              />
            </View>
          )}
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Cheat Mode</Text>
            <Switch
              value={settings.cheatMode}
              onValueChange={() => saveSettings({ ...settings, cheatMode: !settings.cheatMode })}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.cheatMode ? '#fff' : '#f4f3f4'}
            />
            <Text style={[styles.text, dynamicStyles.text]}>
              {settings.cheatMode ? 'On' : 'Off'}
            </Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Highlight Day Streak</Text>
            <Switch
              value={settings.highlightDayStreak}
              onValueChange={() =>
                saveSettings({ ...settings, highlightDayStreak: !settings.highlightDayStreak })
              }
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.highlightDayStreak ? '#fff' : '#f4f3f4'}
            />
            <Text style={[styles.text, dynamicStyles.text]}>
              {settings.highlightDayStreak ? 'On' : 'Off'}
            </Text>
          </View>
        </View>

        {/* Scoring & Feedback */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Scoring & Feedback</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Show Detailed Stats</Text>
            <Switch
              value={settings.scoring.showDetailedStats}
              onValueChange={() => toggleScoringOption('showDetailedStats')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.scoring.showDetailedStats ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Show Emotion/Notes</Text>
            <Switch
              value={settings.scoring.showEmotionNotes}
              onValueChange={() => toggleScoringOption('showEmotionNotes')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.scoring.showEmotionNotes ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Motivational Insights</Text>
            <Switch
              value={settings.scoring.motivationalInsights}
              onValueChange={() => toggleScoringOption('motivationalInsights')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.scoring.motivationalInsights ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Emotional & Notes Logging */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Emotional & Notes Logging</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Prompt Frequency</Text>
            <View style={styles.textSizeOptions}>
              {['always', 'fail/skip', 'manual'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => updatePromptFrequency(freq)}
                  style={[
                    styles.textSizeButton,
                    settings.emotionalLogging.promptFrequency === freq && {
                      backgroundColor: settings.accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.text,
                      dynamicStyles.text,
                      settings.emotionalLogging.promptFrequency === freq && { color: '#fff' },
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Add Custom Emotion</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={newEmotion}
              onChangeText={setNewEmotion}
              placeholder="Enter new emotion"
            />
            <TouchableOpacity
              style={[styles.button, dynamicStyles.button]}
              onPress={addCustomEmotion}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.text, dynamicStyles.text]}>
            Emotions: {settings.emotionalLogging.customEmotions.join(', ')}
          </Text>
        </View>

        {/* Accountability & Social Features */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Social Features</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Share Progress</Text>
            <Switch
              value={settings.social.shareProgress}
              onValueChange={() => toggleSocialOption('shareProgress')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.social.shareProgress ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Community Challenges</Text>
            <Switch
              value={settings.social.communityChallenges}
              onValueChange={() => toggleSocialOption('communityChallenges')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.social.communityChallenges ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Peer Encouragement</Text>
            <Switch
              value={settings.social.peerEncouragement}
              onValueChange={() => toggleSocialOption('peerEncouragement')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.social.peerEncouragement ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Data & Privacy</Text>
          <ImportExport setFlows={setFlows} />
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Cloud Backup</Text>
            <Switch
              value={settings.dataPrivacy.cloudBackup}
              onValueChange={() => toggleDataPrivacyOption('cloudBackup')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.dataPrivacy.cloudBackup ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Local Backup</Text>
            <Switch
              value={settings.dataPrivacy.localBackup}
              onValueChange={() => toggleDataPrivacyOption('localBackup')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.dataPrivacy.localBackup ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Clinician Consent</Text>
            <Switch
              value={settings.dataPrivacy.clinicianConsent}
              onValueChange={() => toggleDataPrivacyOption('clinicianConsent')}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.dataPrivacy.clinicianConsent ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#dc3545' }]}
              onPress={resetAllData}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Clinician Features */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Clinician Features</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Enable Clinician Dashboard</Text>
            <Switch
              value={settings.clinician.enableDashboard}
              onValueChange={toggleClinicianDashboard}
              trackColor={{ false: '#767577', true: settings.accentColor }}
              thumbColor={settings.clinician.enableDashboard ? '#fff' : '#f4f3f4'}
            />
          </View>
          {settings.clinician.enableDashboard && (
            <View style={styles.settingRow}>
              <Text style={[styles.label, dynamicStyles.label]}>Shared Data</Text>
              <View style={styles.textSizeOptions}>
                {['stats', 'stats+notes'].map((data) => (
                  <TouchableOpacity
                    key={data}
                    onPress={() => updateSharedData(data)}
                    style={[
                      styles.textSizeButton,
                      settings.clinician.sharedData === data && {
                        backgroundColor: settings.accentColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.text,
                        dynamicStyles.text,
                        settings.clinician.sharedData === data && { color: '#fff' },
                      ]}
                    >
                      {data}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Integrations */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>Integrations</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Wearables</Text>
            <TouchableOpacity
              style={[styles.button, dynamicStyles.button]}
              onPress={() => addIntegration('wearables', 'Fitbit')}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Add Fitbit</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.text, dynamicStyles.text]}>
            Connected: {settings.integrations.wearables.join(', ') || 'None'}
          </Text>
        </View>

        {/* App Behavior */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>App Behavior</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Default Landing Page</Text>
            <View style={styles.textSizeOptions}>
              {['dashboard', 'today', 'stats'].map((page) => (
                <TouchableOpacity
                  key={page}
                  onPress={() => updateDefaultLandingPage(page)}
                  style={[
                    styles.textSizeButton,
                    settings.appBehavior.defaultLandingPage === page && {
                      backgroundColor: settings.accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.text,
                      dynamicStyles.text,
                      settings.appBehavior.defaultLandingPage === page && { color: '#fff' },
                    ]}
                  >
                    {page.charAt(0).toUpperCase() + page.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* About */}
        <View style={[styles.card, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.label]}>About</Text>
          <Text style={[styles.text, dynamicStyles.text]}>Version: 1.0.0</Text>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Privacy Policy')}>
            <Text style={[styles.link, dynamicStyles.text]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Terms of Service')}>
            <Text style={[styles.link, dynamicStyles.text]}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('Support', 'Contact us at support@habitapp.com')}
          >
            <Text style={[styles.link, dynamicStyles.text]}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('Feedback', 'Submit feedback to feedback@habitapp.com')}
          >
            <Text style={[styles.link, dynamicStyles.text]}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '500',
    flex: 1,
  },
  text: {
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 120,
    textAlign: 'center',
  },
  importContainer: {
    marginVertical: 12,
  },
  importInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  textSizeOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  textSizeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 100,
  },
  buttonText: {
    fontWeight: '600',
  },
  link: {
    color: '#007AFF',
    marginVertical: 4,
  },
});

export default SettingsScreen;
