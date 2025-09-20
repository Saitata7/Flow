import React, { useContext, useState, useEffect } from 'react';
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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlowsContext } from '../../context/FlowContext';
import { usePlanContext } from '../../context/PlanContext';
import { useRoute } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { validateNumericInput } from '../../utils/validation';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function AddFlow({ navigation }) {
  const flowsContext = useContext(FlowsContext);
  const { addFlow } = flowsContext || {};
  const { createPlan } = usePlanContext();
  const { user } = useAuth();
  const route = useRoute();
  const { flowToEdit, createAsPlan = false } = route.params || {};

  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackingType, setTrackingType] = useState('Binary');
  const [frequency, setFrequency] = useState('Daily');
  const [everyDay, setEveryDay] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [reminderTimeEnabled, setReminderTimeEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderLevel, setReminderLevel] = useState('1');
  const [unitText, setUnitText] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [goal, setGoal] = useState(0);
  const [hoursInput, setHoursInput] = useState('00');
  const [minutesInput, setMinutesInput] = useState('00');
  const [secondsInput, setSecondsInput] = useState('00');
  const [goalInput, setGoalInput] = useState('0');

  // v2 schema fields
  const [planId, setPlanId] = useState(null);
  const [progressMode, setProgressMode] = useState('sum');
  const [tags, setTags] = useState([]);
  const [archived, setArchived] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [cheatMode, setCheatMode] = useState(false);

  useEffect(() => {
    if (flowToEdit) {
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
      setProgressMode(flowToEdit.progressMode || 'sum');
      setTags(flowToEdit.tags || []);
      setArchived(flowToEdit.archived || false);
      setVisibility(flowToEdit.visibility || 'private');
      setCheatMode(flowToEdit.cheatMode || false);
    }
  }, [flowToEdit]);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!title || title.trim().length < 3) {
      Alert.alert('Validation Error', 'Title must be at least 3 characters');
      return;
    }
    
    if (trackingType === 'Quantitative' && (!unitText || unitText.trim().length === 0)) {
      Alert.alert('Validation Error', 'Unit text is required for quantitative flows');
      return;
    }

    if (createAsPlan) {
      // Create as a personal plan
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
      }

      const planData = {
        title,
        description,
        category: 'mindfulness',
        visibility: 'private',
        ownerId: user.id,
        trackingType,
        frequency,
        everyDay,
        daysOfWeek: frequency === 'Daily' || frequency === 'Monthly' ? selectedDays : [],
        reminderTimeEnabled,
        reminderTime: reminderTimeEnabled && reminderTime ? reminderTime.toISOString() : null,
        reminderLevel,
        unitText: trackingType === 'Quantitative' ? unitText : undefined,
        hours: trackingType === 'Time-based' ? hours : undefined,
        minutes: trackingType === 'Time-based' ? minutes : undefined,
        seconds: trackingType === 'Time-based' ? seconds : undefined,
        goal: trackingType === 'Quantitative' ? goal : undefined,
        participants: [{ userId: user.id, role: 'owner', joinedAt: new Date().toISOString() }],
        analytics: {
          totalParticipants: 1,
          completionRate: 0,
          averageScore: 0,
        },
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: null,
      };

      try {
        await createPlan(planData);
        Alert.alert('Success!', 'Plan created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } catch (error) {
        console.error('Error creating plan:', error);
        Alert.alert('Error', 'Failed to create plan. Please try again.');
      }
    } else {
      // Create as a flow
      const newFlow = {
        id: flowToEdit?.id || Date.now().toString(),
        title,
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
        progressMode,
        tags,
        archived,
        visibility,
        cheatMode,
        ownerId: user?.id || 'user123',
        schemaVersion: 2,
      };

      try {
        if (!addFlow) {
          Alert.alert('Error', 'Flow context not available. Please restart the app.');
          return;
        }
        
        await addFlow(newFlow);
        Alert.alert('Success!', 'Flow created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } catch (e) {
        console.error('Error saving flow:', e);
        Alert.alert('Error', 'Failed to save flow. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEDFCD" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Flow</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Flow Title</Text>
            <TextInput
              style={styles.modernInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Read for 30 minutes"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <TextInput
              style={[styles.modernInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description about your flow..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

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
              <Text style={styles.cardTitle}>Time Duration</Text>
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

        {/* Modern Save Button */}
        <View style={styles.saveButtonContainer}>
          <LinearGradient
            colors={['#FFB366', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                {createAsPlan 
                  ? (flowToEdit ? 'Update Plan' : 'Save Plan')
                  : (flowToEdit ? 'Update Flow' : 'Save Flow')
                }
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEDFCD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FEDFCD',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FEDFCD',
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