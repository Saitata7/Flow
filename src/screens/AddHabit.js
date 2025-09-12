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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HabitsContext } from '../context/HabitContext';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function AddHabit({ navigation }) {
  const { addHabit } = useContext(HabitsContext);
  const route = useRoute();
  const { habitToEdit } = route.params || {};

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
    if (habitToEdit) {
      setTitle(habitToEdit.title || '');
      setDescription(habitToEdit.description || '');
      setTrackingType(habitToEdit.trackingType || 'Binary');
      setFrequency(habitToEdit.frequency || 'Daily');
      setEveryDay(habitToEdit.everyDay || false);
      setSelectedDays(habitToEdit.daysOfWeek || []);
      setReminderTimeEnabled(!!habitToEdit.reminderTime);
      setReminderTime(habitToEdit.reminderTime ? new Date(habitToEdit.reminderTime) : null);
      setReminderLevel(habitToEdit.reminderLevel?.toString() || '1');
      setUnitText(habitToEdit.unitText || '');
      if (habitToEdit.hours !== undefined) {
        setHours(habitToEdit.hours);
        setHoursInput(habitToEdit.hours.toString().padStart(2, '0'));
      }
      if (habitToEdit.minutes !== undefined) {
        setMinutes(habitToEdit.minutes);
        setMinutesInput(habitToEdit.minutes.toString().padStart(2, '0'));
      }
      if (habitToEdit.seconds !== undefined) {
        setSeconds(habitToEdit.seconds);
        setSecondsInput(habitToEdit.seconds.toString().padStart(2, '0'));
      }
      if (habitToEdit.trackingType === 'Quantitative' && habitToEdit.goal !== undefined) {
        setGoal(habitToEdit.goal);
        setGoalInput(habitToEdit.goal.toString());
      }
    }
  }, [habitToEdit]);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title) {
      alert('Please enter a title');
      return;
    }
    if (frequency === 'Daily' && !everyDay && selectedDays.length === 0) {
      alert('Please select at least one day or enable "Every Day"');
      return;
    }
    if (frequency === 'Monthly' && selectedDays.length === 0) {
      alert('Please select at least one day of the month');
      return;
    }
    if (trackingType === 'Quantitative' && !unitText.trim()) {
      alert('Please enter a unit for Quantitative tracking');
      return;
    }
    if (trackingType === 'Time-based' && hours === 0 && minutes === 0 && seconds === 0) {
      alert('Please set a non-zero goal duration for Time-based tracking');
      return;
    }
    if (trackingType === 'Quantitative' && goalInput && (parseInt(goalInput) < 0 || isNaN(parseInt(goalInput)))) {
      alert('Please enter a valid goal (non-negative number) for Quantitative tracking');
      return;
    }

    const newHabit = {
      id: habitToEdit?.id || Date.now().toString(),
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

    console.log('Saving new habit:', JSON.stringify(newHabit, null, 2));
    try {
      await addHabit(newHabit);
      console.log('Habit saved successfully, navigating to Home');
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (e) {
      console.error('Error saving habit:', e);
      alert('Failed to save habit. Please try again.');
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
            placeholder="Optional description about your habit..."
          />

          <Text style={styles.label}>Habit Tracking Type</Text>
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
                onChangeText={(text) => setGoalInput(text.replace(/[^0-9]/g, ''))}
                onBlur={() => {
                  const num = parseInt(goalInput) || 0;
                  setGoal(Math.max(0, num));
                  setGoalInput(num.toString());
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
                  onChangeText={(text) => setHoursInput(text.replace(/[^0-9]/g, ''))}
                  onBlur={() => {
                    const num = parseInt(hoursInput) || 0;
                    setHours(Math.max(0, Math.min(23, num)));
                    setHoursInput(num.toString().padStart(2, '0'));
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
                  onChangeText={(text) => setMinutesInput(text.replace(/[^0-9]/g, ''))}
                  onBlur={() => {
                    const num = parseInt(minutesInput) || 0;
                    setMinutes(Math.max(0, Math.min(59, num)));
                    setMinutesInput(num.toString().padStart(2, '0'));
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
                  onChangeText={(text) => setSecondsInput(text.replace(/[^0-9]/g, ''))}
                  onBlur={() => {
                    const num = parseInt(secondsInput) || 0;
                    setSeconds(Math.max(0, Math.min(59, num)));
                    setSecondsInput(num.toString().padStart(2, '0'));
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
          <Text style={styles.saveHabitText}>{habitToEdit ? 'Update Habit' : 'Save Habit'}</Text>
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
  saveHabitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});