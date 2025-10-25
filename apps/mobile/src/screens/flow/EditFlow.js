import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlowsContext } from '../../context/FlowContext';
import { ThemeContext } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { validateNumericInput } from '../../utils/validation';
import CardComponent from '../../components/common/CardComponent';
import Button from '../../components/common/Button';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { colors, typography, layout } from '../../../styles';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const EditFlowScreen = ({ route, navigation }) => {
  const { flowId } = route.params || {};
  const flowsContext = useContext(FlowsContext);
  const { flows = [], updateFlow = () => {} } = flowsContext || {};
  const { textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const flow = flows.find((f) => f.id === flowId);
  const insets = useSafeAreaInsets();
  
  // Theme colors
  const themeColors = colors.light;

  if (!flow) {
    return (
      <SafeAreaWrapper style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.primaryText }]}>Flow not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: themeColors.cardBackground }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons name="chevron-back" size={20} color={themeColors.primaryText} />
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  // State
  const [title, setTitle] = useState(flow.title || '');
  const [description, setDescription] = useState(flow.description || '');
  const [trackingType, setTrackingType] = useState(flow.trackingType || 'Binary');
  const [frequency, setFrequency] = useState(flow.frequency || 'Daily');
  const [everyDay, setEveryDay] = useState(flow.everyDay || false);
  const [selectedDays, setSelectedDays] = useState(flow.daysOfWeek || []);
  const [reminderTimeEnabled, setReminderTimeEnabled] = useState(!!flow.reminderTime);
  const [reminderTime, setReminderTime] = useState(flow.reminderTime ? new Date(flow.reminderTime) : null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderLevel, setReminderLevel] = useState(flow.reminderLevel?.toString() || '1');
  const [unitText, setUnitText] = useState(flow.unitText || '');
  const [hours, setHours] = useState(flow.hours || 0);
  const [minutes, setMinutes] = useState(flow.minutes || 0);
  const [seconds, setSeconds] = useState(flow.seconds || 0);
  const [goal, setGoal] = useState(flow.goal || 0);
  const [hoursInput, setHoursInput] = useState((flow.hours || 0).toString().padStart(2, '0'));
  const [minutesInput, setMinutesInput] = useState((flow.minutes || 0).toString().padStart(2, '0'));
  const [secondsInput, setSecondsInput] = useState((flow.seconds || 0).toString().padStart(2, '0'));
  const [goalInput, setGoalInput] = useState((flow.goal || 0).toString());
  
  // Title validation state
  const [titleError, setTitleError] = useState('');
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);

  // Storage preference state
  const [storagePreference, setStoragePreference] = useState(flow.storagePreference || 'local');
  const [showUpgradeWarning, setShowUpgradeWarning] = useState(false);

  // v2 schema fields
  const [planId, setPlanId] = useState(flow.planId || null);
  const [progressMode, setProgressMode] = useState(flow.progressMode || 'sum');
  const [tags, setTags] = useState(flow.tags || []);
  const [archived, setArchived] = useState(flow.archived || false);
  const [visibility, setVisibility] = useState(flow.visibility || 'private');
  const [cheatMode, setCheatMode] = useState(flow.cheatMode || false);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Function to check for duplicate titles
  const checkTitleAvailability = useCallback(async (titleToCheck) => {
    if (!titleToCheck || titleToCheck.trim().length < 3) {
      setTitleError('');
      return;
    }

    // Check 10 character limit
    if (titleToCheck.trim().length > 10) {
      setTitleError('Title must be 10 characters or less');
      return;
    }

    // Skip check if editing the same flow
    if (flow && flow.title.toLowerCase().trim() === titleToCheck.toLowerCase().trim()) {
      setTitleError('');
      return;
    }

    // Check if flows context is available
    if (!flows || !Array.isArray(flows)) {
      console.log('EditFlow: Flows context not available or not an array:', flows);
      setTitleError('');
      return;
    }

    setIsCheckingTitle(true);
    setTitleError('');

    try {
      // Check against existing flows
      const existingFlow = flows.find(existingFlow => 
        existingFlow.id !== flow.id && // Exclude current flow being edited
        !existingFlow.deletedAt && 
        !existingFlow.archived &&
        existingFlow.title.toLowerCase().trim() === titleToCheck.toLowerCase().trim()
      );

      if (existingFlow) {
        setTitleError('This title is already taken. Please choose a different one.');
      } else {
        setTitleError('');
      }
    } catch (error) {
      console.error('Error checking title availability:', error);
      setTitleError('');
    } finally {
      setIsCheckingTitle(false);
    }
  }, [flows, flow]);

  // Debounced title checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkTitleAvailability(title);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [title, checkTitleAvailability]);

  const handleSave = useCallback(async () => {
    // Basic validation
    if (!title || title.trim().length < 3) {
      Alert.alert('Validation Error', 'Title must be at least 3 characters');
      return;
    }

    if (title.trim().length > 10) {
      Alert.alert('Validation Error', 'Title must be 10 characters or less');
      return;
    }

    // Check for title error
    if (titleError) {
      Alert.alert('Title Error', titleError);
      return;
    }

    // Check if still checking title
    if (isCheckingTitle) {
      Alert.alert('Please Wait', 'Checking title availability...');
      return;
    }
    
    if (trackingType === 'Quantitative' && (!unitText || unitText.trim().length === 0)) {
      Alert.alert('Validation Error', 'Unit text is required for quantitative flows');
      return;
    }

    const updates = {
      id: flow.id,
      title: title.trim(),
      description: description.trim(),
      trackingType,
      frequency,
      everyDay,
      daysOfWeek: frequency === 'Daily' || frequency === 'Monthly' ? selectedDays : [],
      reminderTime: reminderTimeEnabled && reminderTime ? reminderTime.toISOString() : null,
      reminderLevel,
      unitText: trackingType === 'Quantitative' ? unitText : undefined,
      hours: trackingType === 'Time-based' ? hours : undefined,
      minutes: trackingType === 'Time-based' ? minutes : undefined,
      seconds: trackingType === 'Time-based' ? seconds : undefined,
      goal: trackingType === 'Quantitative' ? goal : undefined,
      
      // Storage preference
      storagePreference,
      
      // v2 schema fields
      planId,
      progressMode,
      tags,
      archived,
      visibility,
      cheatMode,
      
      // Preserve existing fields
      status: flow.status || {},
      schemaVersion: flow.schemaVersion || 2,
      ownerId: flow.ownerId || 'user123',
      createdAt: flow.createdAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (!updateFlow) {
        Alert.alert('Error', 'Flow context not available. Please restart the app.');
        return;
      }
      
      await updateFlow(flow.id, updates);
      Alert.alert(
        'Success!', 
        'Flow updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('EditFlow: Failed to update flow:', error);
      Alert.alert('Error', 'Failed to update flow');
    }
  }, [
    title,
    description,
    trackingType,
    frequency,
    everyDay,
    selectedDays,
    reminderTimeEnabled,
    reminderTime,
    reminderLevel,
    unitText,
    hours,
    minutes,
    seconds,
    goal,
    planId,
    progressMode,
    tags,
    archived,
    visibility,
    cheatMode,
    flow.id,
    flow.status,
    flow.schemaVersion,
    flow.ownerId,
    flow.createdAt,
    updateFlow,
    navigation,
  ]);

  return (
    <SafeAreaWrapper style={styles.safeArea}>
      <StatusBar 
        translucent
        backgroundColor="transparent"
        barStyle="dark-content" 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.background }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: themeColors.cardBackground }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons name="chevron-back" size={20} color={themeColors.primaryText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>Edit Flow</Text>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: themeColors.cardBackground }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Cancel editing"
            accessibilityHint="Cancels editing and returns to previous screen"
          >
            <Text style={[styles.cancelButtonText, { color: themeColors.secondaryText }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <SafeAreaWrapper style={styles.contentWrapper} excludeTop={true} excludeBottom={true}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Title CardComponent */}
          <CardComponent variant="elevated" padding="md" margin="none">
            <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Flow Title</Text>
            <View style={styles.titleInputContainer}>
              <TextInput
                style={[
                  styles.modernInput,
                  { 
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.primaryText
                  },
                  titleError && { borderColor: themeColors.error, backgroundColor: themeColors.errorBackground },
                  isCheckingTitle && { borderColor: themeColors.warning, backgroundColor: themeColors.warningBackground }
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Read for 30 minutes"
                placeholderTextColor={themeColors.tertiaryText}
                maxLength={10}
                accessibilityLabel="Flow title input"
                accessibilityHint="Enter a unique name for your flow (max 10 characters)"
              />
              {isCheckingTitle && (
                <Text style={[styles.checkingText, { color: themeColors.warning }]}>Checking availability...</Text>
              )}
              {titleError && (
                <Text style={[styles.errorText, { color: themeColors.error }]}>{titleError}</Text>
              )}
            </View>
          </CardComponent>

          {/* Description CardComponent */}
          <CardComponent variant="elevated" padding="md" margin="none">
            <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Description</Text>
            <TextInput
              style={[
                styles.modernInput, 
                styles.textArea,
                { 
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.cardBackground,
                  color: themeColors.primaryText
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description about your flow..."
              placeholderTextColor={themeColors.tertiaryText}
              multiline
              numberOfLines={3}
              accessibilityLabel="Flow description input"
              accessibilityHint="Enter an optional description for your flow"
            />
          </CardComponent>

          {/* Storage Preference CardComponent */}
          <CardComponent variant="elevated" padding="md" margin="none">
            <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Storage Preference</Text>
            <Text style={[styles.storageSubtitle, { color: themeColors.secondaryText }]}>
              Current: {storagePreference === 'local' ? 'Local Only' : 'Cloud Sync'}
            </Text>
            
            <View style={styles.storageOptionsContainer}>
              {/* Local Storage Option */}
              <TouchableOpacity
                style={[
                  styles.storageOption,
                  { borderColor: themeColors.border, backgroundColor: themeColors.cardBackground },
                  storagePreference === 'local' && { borderColor: themeColors.primaryOrange, backgroundColor: themeColors.primaryOrange + '10' }
                ]}
                onPress={() => setStoragePreference('local')}
                accessibilityLabel="Local storage option"
                accessibilityHint="Store flow data locally on device only"
                accessibilityRole="button"
              >
                <View style={styles.storageOptionHeader}>
                  <Ionicons 
                    name="phone-portrait-outline" 
                    size={24} 
                    color={storagePreference === 'local' ? themeColors.primaryOrange : themeColors.secondaryText} 
                  />
                  <Text style={[
                    styles.storageOptionTitle,
                    { color: themeColors.primaryText },
                    storagePreference === 'local' && { color: themeColors.primaryOrange }
                  ]}>
                    Local Only
                  </Text>
                </View>
                <Text style={[
                  styles.storageOptionDescription,
                  { color: themeColors.secondaryText },
                  storagePreference === 'local' && { color: themeColors.primaryText }
                ]}>
                  • Stored on your device only
                </Text>
                <Text style={[
                  styles.storageOptionDescription,
                  { color: themeColors.secondaryText },
                  storagePreference === 'local' && { color: themeColors.primaryText }
                ]}>
                  • Works offline
                </Text>
                <Text style={[
                  styles.storageOptionDescription,
                  { color: themeColors.secondaryText },
                  storagePreference === 'local' && { color: themeColors.primaryText }
                ]}>
                  • Can be upgraded to cloud
                </Text>
                <Text style={[
                  styles.storageOptionDescription,
                  { color: themeColors.secondaryText },
                  storagePreference === 'local' && { color: themeColors.primaryText }
                ]}>
                  • Data lost if device is reset
                </Text>
              </TouchableOpacity>

              {/* Cloud Storage Option */}
              <TouchableOpacity
                style={[
                  styles.storageOption,
                  { borderColor: themeColors.border, backgroundColor: themeColors.cardBackground },
                  storagePreference === 'cloud' && { borderColor: themeColors.primaryOrange, backgroundColor: themeColors.primaryOrange + '10' }
                ]}
                onPress={() => {
                  if (flow.storagePreference === 'local') {
                    setShowUpgradeWarning(true);
                  }
                  setStoragePreference('cloud');
                }}
                accessibilityLabel="Cloud storage option"
                accessibilityHint="Store flow data in cloud database - cannot be reverted"
                accessibilityRole="button"
              >
                <View style={styles.storageOptionHeader}>
                  <Ionicons 
                    name="cloud-outline" 
                    size={24} 
                    color={storagePreference === 'cloud' ? themeColors.primaryOrange : themeColors.secondaryText} 
                  />
                  <Text style={[
                    styles.storageOptionTitle,
                    { color: themeColors.primaryText },
                    storagePreference === 'cloud' && { color: themeColors.primaryOrange }
                  ]}>
                    Cloud Sync
                  </Text>
                </View>
                <Text style={[
                  styles.storageOptionDescription,
                  { color: themeColors.secondaryText },
                  storagePreference === 'cloud' && { color: themeColors.primaryText }
                ]}>
                  • Synced across all devices
                </Text>
                <Text style={[
                  styles.storageOptionDescription,
                  { color: themeColors.secondaryText },
                  storagePreference === 'cloud' && { color: themeColors.primaryText }
                ]}>
                  • Backed up automatically
                </Text>
                <Text style={[
                  styles.storageOptionDescription,
                  { color: themeColors.secondaryText },
                  storagePreference === 'cloud' && { color: themeColors.primaryText }
                ]}>
                  • Requires internet connection
                </Text>
                <Text style={[
                  styles.storageOptionWarning,
                  { color: themeColors.warning },
                  storagePreference === 'cloud' && { color: themeColors.warning }
                ]}>
                  ⚠️ Cannot be reverted to local
                </Text>
              </TouchableOpacity>
            </View>

            {/* Upgrade Warning */}
            {showUpgradeWarning && flow.storagePreference === 'local' && storagePreference === 'cloud' && (
              <View style={[styles.warningContainer, { backgroundColor: themeColors.warning + '20', borderLeftColor: themeColors.warning }]}>
                <Ionicons name="warning-outline" size={20} color={themeColors.warning} />
                <Text style={[styles.warningText, { color: themeColors.warning }]}>
                  Upgrading to cloud storage cannot be reverted. Your flow will be synced across all devices and backed up automatically.
                </Text>
              </View>
            )}
          </CardComponent>

          {/* Tracking Type CardComponent */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Tracking Type</Text>
            <View style={styles.trackingTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.trackingTypeButton, 
                  { backgroundColor: themeColors.cardBackground, borderColor: 'transparent' },
                  trackingType === 'Binary' && { backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning }
                ]}
                onPress={() => setTrackingType('Binary')}
                accessibilityLabel="Select Binary tracking"
                accessibilityHint="Choose yes/no tracking for this flow"
              >
                <Text style={styles.trackingTypeIcon}>+</Text>
                <Text style={[
                  styles.trackingTypeText, 
                  { color: themeColors.secondaryText },
                  trackingType === 'Binary' && { color: themeColors.warning }
                ]}>
                  Binary
                </Text>
                <Text style={[styles.trackingTypeSubtext, { color: themeColors.tertiaryText }]}>Yes/No tracking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.trackingTypeButton, 
                  { backgroundColor: themeColors.cardBackground, borderColor: 'transparent' },
                  trackingType === 'Quantitative' && { backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning }
                ]}
                onPress={() => setTrackingType('Quantitative')}
                accessibilityLabel="Select Quantitative tracking"
                accessibilityHint="Choose numbers tracking for this flow"
              >
                <Text style={styles.trackingTypeIcon}>📊</Text>
                <Text style={[
                  styles.trackingTypeText, 
                  { color: themeColors.secondaryText },
                  trackingType === 'Quantitative' && { color: themeColors.warning }
                ]}>
                  Quantitative
                </Text>
                <Text style={[styles.trackingTypeSubtext, { color: themeColors.tertiaryText }]}>Numbers tracking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.trackingTypeButton, 
                  { backgroundColor: themeColors.cardBackground, borderColor: 'transparent' },
                  trackingType === 'Time-based' && { backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning }
                ]}
                onPress={() => setTrackingType('Time-based')}
                accessibilityLabel="Select Time-based tracking"
                accessibilityHint="Choose duration tracking for this flow"
              >
                <Text style={styles.trackingTypeIcon}>⏱️</Text>
                <Text style={[
                  styles.trackingTypeText, 
                  { color: themeColors.secondaryText },
                  trackingType === 'Time-based' && { color: themeColors.warning }
                ]}>
                  Time-based
                </Text>
                <Text style={[styles.trackingTypeSubtext, { color: themeColors.tertiaryText }]}>Duration tracking</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quantitative Settings */}
          {trackingType === 'Quantitative' && (
            <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Quantitative Settings</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.primaryText }]}>Unit</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      { 
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.cardBackground,
                        color: themeColors.primaryText
                      }
                    ]}
                    value={unitText}
                    onChangeText={setUnitText}
                    placeholder="e.g., glasses, steps"
                    placeholderTextColor={themeColors.tertiaryText}
                    accessibilityLabel="Unit text input"
                    accessibilityHint="Enter the unit of measurement for this flow"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.primaryText }]}>Goal (Optional)</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      { 
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.cardBackground,
                        color: themeColors.primaryText
                      }
                    ]}
                    value={goalInput}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/[^0-9]/g, '');
                      setGoalInput(cleanText);
                    }}
                    onBlur={() => {
                      const validation = validateNumericInput(goalInput, 0, 9999, 'Goal');
                      if (validation.valid) {
                        const num = parseInt(goalInput) || 0;
                        setGoal(num);
                        setGoalInput(num.toString());
                      } else {
                        Alert.alert('Invalid Input', validation.error);
                        setGoalInput('0');
                        setGoal(0);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="e.g., 8"
                    placeholderTextColor={themeColors.tertiaryText}
                    accessibilityLabel="Goal input"
                    accessibilityHint="Enter the daily goal for this flow"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Time-based Settings */}
          {trackingType === 'Time-based' && (
            <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Time Duration (Goal)</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.primaryText }]}>Hours</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      { 
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.cardBackground,
                        color: themeColors.primaryText
                      }
                    ]}
                    value={hoursInput}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/[^0-9]/g, '');
                      setHoursInput(cleanText);
                    }}
                    onBlur={() => {
                      const validation = validateNumericInput(hoursInput, 0, 23, 'Hours');
                      if (validation.valid) {
                        const num = parseInt(hoursInput) || 0;
                        setHours(num);
                        setHoursInput(num.toString().padStart(2, '0'));
                      } else {
                        Alert.alert('Invalid Input', validation.error);
                        setHoursInput('00');
                        setHours(0);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="00"
                    placeholderTextColor={themeColors.tertiaryText}
                    accessibilityLabel="Hours input"
                    accessibilityHint="Enter the number of hours for this flow"
                  />
                </View>
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.primaryText }]}>Minutes</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      { 
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.cardBackground,
                        color: themeColors.primaryText
                      }
                    ]}
                    value={minutesInput}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/[^0-9]/g, '');
                      setMinutesInput(cleanText);
                    }}
                    onBlur={() => {
                      const validation = validateNumericInput(minutesInput, 0, 59, 'Minutes');
                      if (validation.valid) {
                        const num = parseInt(minutesInput) || 0;
                        setMinutes(num);
                        setMinutesInput(num.toString().padStart(2, '0'));
                      } else {
                        Alert.alert('Invalid Input', validation.error);
                        setMinutesInput('00');
                        setMinutes(0);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="00"
                    placeholderTextColor={themeColors.tertiaryText}
                    accessibilityLabel="Minutes input"
                    accessibilityHint="Enter the number of minutes for this flow"
                  />
                </View>
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.inputLabel, { color: themeColors.primaryText }]}>Seconds</Text>
                  <TextInput
                    style={[
                      styles.modernInput,
                      { 
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.cardBackground,
                        color: themeColors.primaryText
                      }
                    ]}
                    value={secondsInput}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/[^0-9]/g, '');
                      setSecondsInput(cleanText);
                    }}
                    onBlur={() => {
                      const validation = validateNumericInput(secondsInput, 0, 59, 'Seconds');
                      if (validation.valid) {
                        const num = parseInt(secondsInput) || 0;
                        setSeconds(num);
                        setSecondsInput(num.toString().padStart(2, '0'));
                      } else {
                        Alert.alert('Invalid Input', validation.error);
                        setSecondsInput('00');
                        setSeconds(0);
                      }
                    }}
                    keyboardType="numeric"
                    placeholder="00"
                    placeholderTextColor={themeColors.tertiaryText}
                    accessibilityLabel="Seconds input"
                    accessibilityHint="Enter the number of seconds for this flow"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Frequency CardComponent */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Frequency</Text>
            <View style={styles.frequencyContainer}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton, 
                  { backgroundColor: themeColors.cardBackground, borderColor: 'transparent' },
                  frequency === 'Daily' && { backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning }
                ]}
                onPress={() => setFrequency('Daily')}
                accessibilityLabel="Select Daily frequency"
                accessibilityHint="Choose daily tracking for this flow"
              >
                <Text style={[
                  styles.frequencyText, 
                  { color: themeColors.secondaryText },
                  frequency === 'Daily' && { color: themeColors.warning }
                ]}>
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.frequencyButton, 
                  { backgroundColor: themeColors.cardBackground, borderColor: 'transparent' },
                  frequency === 'Monthly' && { backgroundColor: themeColors.warningBackground, borderColor: themeColors.warning }
                ]}
                onPress={() => setFrequency('Monthly')}
                accessibilityLabel="Select Monthly frequency"
                accessibilityHint="Choose monthly tracking for this flow"
              >
                <Text style={[
                  styles.frequencyText, 
                  { color: themeColors.secondaryText },
                  frequency === 'Monthly' && { color: themeColors.warning }
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Days Selection CardComponent */}
          {frequency === 'Daily' && (
            <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Schedule</Text>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: themeColors.primaryText }]}>Every Day</Text>
                <Switch
                  style={styles.toggleSwitch}
                  value={everyDay}
                  onValueChange={setEveryDay}
                  trackColor={{ false: themeColors.border, true: themeColors.warning }}
                  thumbColor={themeColors.cardBackground}
                  accessibilityLabel="Toggle every day"
                  accessibilityHint="Enable or disable tracking every day"
                />
              </View>
              {!everyDay && (
                <View style={styles.daysContainer}>
                  <Text style={[styles.inputLabel, { color: themeColors.primaryText }]}>Days of Week</Text>
                  <View style={styles.daysGrid}>
                    {daysOfWeek.map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleDay(day)}
                        style={[
                          styles.dayButton,
                          { backgroundColor: themeColors.cardBackground, borderColor: themeColors.border },
                          selectedDays.includes(day) && { backgroundColor: themeColors.warning, borderColor: themeColors.warning }
                        ]}
                        accessibilityLabel={`Toggle ${day}`}
                        accessibilityHint={`Select or deselect ${day} for tracking`}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            { color: themeColors.secondaryText },
                            selectedDays.includes(day) && { color: themeColors.onWarning }
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {frequency === 'Monthly' && (
            <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Days of Month</Text>
              <View style={styles.monthDaysGrid}>
                {daysInMonth.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayButton,
                      { backgroundColor: themeColors.cardBackground, borderColor: themeColors.border },
                      selectedDays.includes(day) && { backgroundColor: themeColors.warning, borderColor: themeColors.warning }
                    ]}
                    accessibilityLabel={`Toggle day ${day}`}
                    accessibilityHint={`Select or deselect day ${day} for tracking`}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        { color: themeColors.secondaryText },
                        selectedDays.includes(day) && { color: themeColors.onWarning }
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Reminder Time CardComponent */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Reminder</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: themeColors.primaryText }]}>Enable Reminder</Text>
              <Switch
                style={styles.toggleSwitch}
                value={reminderTimeEnabled}
                onValueChange={setReminderTimeEnabled}
                trackColor={{ false: themeColors.border, true: themeColors.warning }}
                thumbColor={themeColors.cardBackground}
                accessibilityLabel="Toggle reminder"
                accessibilityHint="Enable or disable daily reminders for this flow"
              />
            </View>
            {reminderTimeEnabled && (
              <>
                <TouchableOpacity
                  style={[
                    styles.timePickerButton,
                    { 
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.cardBackground
                    }
                  ]}
                  onPress={() => setShowTimePicker(true)}
                  accessibilityLabel="Set reminder time"
                  accessibilityHint="Choose the time for daily reminders"
                >
                  <Text style={[styles.timePickerText, { color: themeColors.primaryText }]}>
                    {reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
                  </Text>
                </TouchableOpacity>
                
                {/* Reminder Level Section */}
                <View style={styles.reminderLevelSection}>
                  <Text style={[styles.reminderLevelLabel, { color: themeColors.primaryText }]}>Reminder Level</Text>
                  <Text style={[styles.reminderLevelDescription, { color: themeColors.secondaryText }]}>
                    Choose the intensity of your reminder
                  </Text>
                  <View style={styles.reminderLevelButtons}>
                    {[
                      { level: '1', label: 'Notification', description: 'Gentle notification' },
                      { level: '2', label: 'Alert', description: 'Persistent alert with sound' },
                      { level: '3', label: 'Alarm', description: 'Loud alarm with snooze' }
                    ].map(({ level, label, description }) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.reminderLevelButton,
                          { 
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.cardBackground
                          },
                          reminderLevel === level && {
                            borderColor: themeColors.primaryOrange,
                            backgroundColor: themeColors.primaryOrangeBackground || '#FFF3E0'
                          }
                        ]}
                        onPress={() => setReminderLevel(level)}
                        accessibilityLabel={`Set reminder level to ${label}`}
                        accessibilityHint={`Sets reminder intensity to ${description}`}
                      >
                        <Text style={[
                          styles.reminderLevelButtonText,
                          { color: themeColors.primaryText },
                          reminderLevel === level && { color: themeColors.primaryOrange }
                        ]}>
                          {label}
                        </Text>
                        <Text style={[
                          styles.reminderLevelButtonDescription,
                          { color: themeColors.secondaryText },
                          reminderLevel === level && { color: themeColors.primaryOrange }
                        ]}>
                          {description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Cheat Mode CardComponent */}
          <View style={[styles.card, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: themeColors.primaryText }]}>Cheat Mode</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: themeColors.primaryText }]}>Enable Cheat Mode</Text>
              <Switch
                style={styles.toggleSwitch}
                value={cheatMode}
                onValueChange={setCheatMode}
                trackColor={{ false: themeColors.border, true: themeColors.warning }}
                thumbColor={themeColors.cardBackground}
                accessibilityLabel="Toggle cheat mode"
                accessibilityHint="Enable or disable cheat mode for this flow"
              />
            </View>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={reminderTime || new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setReminderTime(selectedTime);
                }
              }}
            />
          )}

          {/* Update Button - After reminder section */}
          <View style={styles.saveButtonContainer}>
            <Button
              variant="primary"
              size="large"
              title={isCheckingTitle ? 'Checking...' : 'Update Flow'}
              onPress={handleSave}
              disabled={!!titleError || isCheckingTitle}
              fullWidth={true}
              testID="update-flow-button"
              accessibilityLabel="Update flow"
              accessibilityHint="Updates the current flow with new settings"
            />
          </View>

          </ScrollView>
        </SafeAreaWrapper>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.lg,
  },
  errorText: {
    ...typography.styles.title3,
    fontWeight: 'bold',
    marginBottom: layout.spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    width: layout?.components?.button?.primary?.iconSize || 20,
    height: layout?.components?.button?.primary?.iconSize || 20,
    borderRadius: layout.radii.squircle,
    alignItems: 'center',
    justifyContent: 'center',
    ...layout.elevation.low,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.md,
    paddingBottom: 0, // Remove bottom padding to eliminate unwanted space
    minHeight: 60, // Ensure consistent header height
  },
  headerTitle: {
    ...typography.styles.title2,
  },
  cancelButton: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.radii.squircle,
    ...layout.elevation.low,
  },
  cancelButtonText: {
    ...typography.styles.body,
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing.md,
    paddingTop: 0, // Remove top padding to eliminate unwanted space above first card
    paddingBottom: 0, // Remove bottom padding since we're excluding bottom safe area
    gap: layout.spacing.xs, // Minimal spacing between cards (4px)
  },
  cardTitle: {
    ...typography.styles.title3,
    marginBottom: layout.spacing.xs, // Reduced from sm (8px) to xs (4px)
  },
  titleInputContainer: {
    position: 'relative',
  },
  errorText: {
    ...typography.styles.caption1,
    marginTop: layout.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  checkingText: {
    ...typography.styles.caption1,
    marginTop: layout.spacing.xs,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  card: {
    borderRadius: layout.radii.large,
    padding: layout.spacing.md, // Reduced from lg (20px) to md (12px)
    // Removed marginBottom to use gap spacing instead
    ...layout.elevation.low,
  },
  modernInput: {
    borderWidth: 1,
    borderRadius: layout.radii.squircle,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    ...typography.styles.body,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  storageSubtitle: {
    ...typography.styles.caption1,
    marginBottom: layout.spacing.md,
  },
  storageOptionsContainer: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  storageOption: {
    flex: 1,
    padding: layout.spacing.md,
    borderRadius: layout.radii.squircle,
    borderWidth: 2,
  },
  storageOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  storageOptionTitle: {
    ...typography.styles.body,
    fontWeight: typography.weights.semibold,
    marginLeft: layout.spacing.xs,
  },
  storageOptionDescription: {
    ...typography.styles.caption1,
    marginBottom: layout.spacing.xs,
  },
  storageOptionWarning: {
    ...typography.styles.caption1,
    fontWeight: typography.weights.semibold,
    marginTop: layout.spacing.xs,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: layout.spacing.md,
    padding: layout.spacing.sm,
    borderRadius: layout.radii.squircle,
    borderLeftWidth: 3,
  },
  warningText: {
    ...typography.styles.caption1,
    marginLeft: layout.spacing.xs,
    flex: 1,
    lineHeight: 18,
  },
  trackingTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackingTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.sm,
    marginHorizontal: layout.spacing.xs,
    borderRadius: layout.radii.base,
    borderWidth: 2,
  },
  trackingTypeIcon: {
    fontSize: 24,
    marginBottom: layout.spacing.sm,
  },
  trackingTypeText: {
    ...typography.styles.caption1,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  trackingTypeSubtext: {
    ...typography.styles.caption2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: layout.spacing.xs,
  },
  inputLabel: {
    ...typography.styles.caption1,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputGroup: {
    flex: 1,
    marginHorizontal: layout.spacing.xs,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
    marginHorizontal: layout.spacing.xs,
    borderRadius: layout.radii.base,
    borderWidth: 2,
    alignItems: 'center',
  },
  frequencyText: {
    ...typography.styles.body,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Removed marginBottom to eliminate extra bottom spacing
  },
  toggleLabel: {
    ...typography.styles.body,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  toggleSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  daysContainer: {
    marginTop: layout.spacing.xs, // Reduced from md (12px) to xs (4px)
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: layout.radii.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.spacing.sm,
  },
  dayButtonText: {
    ...typography.styles.caption2,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timePickerButton: {
    borderWidth: 1,
    borderRadius: layout.radii.base,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
  },
  timePickerText: {
    ...typography.styles.body,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  saveButtonContainer: {
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.xs, // Reduced to minimal spacing (4px)
    paddingBottom: layout.spacing.xs, // Reduced to minimal spacing (4px)
    marginTop: 0, // Remove margin completely
  },
  reminderLevelSection: {
    marginTop: layout.spacing.md,
    paddingTop: layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  reminderLevelLabel: {
    fontSize: typography.styles.body.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  reminderLevelDescription: {
    fontSize: typography.styles.caption1.fontSize,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.sm,
  },
  reminderLevelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layout.spacing.xs,
  },
  reminderLevelButton: {
    flex: 1,
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.cardBackground,
    alignItems: 'center',
  },
  reminderLevelButtonText: {
    fontSize: typography.styles.caption1.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.light.primaryText,
    marginBottom: 2,
  },
  reminderLevelButtonDescription: {
    fontSize: typography.styles.caption2.fontSize,
    color: colors.light.secondaryText,
    textAlign: 'center',
  },
});

export default EditFlowScreen;