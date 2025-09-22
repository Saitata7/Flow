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
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlowsContext } from '../../context/FlowContext';
import { ThemeContext } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { validateNumericInput } from '../../utils/validation';
import Card from '../../components/common/card';
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

  if (!flow) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Flow not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
          <Text style={styles.headerTitle}>Edit Flow</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Cancel editing"
            accessibilityHint="Cancels editing and returns to previous screen"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <SafeAreaWrapper style={styles.contentWrapper}>
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tracking Type</Text>
            <View style={styles.trackingTypeContainer}>
              <TouchableOpacity
                style={[styles.trackingTypeButton, trackingType === 'Binary' && styles.trackingTypeButtonSelected]}
                onPress={() => setTrackingType('Binary')}
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
              >
                <Text style={styles.trackingTypeIcon}>⏱️</Text>
                <Text style={[styles.trackingTypeText, trackingType === 'Time-based' && styles.trackingTypeTextSelected]}>
                  Time-based
                </Text>
                <Text style={styles.trackingTypeSubtext}>Duration tracking</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quantitative Settings */}
          {trackingType === 'Quantitative' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quantitative Settings</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.modernInput}
                    value={unitText}
                    onChangeText={setUnitText}
                    placeholder="e.g., glasses, steps"
                    placeholderTextColor="#999"
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
            </View>
          )}

          {/* Time-based Settings */}
          {trackingType === 'Time-based' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Time Duration (Goal)</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.inputLabel}>Hours</Text>
                  <TextInput
                    style={styles.modernInput}
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
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.inputLabel}>Minutes</Text>
                  <TextInput
                    style={styles.modernInput}
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
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.inputLabel}>Seconds</Text>
                  <TextInput
                    style={styles.modernInput}
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
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Frequency Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Frequency</Text>
            <View style={styles.frequencyContainer}>
              <TouchableOpacity
                style={[styles.frequencyButton, frequency === 'Daily' && styles.frequencyButtonSelected]}
                onPress={() => setFrequency('Daily')}
              >
                <Text style={[styles.frequencyText, frequency === 'Daily' && styles.frequencyTextSelected]}>
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.frequencyButton, frequency === 'Monthly' && styles.frequencyButtonSelected]}
                onPress={() => setFrequency('Monthly')}
              >
                <Text style={[styles.frequencyText, frequency === 'Monthly' && styles.frequencyTextSelected]}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Days Selection Card */}
          {frequency === 'Daily' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Schedule</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Every Day</Text>
                <Switch
                  style={styles.toggleSwitch}
                  value={everyDay}
                  onValueChange={setEveryDay}
                  trackColor={{ false: '#ccc', true: '#F5A623' }}
                  thumbColor="#fff"
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
            </View>
          )}

          {frequency === 'Monthly' && (
            <View style={styles.card}>
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

          {/* Reminder Time Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reminder</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Reminder</Text>
              <Switch
                style={styles.toggleSwitch}
                value={reminderTimeEnabled}
                onValueChange={setReminderTimeEnabled}
                trackColor={{ false: '#ccc', true: '#F5A623' }}
                thumbColor="#fff"
              />
            </View>
            {reminderTimeEnabled && (
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timePickerText}>
                  {reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Advanced Settings Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Advanced Settings</Text>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Cheat Mode</Text>
              <Switch
                style={styles.toggleSwitch}
                value={cheatMode}
                onValueChange={setCheatMode}
                trackColor={{ false: '#ccc', true: '#F5A623' }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Archived</Text>
              <Switch
                style={styles.toggleSwitch}
                value={archived}
                onValueChange={setArchived}
                trackColor={{ false: '#ccc', true: '#F5A623' }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Visibility</Text>
                <View style={styles.visibilityContainer}>
                  <TouchableOpacity
                    style={[styles.visibilityButton, visibility === 'private' && styles.visibilityButtonSelected]}
                    onPress={() => setVisibility('private')}
                  >
                    <Text style={[styles.visibilityText, visibility === 'private' && styles.visibilityTextSelected]}>
                      Private
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.visibilityButton, visibility === 'public' && styles.visibilityButtonSelected]}
                    onPress={() => setVisibility('public')}
                  >
                    <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextSelected]}>
                      Public
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Progress Mode</Text>
                <View style={styles.progressModeContainer}>
                  <TouchableOpacity
                    style={[styles.progressModeButton, progressMode === 'sum' && styles.progressModeButtonSelected]}
                    onPress={() => setProgressMode('sum')}
                  >
                    <Text style={[styles.progressModeText, progressMode === 'sum' && styles.progressModeTextSelected]}>
                      Sum
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.progressModeButton, progressMode === 'average' && styles.progressModeButtonSelected]}
                    onPress={() => setProgressMode('average')}
                  >
                    <Text style={[styles.progressModeText, progressMode === 'average' && styles.progressModeTextSelected]}>
                      Average
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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
          </ScrollView>

          {/* Update Button - Inside SafeAreaWrapper to be above tab bar */}
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[
                styles.updateButton,
                (!!titleError || isCheckingTitle) && styles.updateButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!!titleError || isCheckingTitle}
              testID="update-flow-button"
              accessibilityLabel="Update flow"
              accessibilityHint="Updates the current flow with new settings"
            >
              <Text style={styles.updateButtonText}>
                {isCheckingTitle ? 'Checking...' : 'Update Flow'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaWrapper>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
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
  cancelButton: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.squircle.borderRadius,
    backgroundColor: colors.light.cardBackground,
    ...layout.shadows.buttonShadow,
  },
  cancelButtonText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
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
    paddingBottom: layout.spacing.lg, // Extra padding at bottom of scroll
  },
  cardTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  timePickerText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  saveButtonContainer: {
    paddingHorizontal: layout.spacing.md,
    paddingTop: layout.spacing.md,
    paddingBottom: layout.spacing.md,
    backgroundColor: colors.light.background,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    // SafeAreaWrapper handles the bottom spacing
  },
  updateButton: {
    backgroundColor: colors.light.primary,
    borderRadius: layout.squircle.borderRadius,
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.button.standardHeight,
    ...layout.shadows.buttonShadow,
  },
  updateButtonDisabled: {
    backgroundColor: colors.light.disabled,
    opacity: 0.6,
  },
  updateButtonText: {
    ...typography.styles.button,
    color: colors.light.onPrimary,
    fontWeight: '600',
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
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visibilityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  visibilityButtonSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  visibilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  visibilityTextSelected: {
    color: '#92400E',
  },
  progressModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  progressModeButtonSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  progressModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  progressModeTextSelected: {
    color: '#92400E',
  },
});

export default EditFlowScreen;