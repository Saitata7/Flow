import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import TimePicker from '../../components/TimePicker';
import { FlowsContext } from '../../context/FlowContext';
import { useRoute } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { validateNumericInput } from '../../utils/validation';
import Card from '../../components/common/card';
import Button from '../../components/common/Button';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { colors, typography, layout } from '../../../styles';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const predefinedUnits = [
  'glasses',
  'steps',
  'pages',
  'minutes',
  'hours',
  'cups',
  'servings',
  'reps',
  'sets',
  'miles',
  'km',
  'lbs',
  'kg',
  'calories',
  'times',
  'other'
];

export default function AddFlow({ navigation }) {
  const flowsContext = useContext(FlowsContext);
  const { addFlow, flows } = flowsContext || {};
  const { user } = useAuth();
  const route = useRoute();
  const { flowToEdit } = route.params || {};
  const insets = useSafeAreaInsets();

  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackingType, setTrackingType] = useState('Binary');
  const [frequency, setFrequency] = useState('Daily');
  const [everyDay, setEveryDay] = useState(true); // Default to Every Day for Daily flows
  const [selectedDays, setSelectedDays] = useState([]);
  const [reminderTimeEnabled, setReminderTimeEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderLevel, setReminderLevel] = useState('1');
  const [unitText, setUnitText] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [goal, setGoal] = useState(0);
  const [hoursInput, setHoursInput] = useState('00');
  const [minutesInput, setMinutesInput] = useState('00');
  const [secondsInput, setSecondsInput] = useState('00');
  const [goalInput, setGoalInput] = useState('0');
  
  // New state for title validation
  const [titleError, setTitleError] = useState('');
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);

  // v2 schema fields
  const [planId, setPlanId] = useState(null);

  useEffect(() => {
    if (flowToEdit) {
      // Editing existing flow - populate with existing data
      console.log('AddFlow: Editing existing flow:', flowToEdit.title);
      setTitle(flowToEdit.title || '');
      setDescription(flowToEdit.description || '');
      setTrackingType(flowToEdit.trackingType || 'Binary');
      setFrequency(flowToEdit.frequency || 'Daily');
      setEveryDay(flowToEdit.everyDay || false);
      setSelectedDays(flowToEdit.daysOfWeek || []);
      setReminderTimeEnabled(!!flowToEdit.reminderTime);
      setReminderTime(flowToEdit.reminderTime ? new Date(flowToEdit.reminderTime) : null);
      setReminderLevel(flowToEdit.reminderLevel?.toString() || '1');
      setUnitText(flowToEdit.unitText || '');
      setSelectedUnit(flowToEdit.unitText || '');
      if (flowToEdit.hours !== undefined) {
        setHours(flowToEdit.hours);
        setHoursInput(flowToEdit.hours.toString().padStart(2, '0'));
      }
      if (flowToEdit.minutes !== undefined) {
        setMinutes(flowToEdit.minutes);
        setMinutesInput(flowToEdit.minutes.toString().padStart(2, '0'));
      }
      if (flowToEdit.seconds !== undefined) {
        setSeconds(flowToEdit.seconds);
        setSecondsInput(flowToEdit.seconds.toString().padStart(2, '0'));
      }
      if (flowToEdit.trackingType === 'Quantitative' && flowToEdit.goal !== undefined) {
        setGoal(flowToEdit.goal);
        setGoalInput(flowToEdit.goal.toString());
      }
      
      // Populate v2 schema fields
      setPlanId(flowToEdit.planId || null);
      
      // Clear validation state when editing
      setTitleError('');
      setIsCheckingTitle(false);
    } else {
      // Creating new flow - use resetForm function
      console.log('AddFlow: Creating new flow, resetting form');
      resetForm();
    }
  }, [flowToEdit, resetForm]);

  // Reset form when screen is focused (only for new flows, not editing)
  useFocusEffect(
    useCallback(() => {
      if (!flowToEdit) {
        console.log('AddFlow: Screen focused, resetting form for new flow');
        resetForm();
      }
    }, [flowToEdit, resetForm])
  );

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
    if (flowToEdit && flowToEdit.title.toLowerCase().trim() === titleToCheck.toLowerCase().trim()) {
      setTitleError('');
      return;
    }

    // Check if flows context is available
    if (!flows || !Array.isArray(flows)) {
      console.log('AddFlow: Flows context not available or not an array:', flows);
      setTitleError('');
      return;
    }

    setIsCheckingTitle(true);
    setTitleError('');

    try {
      // Debug: Log all flows to see what we're checking against
      console.log('AddFlow: Checking title availability for:', titleToCheck);
      console.log('AddFlow: All flows in context:', flows.map(f => ({ 
        id: f.id, 
        title: f.title, 
        deletedAt: f.deletedAt, 
        archived: f.archived 
      })));
      
      // Check against existing flows
      const existingFlow = flows.find(existingFlow => 
        !existingFlow.deletedAt && 
        !existingFlow.archived &&
        existingFlow.title.toLowerCase().trim() === titleToCheck.toLowerCase().trim()
      );

      console.log('AddFlow: Found existing flow:', existingFlow);

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
  }, [flows, flowToEdit]);

  // Debounced title checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkTitleAvailability(title);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [title, checkTitleAvailability]);

  // Function to suggest alternative titles
  const suggestAlternativeTitles = (originalTitle) => {
    const suggestions = [
      `${originalTitle} (2)`,
      `${originalTitle} - New`,
      `${originalTitle} - 2024`,
      `My ${originalTitle}`,
      `${originalTitle} Daily`,
      `${originalTitle} Habit`
    ];

    Alert.alert(
      'Suggested Titles',
      'Here are some alternative titles you could use:\n\n' + suggestions.join('\n'),
      [
        { text: 'Cancel', style: 'cancel' },
        ...suggestions.map((suggestion, index) => ({
          text: suggestion,
          onPress: () => setTitle(suggestion)
        }))
      ]
    );
  };

  // Function to reset form to default values
  const resetForm = useCallback(() => {
    console.log('AddFlow: Resetting form to default values');
    setTitle('');
    setDescription('');
    setTrackingType('Binary');
    setFrequency('Daily');
    setEveryDay(true);
    setSelectedDays([]);
    setReminderTimeEnabled(false);
    setReminderTime(null);
    setShowTimePicker(false);
    setReminderLevel('1');
    setUnitText('');
    setSelectedUnit('');
    setShowUnitDropdown(false);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setGoal(0);
    setHoursInput('00');
    setMinutesInput('00');
    setSecondsInput('00');
    setGoalInput('0');
    setPlanId(null);
    
    // Reset validation state
    setTitleError('');
    setIsCheckingTitle(false);
  }, []);

  const handleUnitSelection = (unit) => {
    if (unit === 'other') {
      setSelectedUnit('other');
      setUnitText('');
      setShowUnitDropdown(false);
    } else {
      setSelectedUnit(unit);
      setUnitText(unit);
      setShowUnitDropdown(false);
    }
  };

  const handleDurationChange = (selectedHours, selectedMinutes) => {
    setHours(selectedHours);
    setMinutes(selectedMinutes);
    setHoursInput(selectedHours.toString().padStart(2, '0'));
    setMinutesInput(selectedMinutes.toString().padStart(2, '0'));
  };

  const handleSave = async () => {
    console.log('AddFlow: handleSave called with:', {
      title,
      frequency,
      everyDay,
      selectedDays,
      trackingType,
      unitText
    });
    
    // Basic validation
    if (!title || title.trim().length < 3) {
      console.log('AddFlow: Title validation failed');
      Alert.alert('Validation Error', 'Title must be at least 3 characters');
      return;
    }

    if (title.trim().length > 10) {
      console.log('AddFlow: Title too long');
      Alert.alert('Validation Error', 'Title must be 10 characters or less');
      return;
    }

    // Check for title error
    if (titleError) {
      console.log('AddFlow: Title error exists, preventing save');
      Alert.alert('Title Error', titleError);
      return;
    }

    // Check if still checking title
    if (isCheckingTitle) {
      console.log('AddFlow: Still checking title, please wait');
      Alert.alert('Please Wait', 'Checking title availability...');
      return;
    }
    
    // Frequency validation
    if (!frequency) {
      console.log('AddFlow: Frequency validation failed');
      Alert.alert('Validation Error', 'Please select a frequency (Daily, Weekly, or Monthly)');
      return;
    }
    
    // Days selection validation based on frequency
    if (frequency === 'Daily' && !everyDay && selectedDays.length === 0) {
      console.log('AddFlow: Daily days validation failed - everyDay:', everyDay, 'selectedDays:', selectedDays);
      Alert.alert('Validation Error', 'Please select at least one day of the week or enable "Every Day"');
      return;
    }
    
    if (frequency === 'Weekly' && selectedDays.length === 0) {
      console.log('AddFlow: Weekly days validation failed');
      Alert.alert('Validation Error', 'Please select at least one day of the week');
      return;
    }
    
    if (frequency === 'Monthly' && selectedDays.length === 0) {
      console.log('AddFlow: Monthly days validation failed');
      Alert.alert('Validation Error', 'Please select at least one day of the month');
      return;
    }
    
    if (trackingType === 'Quantitative' && (!unitText || unitText.trim().length === 0)) {
      console.log('AddFlow: Unit text validation failed');
      Alert.alert('Validation Error', 'Unit text is required for quantitative flows');
      return;
    }
    
    console.log('AddFlow: All validations passed, proceeding to create flow');

    // Create as a flow
    const newFlow = {
      id: flowToEdit?.id || Date.now().toString(),
      title: title.trim(), // Trim whitespace from title
      description,
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
      goal: trackingType === 'Quantitative' ? goal : null,
      planId,
      ownerId: user?.id || 'user123',
      schemaVersion: 2,
    };

    try {
      if (!addFlow) {
        Alert.alert('Error', 'Flow context not available. Please restart the app.');
        return;
      }
      
      console.log('AddFlow: About to call addFlow with:', newFlow);
      await addFlow(newFlow);
      console.log('AddFlow: addFlow completed successfully');
      
      // Reset form after successful creation
      resetForm();
      
      Alert.alert('Success!', 'Flow created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error('AddFlow: Error caught in try-catch:', e);
      console.log('AddFlow: Error message:', e.message);
      console.log('AddFlow: Error type:', typeof e);
      console.log('AddFlow: Error stack:', e.stack);
      
      // Check if it's a duplicate title error
      if (e.message && e.message.includes('already exists')) {
        console.log('AddFlow: Showing duplicate title alert');
        Alert.alert(
          'Title Already Exists', 
          `A flow with the title "${title}" already exists. Please choose a different title.`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Suggest Alternatives', 
              onPress: () => suggestAlternativeTitles(title)
            }
          ]
        );
        return; // Important: return here to prevent further execution
      } else {
        console.log('AddFlow: Showing generic error alert');
        Alert.alert('Error', 'Failed to save flow. Please try again.');
        return; // Important: return here to prevent further execution
      }
    }
  };

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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Flow</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.contentWrapper}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Title Card */}
          <Card variant="elevated" padding="md" margin="sm">
            <Text style={styles.cardTitle}>Flow Title</Text>
            <View style={styles.titleInputContainer}>
              <TextInput
                style={[
                  styles.modernInput,
                  titleError && styles.inputError,
                  isCheckingTitle && styles.inputChecking
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Read for 30 minutes"
                placeholderTextColor={colors.light.tertiaryText}
                maxLength={10}
                accessibilityLabel="Flow title input"
                accessibilityHint="Enter a unique name for your flow (max 10 characters)"
              />
              {isCheckingTitle && (
                <Text style={styles.checkingText}>Checking availability...</Text>
              )}
              {titleError && (
                <Text style={styles.errorText}>{titleError}</Text>
              )}
            </View>
          </Card>

          {/* Description Card */}
          <Card variant="elevated" padding="md" margin="sm">
            <Text style={styles.cardTitle}>Description</Text>
            <TextInput
              style={[styles.modernInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description about your flow..."
              placeholderTextColor={colors.light.tertiaryText}
              multiline
              numberOfLines={3}
              accessibilityLabel="Flow description input"
              accessibilityHint="Enter an optional description for your flow"
            />
          </Card>

          {/* Tracking Type Card */}
          <Card variant="elevated" padding="md" margin="sm">
            <Text style={styles.cardTitle}>Tracking Type</Text>
            <View style={styles.trackingTypeContainer}>
              <TouchableOpacity
                style={[styles.trackingTypeButton, trackingType === 'Binary' && styles.trackingTypeButtonSelected]}
                onPress={() => setTrackingType('Binary')}
                accessibilityLabel="Binary tracking type"
                accessibilityHint="Select binary yes/no tracking for your flow"
                accessibilityRole="button"
              >
                <Text style={styles.trackingTypeIcon}>✓</Text>
                <Text style={[styles.trackingTypeText, trackingType === 'Binary' && styles.trackingTypeTextSelected]}>
                  Binary
                </Text>
                <Text style={styles.trackingTypeSubtext}>Yes/No tracking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.trackingTypeButton, trackingType === 'Quantitative' && styles.trackingTypeButtonSelected]}
                onPress={() => setTrackingType('Quantitative')}
                accessibilityLabel="Quantitative tracking type"
                accessibilityHint="Select quantitative number tracking for your flow"
                accessibilityRole="button"
              >
                <Text style={styles.trackingTypeIcon}>📊</Text>
                <Text style={[styles.trackingTypeText, trackingType === 'Quantitative' && styles.trackingTypeTextSelected]}>
                  Quantitative
                </Text>
                <Text style={styles.trackingTypeSubtext}>Numbers tracking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.trackingTypeButton, trackingType === 'Time-based' && styles.trackingTypeButtonSelected]}
                onPress={() => setTrackingType('Time-based')}
                accessibilityLabel="Time-based tracking type"
                accessibilityHint="Select time-based duration tracking for your flow"
                accessibilityRole="button"
              >
                <Text style={styles.trackingTypeIcon}>⏱️</Text>
                <Text style={[styles.trackingTypeText, trackingType === 'Time-based' && styles.trackingTypeTextSelected]}>
                  Time-based
                </Text>
                <Text style={styles.trackingTypeSubtext}>Duration tracking</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Quantitative Settings */}
          {trackingType === 'Quantitative' && (
            <Card variant="elevated" padding="md" margin="sm" style={{ overflow: 'visible' }}>
              <Text style={styles.cardTitle}>Quantitative Settings</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.modernInput}
                    value={unitText}
                    onChangeText={setUnitText}
                    placeholder="e.g., pages, minutes, cups"
                    placeholderTextColor={colors.light.tertiaryText}
                    accessibilityLabel="Unit input"
                    accessibilityHint="Enter the unit for your quantitative tracking"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Goal (Optional)</Text>
                  <TextInput
                    style={styles.modernInput}
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
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </Card>
          )}

          {/* Time-based Settings */}
          {trackingType === 'Time-based' && (
            <Card variant="elevated" padding="md" margin="sm">
              <Text style={styles.cardTitle}>Time Duration (Goal)</Text>
              <TimePicker
                initialHours={hours}
                initialMinutes={minutes}
                onTimeChange={handleDurationChange}
                style={styles.timePickerContainer}
              />
            </Card>
          )}

          {/* Frequency Card */}
          <Card variant="elevated" padding="md" margin="sm">
            <Text style={styles.cardTitle}>Frequency</Text>
            <View style={styles.frequencyContainer}>
              <TouchableOpacity
                style={[styles.frequencyButton, frequency === 'Daily' && styles.frequencyButtonSelected]}
                onPress={() => setFrequency('Daily')}
                accessibilityLabel="Daily frequency"
                accessibilityHint="Set flow to occur daily"
                accessibilityRole="button"
              >
                <Text style={[styles.frequencyText, frequency === 'Daily' && styles.frequencyTextSelected]}>
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.frequencyButton, frequency === 'Monthly' && styles.frequencyButtonSelected]}
                onPress={() => setFrequency('Monthly')}
                accessibilityLabel="Monthly frequency"
                accessibilityHint="Set flow to occur monthly"
                accessibilityRole="button"
              >
                <Text style={[styles.frequencyText, frequency === 'Monthly' && styles.frequencyTextSelected]}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Days Selection Card */}
          {frequency === 'Daily' && (
            <Card variant="elevated" padding="md" margin="sm">
              <Text style={styles.cardTitle}>Schedule</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Every Day</Text>
                <Switch
                  style={styles.toggleSwitch}
                  value={everyDay}
                  onValueChange={setEveryDay}
                  trackColor={{ false: colors.light.border, true: colors.light.primaryOrange }}
                  thumbColor={colors.light.cardBackground}
                  accessibilityLabel="Every day toggle"
                  accessibilityHint="Toggles whether the flow occurs every day"
                />
              </View>
              {!everyDay && (
                <View style={styles.daysContainer}>
                  <Text style={styles.inputLabel}>Days of Week</Text>
                  <View style={styles.daysGrid}>
                    {daysOfWeek.map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleDay(day)}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day) && styles.dayButtonSelected,
                        ]}
                        accessibilityLabel={`${day} day selection`}
                        accessibilityHint={`Toggle ${day} for flow schedule`}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            selectedDays.includes(day) && styles.dayButtonTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          )}

          {frequency === 'Monthly' && (
            <Card variant="elevated" padding="md" margin="sm">
              <Text style={styles.cardTitle}>Days of Month</Text>
              <View style={styles.monthDaysGrid}>
                {daysInMonth.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day) && styles.dayButtonSelected,
                    ]}
                    accessibilityLabel={`Day ${day} selection`}
                    accessibilityHint={`Toggle day ${day} for monthly flow schedule`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDays.includes(day) && styles.dayButtonTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Reminder Time Card */}
          <Card variant="elevated" padding="md" margin="sm">
            <Text style={styles.cardTitle}>Reminder</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Reminder</Text>
              <Switch
                style={styles.toggleSwitch}
                value={reminderTimeEnabled}
                onValueChange={setReminderTimeEnabled}
                trackColor={{ false: colors.light.border, true: colors.light.primaryOrange }}
                thumbColor={colors.light.cardBackground}
                accessibilityLabel="Enable reminder toggle"
                accessibilityHint="Toggles reminder notifications for this flow"
              />
            </View>
            {reminderTimeEnabled && (
              <>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                  accessibilityLabel="Set reminder time"
                  accessibilityHint="Opens time picker to set reminder time"
                  accessibilityRole="button"
                >
                  <Text style={styles.timePickerText}>
                    {reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
                  </Text>
                </TouchableOpacity>
                
                {/* Reminder Level Section */}
                <View style={styles.reminderLevelSection}>
                  <Text style={styles.reminderLevelLabel}>Reminder Level</Text>
                  <Text style={styles.reminderLevelDescription}>
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
                          reminderLevel === level && styles.reminderLevelButtonSelected
                        ]}
                        onPress={() => setReminderLevel(level)}
                        accessibilityLabel={`Set reminder level to ${label}`}
                        accessibilityHint={`Sets reminder intensity to ${description}`}
                      >
                        <Text style={[
                          styles.reminderLevelButtonText,
                          reminderLevel === level && styles.reminderLevelButtonTextSelected
                        ]}>
                          {label}
                        </Text>
                        <Text style={[
                          styles.reminderLevelButtonDescription,
                          reminderLevel === level && styles.reminderLevelButtonDescriptionSelected
                        ]}>
                          {description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </Card>


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

          </ScrollView>
        </View>

        {/* Save Button - Fixed at bottom above tab bar */}
        <View style={styles.saveButtonContainer}>
          <Button
            variant="primary"
            size="large"
            title={isCheckingTitle ? 'Checking...' : (flowToEdit ? 'Update Flow' : 'Save Flow')}
            onPress={handleSave}
            disabled={!!titleError || isCheckingTitle}
            fullWidth={true}
            testID="save-flow-button"
            accessibilityLabel={flowToEdit ? 'Update flow' : 'Save flow'}
            accessibilityHint={flowToEdit ? 'Updates the current flow with new settings' : 'Creates a new flow with the current settings'}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.md,
    paddingBottom: layout.spacing.md,
    backgroundColor: colors.light.background,
    minHeight: 60, // Ensure consistent header height
  },
  backButton: {
    width: layout.button.iconSize,
    height: layout.button.iconSize,
    borderRadius: layout.squircle.borderRadius,
    backgroundColor: colors.light.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...layout.shadows.buttonShadow,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light.primaryText,
  },
  headerTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
  },
  placeholder: {
    width: layout.button.iconSize,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing.md,
    paddingBottom: layout.spacing.lg, // Extra padding at bottom of scroll
  },
  cardTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
  },
  modernInput: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.squircle.borderRadius,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    fontSize: typography.styles.body.fontSize,
    color: colors.light.primaryText,
    backgroundColor: colors.light.cardBackground,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  trackingTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackingTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trackingTypeButtonSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  trackingTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  trackingTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  trackingTypeTextSelected: {
    color: '#92400E',
  },
  trackingTypeSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
    zIndex: 1,
    overflow: 'visible',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  frequencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  frequencyTextSelected: {
    color: '#92400E',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  toggleSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  daysContainer: {
    marginTop: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.squircle.borderRadius,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    backgroundColor: colors.light.cardBackground,
    marginTop: layout.spacing.sm,
  },
  timePickerText: {
    fontSize: typography.styles.body.fontSize,
    color: colors.light.primaryText,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  saveButtonContainer: {
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.md,
    paddingBottom: layout.spacing.md,
    backgroundColor: colors.light.background,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    // SafeAreaWrapper will handle the bottom safe area automatically
  },
  saveButtonGradient: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timePickerContainer: {
    marginTop: 8,
  },
  titleInputContainer: {
    position: 'relative',
  },
  inputError: {
    borderColor: colors.light.error,
    backgroundColor: colors.light.errorBackground,
  },
  inputChecking: {
    borderColor: colors.light.warning,
    backgroundColor: colors.light.warningBackground,
  },
  errorText: {
    color: colors.light.error,
    fontSize: typography.styles.caption1.fontSize,
    marginTop: layout.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  checkingText: {
    color: colors.light.warning,
    fontSize: typography.styles.caption1.fontSize,
    marginTop: layout.spacing.xs,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
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
  reminderLevelButtonSelected: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrangeBackground || '#FFF3E0',
  },
  reminderLevelButtonText: {
    fontSize: typography.styles.caption1.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.light.primaryText,
    marginBottom: 2,
  },
  reminderLevelButtonTextSelected: {
    color: colors.light.primaryOrange,
  },
  reminderLevelButtonDescription: {
    fontSize: typography.styles.caption2.fontSize,
    color: colors.light.secondaryText,
    textAlign: 'center',
  },
  reminderLevelButtonDescriptionSelected: {
    color: colors.light.primaryOrange,
  },
});