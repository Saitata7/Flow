import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Pressable,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { HabitsContext } from '../context/HabitContext';
import { ThemeContext } from '../context/ThemeContext';
import { format, isValid, parseISO, addDays } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const EditHabitScreen = ({ route, navigation }) => {
  const { habitId } = route.params || {};
  const { habits = [], updateHabit = () => {} } = useContext(HabitsContext) || {};
  const { textSize = 'medium', highContrast = false, cheatMode = false } = useContext(ThemeContext) || {};
  const habit = habits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.errorText, { fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18 }]}>
          Habit not found
        </Text>
      </SafeAreaView>
    );
  }

  // State
  const [title, setTitle] = useState(habit.title || '');
  const [description, setDescription] = useState(habit.description || '');
  const [trackingType, setTrackingType] = useState(habit.trackingType || 'Binary');
  const [frequency, setFrequency] = useState(habit.frequency || 'Daily');
  const [everyDay, setEveryDay] = useState(habit.everyDay || false);
  const [selectedDays, setSelectedDays] = useState(habit.daysOfWeek || []);
  const [reminderTimeEnabled, setReminderTimeEnabled] = useState(!!habit.reminderTime);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime ? parseISO(habit.reminderTime) : null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderLevel, setReminderLevel] = useState(habit.reminderLevel?.toString() || '1');
  const [unitText, setUnitText] = useState(habit.unitText || '');
  const [hours, setHours] = useState(habit.hours || 0);
  const [minutes, setMinutes] = useState(habit.minutes || 0);
  const [seconds, setSeconds] = useState(habit.seconds || 0);
  const [hoursInput, setHoursInput] = useState(habit.hours?.toString().padStart(2, '0') || '00');
  const [minutesInput, setMinutesInput] = useState(habit.minutes?.toString().padStart(2, '0') || '00');
  const [secondsInput, setSecondsInput] = useState(habit.seconds?.toString().padStart(2, '0') || '00');
  const [goal, setGoal] = useState(habit.goal || 0);
  const [goalInput, setGoalInput] = useState(habit.goal?.toString() || '');

  const scaleAnim = new Animated.Value(1);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const toggleDay = useCallback((day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const generateStatusDates = () => {
    const status = {};
    const start = new Date();
    for (let i = 0; i < 7; i++) {
      const dateKey = format(addDays(start, i), 'yyyy-MM-dd');
      status[dateKey] = {
        symbol: '-',
        emotion: null,
        note: null,
        timestamp: null,
      };
    }
    return status;
  };

  const handleSave = useCallback(async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (frequency === 'Daily' && !everyDay && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day or enable "Every Day"');
      return;
    }
    if (frequency === 'Monthly' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the month');
      return;
    }
    if (trackingType === 'Quantitative' && !unitText.trim()) {
      Alert.alert('Error', 'Please enter a unit for Quantitative tracking');
      return;
    }
    if (trackingType === 'Time-based' && hours === 0 && minutes === 0 && seconds === 0) {
      Alert.alert('Error', 'Please set a non-zero goal duration for Time-based tracking');
      return;
    }
    if (trackingType === 'Quantitative' && goalInput && (parseInt(goalInput) < 0 || isNaN(parseInt(goalInput)))) {
      Alert.alert('Error', 'Please enter a valid goal (non-negative number) for Quantitative tracking');
      return;
    }
    if (reminderTimeEnabled && reminderTime && !isValid(reminderTime)) {
      Alert.alert('Error', 'Please select a valid reminder time');
      return;
    }
    if (!cheatMode && reminderTimeEnabled && reminderTime && moment(reminderTime).isAfter(moment())) {
      Alert.alert('Error', 'Reminder time cannot be in the future unless cheat mode is enabled');
      return;
    }

    const updates = {
      id: habit.id,
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
      status: habit.status || generateStatusDates(),
    };

    try {
      await updateHabit(habit.id, updates);
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch (error) {
      console.error('Failed to update habit:', error);
      Alert.alert('Error', 'Failed to update habit');
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
    habit.id,
    habit.status,
    updateHabit,
    navigation,
    cheatMode,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={['#FFE3C3', '#FFFFFF']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle={'dark-content'}
          />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.viewContainer}>
              <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                Title
              </Text>
              <TextInput
                style={[styles.input, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Read for 30 minutes"
                placeholderTextColor={highContrast ? '#666' : '#999'}
              />

              <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                Description
              </Text>
              <TextInput
                style={[styles.input, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description about your habit..."
                placeholderTextColor={highContrast ? '#666' : '#999'}
              />

              <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                Habit Tracking Type
              </Text>
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
                  <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                    Unit
                  </Text>
                  <TextInput
                    style={[styles.input, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}
                    value={unitText}
                    onChangeText={setUnitText}
                    placeholder="e.g., glasses, steps"
                    placeholderTextColor={highContrast ? '#666' : '#999'}
                  />
                  <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                    Goal (Optional)
                  </Text>
                  <TextInput
                    style={[styles.input, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}
                    value={goalInput}
                    onChangeText={(text) => setGoalInput(text.replace(/[^0-9]/g, ''))}
                    onBlur={() => {
                      const num = parseInt(goalInput) || 0;
                      setGoal(Math.max(0, num));
                      setGoalInput(num.toString());
                    }}
                    keyboardType="numeric"
                    placeholder="e.g., 8"
                    placeholderTextColor={highContrast ? '#666' : '#999'}
                  />
                </View>
              )}

              {trackingType === 'Time-based' && (
                <View style={styles.timeBasedContainer}>
                  <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                    Goal Duration
                  </Text>
                  <View style={styles.timerInput}>
                    <TextInput
                      style={[styles.timerField, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}
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
                      placeholderTextColor={highContrast ? '#666' : '#999'}
                    />
                    <Text style={styles.timerLabel}>hrs</Text>
                    <Text style={styles.timerSeparator}>:</Text>
                    <TextInput
                      style={[styles.timerField, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}
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
                      placeholderTextColor={highContrast ? '#666' : '#999'}
                    />
                    <Text style={styles.timerLabel}>mins</Text>
                    <Text style={styles.timerSeparator}>:</Text>
                    <TextInput
                      style={[styles.timerField, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}
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
                      placeholderTextColor={highContrast ? '#666' : '#999'}
                    />
                    <Text style={styles.timerLabel}>sec</Text>
                  </View>
                </View>
              )}

              <View style={styles.frequencyContainer}>
                <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                  Frequency
                </Text>
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
                    <Text style={[styles.toggleLabel, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                      Every Day
                    </Text>
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
                              fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
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
                  <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                    Days of Month
                  </Text>
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
                            fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
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
                  <Text style={[styles.toggleLabel, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                    Reminder Time
                  </Text>
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
                    <Text style={[styles.timeInputText, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
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
                    setShowTimePicker(Platform.OS === 'ios' ? true : false);
                    if (selectedTime && event.type !== 'dismissed') {
                      setReminderTime(selectedTime);
                      setShowTimePicker(false);
                    }
                  }}
                />
              )}

              <Text style={[styles.label, { fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16 }]}>
                Reminder Level
              </Text>
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

              <View style={styles.buttonRow}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.successButton]}
                    onPress={handleSave}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Text style={[styles.actionButtonText, { fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18 }]}>
                      Update Habit
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Text style={[styles.actionButtonText, { fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18 }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  viewContainer: {
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#fff',
  },
  label: {
    marginTop: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  toggleLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    color: '#333',
  },
  toggleSwitch: {
    marginRight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    backgroundColor: '#fff',
    color: '#333',
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
    fontWeight: '600',
  },
  timerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
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
    color: '#333',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  monthDaysContainer: {
    marginVertical: 12,
  },
  monthDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
  reminderTimeContainer: {
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 100,
  },
  successButton: {
    backgroundColor: '#F5A623',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#dc3545',
  },
});

export default EditHabitScreen;