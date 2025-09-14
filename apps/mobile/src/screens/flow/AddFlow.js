import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
  Pressable,
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
import { validateFlowData, validateNumericInput } from '../../utils/validation';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function AddFlow({ navigation }) {
  const { addFlow } = useContext(FlowsContext);
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
  const [hoursInput, setHoursInput] = useState('00');
  const [minutesInput, setMinutesInput] = useState('00');
  const [secondsInput, setSecondsInput] = useState('00');
  const [goal, setGoal] = useState(0);
  const [goalInput, setGoalInput] = useState('');

  // Populate fields when editing
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
    // Prepare data for validation
    const flowData = {
      title: title.trim(),
      description: description.trim(),
      trackingType,
      frequency,
      everyDay,
      selectedDays,
      reminderTimeEnabled,
      reminderTime,
      reminderLevel,
      unitText: trackingType === 'Quantitative' ? unitText.trim() : '',
      hours: trackingType === 'Time-based' ? hours : 0,
      minutes: trackingType === 'Time-based' ? minutes : 0,
      seconds: trackingType === 'Time-based' ? seconds : 0,
      goal: trackingType === 'Quantitative' ? goal : 0,
    };

    // Comprehensive validation
    const validation = await validateFlowData(flowData);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      Alert.alert('Validation Error', firstError);
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
        category: 'mindfulness', // Default category for personal plans
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
          strictScore: 0,
          flexibleScore: 0,
          streak: 0,
        },
      };

      try {
        await createPlan(planData);
        navigation.goBack();
      } catch (e) {
        console.error('Error saving personal plan:', e);
        Alert.alert('Error', 'Failed to save personal plan. Please try again.');
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
        goal: trackingType === 'Quantitative' ? goal : undefined,
      };

      try {
        await addFlow(newFlow);
        navigation.goBack();
      } catch (e) {
        console.error('Error saving flow:', e);
        Alert.alert('Error', 'Failed to save flow. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={['#FFE3C3', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Read for 30 minutes"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description about your flow..."
          />

          <Text style={styles.label}>Flow Tracking Type</Text>
          <TouchableOpacity
            style={[styles.optionButton, trackingType === 'Binary' && styles.optionButtonSelected]}
            onPress={() => setTrackingType('Binary')}
          >
            <View>
              <Text style={trackingType === 'Binary' ? styles.optionTextSelected : styles.optionText}>
                Binary (Yes/No)
              </Text>
              <Text style={trackingType === 'Binary' ? styles.optionSubTextSelected : styles.optionSubText}>
                Simple did/didn't completion tracking
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, trackingType === 'Quantitative' && styles.optionButtonSelected]}
            onPress={() => setTrackingType('Quantitative')}
          >
            <View>
              <Text style={trackingType === 'Quantitative' ? styles.optionTextSelected : styles.optionText}>
                Quantitative
              </Text>
              <Text style={trackingType === 'Quantitative' ? styles.optionSubTextSelected : styles.optionSubText}>
                Track specific numbers (e.g., 8 glasses of water, 50 push-ups)
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, trackingType === 'Time-based' && styles.optionButtonSelected]}
            onPress={() => setTrackingType('Time-based')}
          >
            <View>
              <Text style={trackingType === 'Time-based' ? styles.optionTextSelected : styles.optionText}>
                Time-based
              </Text>
              <Text style={trackingType === 'Time-based' ? styles.optionSubTextSelected : styles.optionSubText}>
                Track duration (e.g., 30 minutes of reading, 1 hour of exercise)
              </Text>
            </View>
          </TouchableOpacity>

          {trackingType === 'Quantitative' && (
            <View>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unitText}
                onChangeText={setUnitText}
                placeholder="e.g., glasses, steps"
              />
              <Text style={styles.label}>Goal (Optional)</Text>
              <TextInput
                style={styles.input}
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
              />
            </View>
          )}

          {trackingType === 'Time-based' && (
            <View style={styles.timeBasedContainer}>
              <Text style={styles.label}>Goal Duration</Text>
              <View style={styles.timerInput}>
                <TextInput
                  style={styles.timerField}
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
                  maxLength={2}
                  placeholder="00"
                />
                <Text style={styles.timerLabel}>hrs</Text>
                <Text style={styles.timerSeparator}>:</Text>
                <TextInput
                  style={styles.timerField}
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
                  maxLength={2}
                  placeholder="00"
                />
                <Text style={styles.timerLabel}>mins</Text>
                <Text style={styles.timerSeparator}>:</Text>
                <TextInput
                  style={styles.timerField}
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
                  maxLength={2}
                  placeholder="00"
                />
                <Text style={styles.timerLabel}>sec</Text>
              </View>
            </View>
          )}

          <View style={styles.frequencyContainer}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyOptions}>
              <TouchableOpacity
                style={[styles.frequencyButton, frequency === 'Daily' && styles.frequencyButtonSelected]}
                onPress={() => setFrequency('Daily')}
              >
                <Text style={frequency === 'Daily' ? styles.frequencyTextSelected : styles.frequencyText}>
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.frequencyButton, frequency === 'Monthly' && styles.frequencyButtonSelected]}
                onPress={() => setFrequency('Monthly')}
              >
                <Text style={frequency === 'Monthly' ? styles.frequencyTextSelected : styles.frequencyText}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {frequency === 'Daily' && (
            <View>
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
                        style={{
                          color: selectedDays.includes(day) ? '#fff' : '#333',
                          fontWeight: '600',
                        }}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {frequency === 'Monthly' && (
            <View style={styles.monthDaysContainer}>
              <Text style={styles.label}>Days of Month</Text>
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
                      style={{
                        color: selectedDays.includes(day) ? '#fff' : '#333',
                        fontWeight: '600',
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.reminderTimeContainer}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Reminder Time</Text>
              <Switch
                style={styles.toggleSwitch}
                value={reminderTimeEnabled}
                onValueChange={setReminderTimeEnabled}
                trackColor={{ false: '#ccc', true: '#F5A623' }}
                thumbColor="#fff"
              />
            </View>
            {reminderTimeEnabled && (
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={({ pressed }) => [
                  styles.timeInput,
                  pressed && styles.timeInputPressed,
                ]}
              >
                <Text style={styles.timeInputText}>
                  {reminderTime ? reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
                </Text>
              </Pressable>
            )}
          </View>
          {showTimePicker && (
            <DateTimePicker
              value={reminderTime || new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setReminderTime(selectedTime);
              }}
            />
          )}

          <Text style={styles.label}>Reminder Level</Text>
          <TouchableOpacity
            style={[styles.optionButton, reminderLevel === '1' && styles.optionButtonSelected]}
            onPress={() => setReminderLevel('1')}
          >
            <View>
              <Text style={reminderLevel === '1' ? styles.optionTextSelected : styles.optionText}>
                Level 1 - Notification
              </Text>
              <Text style={reminderLevel === '1' ? styles.optionSubTextSelected : styles.optionSubText}>
                Simple notification that can be dismissed
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, reminderLevel === '2' && styles.optionButtonSelected]}
            onPress={() => setReminderLevel('2')}
          >
            <View>
              <Text style={reminderLevel === '2' ? styles.optionTextSelected : styles.optionText}>
                Level 2 - Alert
              </Text>
              <Text style={reminderLevel === '2' ? styles.optionSubTextSelected : styles.optionSubText}>
                Persistent alert with sound
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, reminderLevel === '3' && styles.optionButtonSelected]}
            onPress={() => setReminderLevel('3')}
          >
            <View>
              <Text style={reminderLevel === '3' ? styles.optionTextSelected : styles.optionText}>
                Level 3 - Alarm
              </Text>
              <Text style={reminderLevel === '3' ? styles.optionSubTextSelected : styles.optionSubText}>
                Loud alarm with snooze option
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity style={styles.bottomButton} onPress={handleSave}>
          <Text style={styles.saveFlowText}>
            {createAsPlan 
              ? (flowToEdit ? 'Update Plan' : 'Save Plan')
              : (flowToEdit ? 'Update Flow' : 'Save Flow')
            }
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  label: {
    marginTop: 16,
    fontWeight: 'bold',
    bottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInputPressed: {
    backgroundColor: '#F2A005',
    borderColor: '#F2A005',
  },
  timeInputText: {
    color: '#F2A005',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  toggleSwitch: {
    marginRight: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 12,
    gap: 8,
  },
  dayButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#F5A623',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dayButtonSelected: {
    backgroundColor: '#F2A005',
    borderColor: '#F2A005',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#F2A005',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    backgroundColor: '#F2A005',
    borderColor: '#F2A005',
  },
  optionText: {
    color: '#333',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  optionSubText: {
    color: '#888',
    fontSize: 12,
  },
  optionSubTextSelected: {
    color: '#fff',
    fontSize: 12,
  },
  frequencyContainer: {
    marginTop: 16,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  frequencyButtonSelected: {
    backgroundColor: '#F2A005',
    borderColor: '#F2A005',
  },
  frequencyText: {
    color: '#333',
    fontWeight: '600',
  },
  frequencyTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timeBasedContainer: {
    marginTop: 4,
  },
  timerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    padding: 12,
    textAlign: 'center',
    backgroundColor: '#fff',
    width: 60,
  },
  timerLabel: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  timerSeparator: {
    fontSize: 20,
    color: '#333',
  },
  monthDaysContainer: {
    marginTop: 12,
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  reminderTimeContainer: {
    marginTop: 16,
  },
  bottomButton: {
    padding: 16,
    backgroundColor: '#F5A623',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  saveFlowText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
