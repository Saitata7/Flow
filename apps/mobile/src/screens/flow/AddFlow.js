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
import { useAuth } from '../../context/JWTAuthContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { validateNumericInput } from '../../utils/validation';
import sessionApiService from '../../services/sessionApiService';
import CardComponent from '../../components/common/CardComponent';
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
  const { addFlow, createFlowOfflineFirst, flows } = flowsContext || {};
  const { user, isAuthenticated } = useAuth();
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
  const [customSound, setCustomSound] = useState(null);
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

  // Storage preference state
  const [storagePreference, setStoragePreference] = useState('local'); // 'local' or 'cloud'
  const [showStorageWarning, setShowStorageWarning] = useState(false);

  // v2 schema fields
  const [planId, setPlanId] = useState(null);

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

  useEffect(() => {
    if (flowToEdit) {
      // Editing existing flow - populate with existing data
      console.log('AddFlow: Editing existing flow:', flowToEdit.title);
      setTitle(flowToEdit.title || '');
      setDescription(flowToEdit.description || '');
      setTrackingType(flowToEdit.trackingType || 'Binary');
      setFrequency(flowToEdit.frequency || 'Daily');
      setStoragePreference(flowToEdit.storagePreference || 'local');
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
    if (!titleToCheck || typeof titleToCheck !== 'string' || titleToCheck.trim().length < 3) {
      console.log('AddFlow: Invalid titleToCheck:', titleToCheck, typeof titleToCheck);
      setTitleError('');
      return;
    }

    // Check 10 character limit
    if (titleToCheck.trim().length > 10) {
      setTitleError('Title must be 10 characters or less');
      return;
    }

    // Skip check if editing the same flow
    if (flowToEdit && flowToEdit.title && typeof flowToEdit.title === 'string') {
      try {
        if (flowToEdit.title.toLowerCase().trim() === titleToCheck.toLowerCase().trim()) {
          setTitleError('');
          return;
        }
      } catch (error) {
        console.log('AddFlow: Error comparing flowToEdit title:', error, 'flowToEdit.title:', flowToEdit.title, 'titleToCheck:', titleToCheck);
      }
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
        titleType: typeof f.title,
        deletedAt: f.deletedAt, 
        archived: f.archived 
      })));
      
      // Check against existing flows
      const existingFlow = flows.find(existingFlow => {
        // Add comprehensive null checks
        if (!existingFlow || existingFlow.deletedAt || existingFlow.archived) {
          return false;
        }
        
        // Check if title exists and is a string
        if (!existingFlow.title || typeof existingFlow.title !== 'string') {
          return false;
        }
        
        // Now safely compare titles
        try {
          return existingFlow.title.toLowerCase().trim() === titleToCheck.toLowerCase().trim();
        } catch (error) {
          console.log('AddFlow: Error comparing titles:', error, 'existingFlow.title:', existingFlow.title, 'titleToCheck:', titleToCheck);
          return false;
        }
      });

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

    // Create as a flow with proper storage preference
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
      customSound: reminderLevel === '3' ? customSound : null,
      unitText: trackingType === 'Quantitative' ? unitText : undefined,
      hours: trackingType === 'Time-based' ? hours : undefined,
      minutes: trackingType === 'Time-based' ? minutes : undefined,
      seconds: trackingType === 'Time-based' ? seconds : undefined,
      goal: trackingType === 'Quantitative' ? goal : null,
      planId,
      ownerId: user?.id || 'user123',
      schemaVersion: 2,
      // Ensure storagePreference is properly set based on authentication and user selection
      storagePreference: storagePreference || (isAuthenticated ? 'cloud' : 'local'),
      createdAt: flowToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // If user selected cloud storage but is not authenticated, prevent save
      if (storagePreference === 'cloud' && !isAuthenticated) {
        console.log('AddFlow: Cloud storage selected but user not authenticated');
        Alert.alert(
          'Login Required', 
          'Cloud storage requires authentication. Please login first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Login', 
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return;
      }
      
      // Use sync-aware flow creation for cloud flows, fallback to addFlow for local flows
      const flowCreationFunction = newFlow.storagePreference === 'cloud' && createFlowOfflineFirst ? createFlowOfflineFirst : addFlow;
      
      if (!flowCreationFunction) {
        Alert.alert('Error', 'Flow context not available. Please restart the app.');
        return;
      }
      
      console.log('AddFlow: About to call', newFlow.storagePreference === 'cloud' ? 'createFlowOfflineFirst' : 'addFlow', 'with:', newFlow);
      
      // Attempt to create the flow
      const createdFlow = await flowCreationFunction(newFlow);
      
      // If cloud storage, verify it was synced to database
      if (storagePreference === 'cloud') {
        // Check if flow has a permanent ID (not temp)
        const isTemp = createdFlow?.id?.startsWith('temp_');
        
        if (isTemp) {
          console.log('AddFlow: Cloud flow saved locally but not synced to database');
          Alert.alert(
            'Sync Failed',
            'Your flow was saved locally but couldn\'t sync to the cloud. Please check your internet connection and try again.',
            [
              { text: 'Retry', onPress: () => handleSave() },
              { text: 'OK', style: 'cancel' }
            ]
          );
          return;
        }
        
        console.log('AddFlow: Cloud flow synced successfully with ID:', createdFlow.id);
      }
      
      console.log('AddFlow: Flow creation completed successfully');
      
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
      
      // Check if it's a cloud sync error
      if (storagePreference === 'cloud' && e.message) {
        if (e.message.includes('session') || e.message.includes('Session') || e.message.includes('expired')) {
          console.log('AddFlow: Session expired during cloud sync');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again to save to cloud.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Login', onPress: () => navigation.navigate('Login') }
            ]
          );
          return;
        }
        
        if (e.message.includes('network') || e.message.includes('Network') || e.message.includes('internet')) {
          console.log('AddFlow: Network error during cloud sync');
          Alert.alert(
            'Network Error',
            'Could not connect to cloud database. Please check your internet connection and try again.',
            [
              { text: 'Retry', onPress: () => handleSave() },
              { text: 'Save Locally Instead', 
                onPress: () => {
                  setStoragePreference('local');
                  handleSave();
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }
      }
      
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
        return;
      }
      
      // Generic error for cloud flows
      if (storagePreference === 'cloud') {
        console.log('AddFlow: Showing cloud-specific error alert');
        Alert.alert(
          'Cloud Sync Failed',
          'Failed to save flow to cloud database. Please check your connection or try saving locally.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Locally Instead', 
              onPress: () => {
                setStoragePreference('local');
                handleSave();
              }
            }
          ]
        );
        return;
      }
      
      // Generic error for local flows
      console.log('AddFlow: Showing generic error alert');
      Alert.alert('Error', 'Failed to save flow. Please try again.');
      return;
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
            <Ionicons name="chevron-back" size={20} color={colors.light.primaryText} />
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
          
          {/* General Settings Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={20} color={colors.light.primaryOrange} />
              <Text style={styles.sectionTitle}>General Settings</Text>
            </View>
            
            {/* Habit Name */}
            <CardComponent variant="elevated" padding="md" margin="none">
              <View style={styles.inputHeader}>
                <Ionicons name="create-outline" size={18} color={colors.light.primaryOrange} />
                <Text style={styles.inputLabel}>Habit Name</Text>
              </View>
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
            </CardComponent>

            {/* Description */}
            <CardComponent variant="elevated" padding="md" margin="none">
              <View style={styles.inputHeader}>
                <Ionicons name="document-text-outline" size={18} color={colors.light.primaryOrange} />
                <Text style={styles.inputLabel}>Description</Text>
              </View>
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
            </CardComponent>

            {/* Tracking Type */}
            <CardComponent variant="elevated" padding="md" margin="none">
              <View style={styles.inputHeader}>
                <Ionicons name="analytics-outline" size={18} color={colors.light.primaryOrange} />
                <Text style={styles.inputLabel}>Tracking Type</Text>
              </View>
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
            </CardComponent>

            {/* Frequency */}
            <CardComponent variant="elevated" padding="md" margin="none">
              <View style={styles.inputHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.light.primaryOrange} />
                <Text style={styles.inputLabel}>Frequency</Text>
              </View>
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
            </CardComponent>
          </View>

          {/* Flow Settings Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cog-outline" size={20} color={colors.light.primaryOrange} />
              <Text style={styles.sectionTitle}>Flow Settings</Text>
            </View>

            {/* Storage Preference */}
            <CardComponent variant="elevated" padding="md" margin="none">
              <View style={styles.inputHeader}>
                <Ionicons name="cloud-outline" size={18} color={colors.light.primaryOrange} />
                <Text style={styles.inputLabel}>Storage Preference</Text>
              </View>
              <Text style={styles.storageDescription}>
                Choose how your flow data is stored and synced
              </Text>
              
              <View style={styles.storageOptionsContainer}>
                {/* Local Storage Option */}
                <TouchableOpacity
                  style={[
                    styles.storageOption,
                    storagePreference === 'local' && styles.storageOptionSelected
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
                      color={storagePreference === 'local' ? colors.light.primaryOrange : colors.light.secondaryText} 
                    />
                    <Text style={[
                      styles.storageOptionTitle,
                      storagePreference === 'local' && styles.storageOptionTitleSelected
                    ]}>
                      Local Only
                    </Text>
                  </View>
                  <View style={styles.storageOptionFeatures}>
                    <Text style={[
                      styles.storageOptionFeature,
                      storagePreference === 'local' && styles.storageOptionFeatureSelected
                    ]}>
                      ✓ Stored on your device only
                    </Text>
                    <Text style={[
                      styles.storageOptionFeature,
                      storagePreference === 'local' && styles.storageOptionFeatureSelected
                    ]}>
                      ✓ Works offline
                    </Text>
                    <Text style={[
                      styles.storageOptionFeature,
                      storagePreference === 'local' && styles.storageOptionFeatureSelected
                    ]}>
                      ✓ Can be upgraded to cloud later
                    </Text>
                    <Text style={[
                      styles.storageOptionFeature,
                      storagePreference === 'local' && styles.storageOptionFeatureSelected
                    ]}>
                      ⚠️ Data lost if device is reset
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Cloud Storage Option */}
                <TouchableOpacity
                  style={[
                    styles.storageOption,
                    storagePreference === 'cloud' && styles.storageOptionSelected
                  ]}
                  onPress={() => {
                    setStoragePreference('cloud');
                    setShowStorageWarning(true);
                  }}
                  accessibilityLabel="Cloud storage option"
                  accessibilityHint="Store flow data in cloud database - cannot be reverted"
                  accessibilityRole="button"
                >
                  <View style={styles.storageOptionHeader}>
                    <Ionicons 
                      name="cloud-outline" 
                      size={24} 
                      color={storagePreference === 'cloud' ? colors.light.primaryOrange : colors.light.secondaryText} 
                    />
                    <Text style={[
                      styles.storageOptionTitle,
                      storagePreference === 'cloud' && styles.storageOptionTitleSelected
                    ]}>
                      Cloud Sync
                    </Text>
                  </View>
                  <View style={styles.storageOptionFeatures}>
                    <Text style={[
                      styles.storageOptionFeature,
                      storagePreference === 'cloud' && styles.storageOptionFeatureSelected
                    ]}>
                      ✓ Synced across all devices
                    </Text>
                    <Text style={[
                      styles.storageOptionFeature,
                      storagePreference === 'cloud' && styles.storageOptionFeatureSelected
                    ]}>
                      ✓ Backed up automatically
                    </Text>
                    <Text style={[
                      styles.storageOptionFeature,
                      storagePreference === 'cloud' && styles.storageOptionFeatureSelected
                    ]}>
                      ✓ Requires internet connection
                    </Text>
                    <Text style={[
                      styles.storageOptionWarning,
                      storagePreference === 'cloud' && styles.storageOptionWarningSelected
                    ]}>
                      ⚠️ Cannot be reverted to local
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

                    {/* Cloud Storage Warning */}
                    {showStorageWarning && storagePreference === 'cloud' && (
                      <View style={styles.warningContainer}>
                        <Ionicons name="warning-outline" size={20} color={colors.light.warning} />
                        <Text style={styles.warningText}>
                          Cloud storage cannot be reverted to local. If you want local-only storage, create a new flow instead.
                        </Text>
                      </View>
                    )}

                    {/* Authentication Warning for Cloud Storage */}
                    {storagePreference === 'cloud' && !isAuthenticated && (
                      <View style={styles.warningContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.light.error} />
                        <Text style={styles.warningText}>
                          ⚠️ You need to login to use cloud storage. This flow will be saved locally until you authenticate.
                        </Text>
                      </View>
                    )}
            </CardComponent>


            {/* Quantitative Settings */}
            {trackingType === 'Quantitative' && (
              <CardComponent variant="elevated" padding="md" margin="none">
                <View style={styles.inputHeader}>
                  <Ionicons name="calculator-outline" size={18} color={colors.light.primaryOrange} />
                  <Text style={styles.inputLabel}>Quantitative Settings</Text>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputSubLabel}>Unit</Text>
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
                    <Text style={styles.inputSubLabel}>Goal (Optional)</Text>
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
                      placeholderTextColor={colors.light.tertiaryText}
                    />
                  </View>
                </View>
              </CardComponent>
            )}

            {/* Time-based Settings */}
            {trackingType === 'Time-based' && (
              <CardComponent variant="elevated" padding="md" margin="none">
                <View style={styles.inputHeader}>
                  <Ionicons name="time-outline" size={18} color={colors.light.primaryOrange} />
                  <Text style={styles.inputLabel}>Time Duration (Goal)</Text>
                </View>
                <TimePicker
                  initialHours={hours}
                  initialMinutes={minutes}
                  onTimeChange={handleDurationChange}
                  style={styles.timePickerContainer}
                />
              </CardComponent>
            )}

            {/* Schedule Settings */}
            {frequency === 'Daily' && (
              <CardComponent variant="elevated" padding="md" margin="none">
                <View style={styles.inputHeader}>
                  <Ionicons name="calendar-outline" size={18} color={colors.light.primaryOrange} />
                  <Text style={styles.inputLabel}>Schedule</Text>
                </View>
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
                    <Text style={styles.inputSubLabel}>Days of Week</Text>
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
              </CardComponent>
            )}

            {frequency === 'Monthly' && (
              <CardComponent variant="elevated" padding="md" margin="none">
                <View style={styles.inputHeader}>
                  <Ionicons name="calendar-outline" size={18} color={colors.light.primaryOrange} />
                  <Text style={styles.inputLabel}>Days of Month</Text>
                </View>
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
              </CardComponent>
            )}

            {/* Reminder Settings */}
            <CardComponent variant="elevated" padding="md" margin="none">
              <View style={styles.inputHeader}>
                <Ionicons name="notifications-outline" size={18} color={colors.light.primaryOrange} />
                <Text style={styles.inputLabel}>Reminder</Text>
              </View>
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
                        { 
                          level: '1', 
                          label: 'Gentle Reminder', 
                          description: '🌱 Soft notification with gentle chime',
                          details: 'Light vibration, easy to dismiss'
                        },
                        { 
                          level: '2', 
                          label: 'Moderate Push', 
                          description: '🔔 Standard notification with sound',
                          details: 'Medium vibration, persistent until completed'
                        },
                        { 
                          level: '3', 
                          label: 'Urgent Alarm', 
                          description: '🚨 Loud alarm with custom music',
                          details: 'Strong vibration, requires user interaction'
                        }
                      ].map(({ level, label, description, details }) => (
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
                          <Text style={[
                            styles.reminderLevelButtonDetails,
                            reminderLevel === level && styles.reminderLevelButtonDetailsSelected
                          ]}>
                            {details}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* Custom Sound Selection for Level 3 */}
                  {reminderLevel === '3' && (
                    <View style={styles.customSoundSection}>
                      <Text style={styles.customSoundLabel}>Alarm Sound</Text>
                      <Text style={styles.customSoundDescription}>
                        Choose your alarm sound for urgent reminders
                      </Text>
                      <View style={styles.soundOptions}>
                        {[
                          { id: 'default', name: 'Default Alarm', description: 'Built-in alarm sound' },
                          { id: 'gentle', name: 'Gentle Chime', description: 'Soft chime sound' },
                          { id: 'classic', name: 'Classic Bell', description: 'Traditional bell sound' },
                          { id: 'modern', name: 'Modern Beep', description: 'Digital beep sound' },
                        ].map((sound) => (
                          <TouchableOpacity
                            key={sound.id}
                            style={[
                              styles.soundOption,
                              customSound === sound.id && styles.soundOptionSelected
                            ]}
                            onPress={() => setCustomSound(sound.id)}
                          >
                            <Text style={[
                              styles.soundOptionName,
                              customSound === sound.id && styles.soundOptionNameSelected
                            ]}>
                              {sound.name}
                            </Text>
                            <Text style={[
                              styles.soundOptionDescription,
                              customSound === sound.id && styles.soundOptionDescriptionSelected
                            ]}>
                              {sound.description}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </CardComponent>
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

          {/* Save Button */}
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

          </ScrollView>
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
    minHeight: 60,
  },
  backButton: {
    width: layout?.components?.button?.primary?.iconSize || 20,
    height: layout?.components?.button?.primary?.iconSize || 20,
    borderRadius: layout.radii.squircle,
    backgroundColor: colors.light.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...layout.elevation.low,
  },
  headerTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
  },
  placeholder: {
    width: layout?.components?.button?.primary?.iconSize || 20,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing.md,
    paddingTop: 0,
    paddingBottom: layout.spacing.md,
    gap: layout.spacing.sm,
  },
  
  // New Section Styles
  sectionContainer: {
    marginBottom: layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
    paddingHorizontal: layout.spacing.xs,
  },
  sectionTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginLeft: layout.spacing.sm,
    fontWeight: typography.weights.bold,
  },
  
  // Input Header Styles
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  inputLabel: {
    ...typography.styles.body,
    fontWeight: typography.weights.semibold,
    color: colors.light.primaryText,
    marginLeft: layout.spacing.xs,
  },
  inputSubLabel: {
    ...typography.styles.caption1,
    fontWeight: typography.weights.medium,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.xs,
  },
  
  // Storage Styles
  storageDescription: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.md,
    textAlign: 'center',
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
    borderColor: colors.light.border,
    backgroundColor: colors.light.cardBackground,
  },
  storageOptionSelected: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrange + '10',
  },
  storageOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  storageOptionTitle: {
    ...typography.styles.body,
    fontWeight: typography.weights.semibold,
    color: colors.light.primaryText,
    marginLeft: layout.spacing.xs,
  },
  storageOptionTitleSelected: {
    color: colors.light.primaryOrange,
  },
  storageOptionFeatures: {
    gap: layout.spacing.xs,
  },
  storageOptionFeature: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  storageOptionFeatureSelected: {
    color: colors.light.primaryText,
  },
  storageOptionWarning: {
    ...typography.styles.caption1,
    color: colors.light.warning,
    fontWeight: typography.weights.semibold,
    marginTop: layout.spacing.xs,
  },
  storageOptionWarningSelected: {
    color: colors.light.warning,
  },
  
  // Card Title (legacy)
  cardTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  
  // Input Styles
  modernInput: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.radii.squircle,
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
  
  // Tracking Type Styles
  trackingTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layout.spacing.xs,
  },
  trackingTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.sm,
    borderRadius: layout.radii.squircle,
    backgroundColor: colors.light.cardBackground,
    borderWidth: 2,
    borderColor: colors.light.border,
  },
  trackingTypeButtonSelected: {
    backgroundColor: colors.light.primaryOrange + '20',
    borderColor: colors.light.primaryOrange,
  },
  trackingTypeIcon: {
    fontSize: 24,
    marginBottom: layout.spacing.xs,
  },
  trackingTypeText: {
    fontSize: typography.styles.caption1.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
  },
  trackingTypeTextSelected: {
    color: colors.light.primaryOrange,
  },
  trackingTypeSubtext: {
    fontSize: typography.styles.caption2.fontSize,
    color: colors.light.tertiaryText,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Frequency Styles
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layout.spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.radii.squircle,
    backgroundColor: colors.light.cardBackground,
    borderWidth: 2,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  frequencyButtonSelected: {
    backgroundColor: colors.light.primaryOrange + '20',
    borderColor: colors.light.primaryOrange,
  },
  frequencyText: {
    fontSize: typography.styles.body.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.light.secondaryText,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  frequencyTextSelected: {
    color: colors.light.primaryOrange,
  },
  
  // Input Row Styles
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layout.spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  
  // Toggle Styles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.md,
  },
  toggleLabel: {
    ...typography.styles.body,
    fontWeight: typography.weights.semibold,
    color: colors.light.primaryText,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  toggleSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  
  // Days Styles
  daysContainer: {
    marginTop: layout.spacing.md,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: layout.spacing.xs,
  },
  dayButton: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: layout.radii.squircle,
    backgroundColor: colors.light.cardBackground,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.light.primaryOrange,
    borderColor: colors.light.primaryOrange,
  },
  dayButtonText: {
    fontSize: typography.styles.caption1.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.light.secondaryText,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dayButtonTextSelected: {
    color: colors.light.cardBackground,
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: layout.spacing.xs,
  },
  
  // Time Picker Styles
  timePickerButton: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.radii.squircle,
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
  timePickerContainer: {
    marginTop: layout.spacing.sm,
  },
  
  // Reminder Level Styles
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
  reminderLevelButtonDetails: {
    fontSize: 11,
    color: colors.light.secondaryText,
    marginTop: 2,
    textAlign: 'center',
    opacity: 0.8,
  },
  reminderLevelButtonDetailsSelected: {
    color: colors.light.primaryOrange,
    opacity: 1,
  },
  
  // Custom Sound Styles
  customSoundSection: {
    marginTop: layout.spacing.lg,
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.radii.squircle,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  customSoundLabel: {
    fontSize: typography.styles.body.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  customSoundDescription: {
    fontSize: typography.styles.caption1.fontSize,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.sm,
  },
  soundOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.sm,
  },
  soundOption: {
    flex: 1,
    minWidth: '45%',
    padding: layout.spacing.sm,
    backgroundColor: colors.light.background,
    borderRadius: layout.radii.squircle,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  soundOptionSelected: {
    backgroundColor: colors.light.primaryOrange,
    borderColor: colors.light.primaryOrange,
  },
  soundOptionName: {
    fontSize: typography.styles.caption1.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.light.primaryText,
    marginBottom: 2,
  },
  soundOptionNameSelected: {
    color: colors.light.cardBackground,
  },
  soundOptionDescription: {
    fontSize: typography.styles.caption2.fontSize,
    color: colors.light.secondaryText,
    textAlign: 'center',
  },
  soundOptionDescriptionSelected: {
    color: colors.light.cardBackground,
    opacity: 0.9,
  },
  
  // Warning Styles
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: layout.spacing.md,
    padding: layout.spacing.sm,
    backgroundColor: colors.light.warning + '20',
    borderRadius: layout.radii.squircle,
    borderLeftWidth: 3,
    borderLeftColor: colors.light.warning,
  },
  warningText: {
    ...typography.styles.caption1,
    color: colors.light.warning,
    marginLeft: layout.spacing.xs,
    flex: 1,
    lineHeight: 18,
  },
  
  // Save Button Styles
  saveButtonContainer: {
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.lg,
    paddingBottom: layout.spacing.xl,
    marginTop: layout.spacing.md,
  },
});