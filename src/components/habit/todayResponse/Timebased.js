import React, { useState, useCallback, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { HabitsContext } from '../../../context/HabitContext';
import { useNavigation } from '@react-navigation/native';

const getTimeVariation = (habit) => {
  if (habit.frequency === 'Daily') {
    if (habit.everyDay) {
      return 'Everyday';
    } else if (habit.daysOfWeek && habit.daysOfWeek.length > 0) {
      if (habit.daysOfWeek.length === 1) {
        return habit.daysOfWeek[0];
      } else if (habit.daysOfWeek.length === 5 && 
                 ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every(day => habit.daysOfWeek.includes(day))) {
        return 'Mon - Fri';
      } else if (habit.daysOfWeek.length === 3 && 
                 ['Mon', 'Tue', 'Wed'].every(day => habit.daysOfWeek.includes(day))) {
        return 'Mo, Tu, We';
      } else if (habit.daysOfWeek.length === 6 && 
                 ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].every(day => habit.daysOfWeek.includes(day))) {
        return 'Mo, Tu, We, Th, Sa, Su';
      } else if (habit.daysOfWeek.length === 2 && 
                 ['Wed', 'Fri'].every(day => habit.daysOfWeek.includes(day))) {
        return 'Wed & Fri';
      } else {
        return habit.daysOfWeek.join(', ');
      }
    }
  }
  return habit.frequency || 'No frequency set';
};

const calculateStreak = (habit) => {
  if (!habit.status) return { days: [], currentStreak: 0 };
  
  let streak = 0;
  const today = moment().startOf('day');
  const streakDays = [];
  
  for (let i = 0; i < 365; i++) {
    const date = moment(today).subtract(i, 'days');
    const dateKey = date.format('YYYY-MM-DD');
    const status = habit.status[dateKey]?.symbol;
    
    if (status === '✅' || status === '✓' || status === '+') {
      streakDays.unshift(date.date());
      streak++;
    } else if (status === '❌' || status === '-' || (i === 0 && !status)) {
      break;
    }
  }
  
  return { days: streakDays, currentStreak: streak };
};

const formatTimeBasedDuration = (timebased) => {
  if (!timebased || !timebased.totalDuration) return '0s';
  const totalSeconds = Math.floor(timebased.totalDuration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
};

const calculatePauses = (timebased) => {
  if (!timebased || !timebased.pauses) return 0;
  return timebased.pauses.length;
};

const Timebased = ({ habit }) => {
  const navigation = useNavigation();
  const { updateTimeBased, updateHabitStatus } = useContext(HabitsContext);
  const todayKey = moment().format('YYYY-MM-DD');
  const status = habit.status?.[todayKey]?.symbol || '-';
  const emotion = habit.status?.[todayKey]?.emotion || '';
  const note = habit.status?.[todayKey]?.note || '';
  const habitTime = habit.reminderTime ? moment(habit.reminderTime).format('h:mm A') : 'No time set';
  const timeVariation = getTimeVariation(habit);
  const { days: streakDays, currentStreak } = calculateStreak(habit);
  const timebased = habit.status?.[todayKey]?.timebased || {
    hours: habit.hours || 0,
    minutes: habit.minutes || 0,
    seconds: habit.seconds || 0,
    start0: null,
    startTime: null,
    pauses: [],
    stop: null,
    endTime: null,
    totalDuration: 0,
    pausesCount: 0
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmotion, setTempEmotion] = useState(emotion);
  const [tempNote, setTempNote] = useState(note);

  const isPending = status === '-' && !timebased.start0 && !timebased.stop;
  const isCompleted = status === '✅';
  const isMissed = status === '❌' && !timebased.start0;
  const pausesCount = calculatePauses(timebased);
  const isStopped = timebased.stop !== null;
  const isPaused = timebased.start0 && !timebased.stop && timebased.pauses.length > 0 && !timebased.pauses[timebased.pauses.length - 1].end;

  // Debug state changes
  useEffect(() => {
    console.log('Habit state:', { habitId: habit.id, status, timebased, isMissed, isStopped, isPending });
  }, [habit, status, timebased, isMissed, isStopped, isPending]);

  const emotions = [
    { label: 'Happy', emoji: '😊' },
    { label: 'Neutral', emoji: '😐' },
    { label: 'Sad', emoji: '😞' },
    { label: 'Excited', emoji: '🎉' },
    { label: 'Stressed', emoji: '😓' },
  ];

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    triggerHaptic();
    const now = new Date();
    const timeUpdate = { pauses: timebased.pauses || [], startTime: timebased.startTime };
    let totalDuration = timebased.totalDuration || 0;
    let newPausesCount = pausesCount;

    console.log('handleTimeUpdate:', { isPaused, start0: timebased.start0, stop: timebased.stop, pauses: timebased.pauses });

    if (!timebased.start0) {
      // Start the timer
      timeUpdate.start0 = now.toISOString();
      timeUpdate.startTime = now.toISOString();
    } else if (timebased.start0 && !timebased.stop) {
      if (isPaused) {
        // Resume from pause
        timeUpdate.pauses = [...timebased.pauses.slice(0, -1), { start: timebased.pauses[timebased.pauses.length - 1].start, end: now.toISOString() }];
        totalDuration += (now - new Date(timebased.pauses[timebased.pauses.length - 1].start)) / 1000;
      } else {
        // Start a new pause
        timeUpdate.pauses = [...timebased.pauses, { start: now.toISOString(), end: null }];
        newPausesCount = pausesCount + 1;
      }
    }

    console.log('Updating timebased:', { timeUpdate, totalDuration, newPausesCount });

    updateTimeBased(habit.id, todayKey, {
      ...timeUpdate,
      totalDuration,
      pausesCount: newPausesCount
    });
  }, [habit.id, todayKey, timebased, pausesCount, isPaused, updateTimeBased, triggerHaptic]);

  const handleStop = useCallback(() => {
    triggerHaptic();
    const now = new Date();
    let totalDuration = timebased.totalDuration || 0;
    const timeUpdate = { pauses: timebased.pauses || [], stop: now.toISOString(), endTime: now.toISOString(), startTime: timebased.startTime };

    if (timebased.start0 && !timebased.stop) {
      if (timebased.pauses.length > 0 && !timebased.pauses[timebased.pauses.length - 1].end) {
        timeUpdate.pauses = [...timebased.pauses.slice(0, -1), { start: timebased.pauses[timebased.pauses.length - 1].start, end: now.toISOString() }];
        totalDuration += (now - new Date(timebased.pauses[timebased.pauses.length - 1].start)) / 1000;
      } else {
        totalDuration += (now - new Date(timebased.pauses.length > 0 ? timebased.pauses[timebased.pauses.length - 1].end : timebased.start0)) / 1000;
      }
    }

    const newSymbol = totalDuration > 1 ? '✅' : '❌';

    console.log('Stopping timer:', { totalDuration, newSymbol, pauses: timeUpdate.pauses, startTime: timeUpdate.startTime, endTime: timeUpdate.endTime });

    updateTimeBased(habit.id, todayKey, {
      ...timeUpdate,
      totalDuration,
      pausesCount
    });

    updateHabitStatus(habit.id, todayKey, { symbol: newSymbol, timebased: { ...timebased, ...timeUpdate, totalDuration, pausesCount } });
  }, [habit.id, todayKey, timebased, pausesCount, updateTimeBased, updateHabitStatus, triggerHaptic]);

  const handleSkip = useCallback(() => {
    triggerHaptic();
    const resetTimebased = {
      hours: habit.hours || 0,
      minutes: habit.minutes || 0,
      seconds: habit.seconds || 0,
      start0: null,
      startTime: null,
      pauses: [],
      stop: new Date().toISOString(),
      endTime: new Date().toISOString(),
      totalDuration: 0,
      pausesCount: 0
    };
    console.log('Skipping habit:', { habitId: habit.id, todayKey });
    updateHabitStatus(habit.id, todayKey, { symbol: '❌', timebased: resetTimebased });
  }, [habit.id, todayKey, habit.hours, habit.minutes, habit.seconds, updateHabitStatus, triggerHaptic]);

  const handleResetTime = useCallback(() => {
    triggerHaptic();
    const resetTimebased = {
      hours: habit.hours || 0,
      minutes: habit.minutes || 0,
      seconds: habit.seconds || 0,
      start0: null,
      startTime: null,
      pauses: [],
      stop: null,
      endTime: null,
      totalDuration: 0,
      pausesCount: 0
    };
    console.log('Resetting timer:', { habitId: habit.id, todayKey });
    updateTimeBased(habit.id, todayKey, resetTimebased);
    updateHabitStatus(habit.id, todayKey, {
      symbol: '-',
      emotion: null,
      note: timebased.note,
      timebased: resetTimebased
    });
    setIsEditing(false);
  }, [habit.id, todayKey, habit.hours, habit.minutes, habit.seconds, timebased.note, updateTimeBased, updateHabitStatus, triggerHaptic]);

  const handleSaveEdits = useCallback(() => {
    console.log('Saving edits:', { emotion: tempEmotion, note: tempNote });
    updateHabitStatus(habit.id, todayKey, {
      symbol: status,
      emotion: tempEmotion,
      note: tempNote,
      timebased: { ...timebased, pausesCount }
    });
    setIsEditing(false);
  }, [habit.id, todayKey, tempEmotion, tempNote, status, timebased, pausesCount, updateHabitStatus]);

  const handleCardPress = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleViewDetails = () => {
    navigation.navigate('HabitDetails', { habitId: habit.id });
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
      <View style={styles.cardContainer}>
        {/* Card Header */}
        <View style={[styles.headerContainer, isMissed && { backgroundColor: 'transparent' }]}>
          {isMissed ? (
            <LinearGradient
              colors={['#FFFFFF', '#FEE2E2']} // Left white to right red gradient for Missed card
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              <View style={styles.headerLeft}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                {habit.reminderTime && (
                  <View style={styles.timestampContainer}>
                    <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                    <Text style={styles.timestampText}>{habitTime}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtonsContainer}>
                <Text style={styles.missedText}>Missed</Text>
              </View>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.headerLeft}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                {habit.reminderTime && (
                  <View style={styles.timestampContainer}>
                    <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                    <Text style={styles.timestampText}>{habitTime}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtonsContainer}>
                {console.log('Rendering buttons:', { isMissed, isStopped, isPending, start0: timebased.start0, symbol: status })}
                {isStopped ? (
                  <View style={[styles.actionButton, styles.timeSpentButton]}>
                    <LinearGradient
                      colors={['#FFEDD5', '#F97316']} // Light orange gradient for Time Spent
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.actionButtonText}>Time Spent: {formatTimeBasedDuration(timebased)}</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={handleTimeUpdate}
                    >
                      <LinearGradient
                        colors={['#D1FAE5', '#10B981']} // Light green gradient for Start/Resume
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>
                          {isPaused ? '🟢 Resume' : timebased.start0 ? '⏸ Pause' : '🟢 Start'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.stopButton]}
                      onPress={timebased.start0 ? handleStop : handleSkip}
                    >
                      <LinearGradient
                        colors={['#FEE2E2', '#FECACA']} // Light red gradient for Stop/Skip
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>
                          {timebased.start0 ? '🔴 Stop' : '❌ Skip'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={14} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{habitTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="calendar-today" size={14} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{timeVariation}</Text>
            </View>
            {timebased.startTime && (
              <View style={styles.detailRow}>
                <MaterialIcons name="play-arrow" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>Start Time: {moment(timebased.startTime).format('h:mm A')}</Text>
              </View>
            )}
            {timebased.endTime && (
              <View style={styles.detailRow}>
                <MaterialIcons name="stop" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>End Time: {moment(timebased.endTime).format('h:mm A')}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <MaterialIcons name="pause" size={14} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>Number of Pauses: {pausesCount}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="timer" size={14} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>Time Spent: {formatTimeBasedDuration(timebased)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="mood" size={14} color="#6B7280" style={styles.detailIcon} />
              {isEditing ? (
                <View style={styles.emojiContainer}>
                  {emotions.map((emotion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setTempEmotion(emotion.emoji)}
                      style={[styles.emojiButton, tempEmotion === emotion.emoji && styles.selectedEmoji]}
                    >
                      <Text style={styles.emojiText}>{emotion.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.detailText}>{emotion || 'No emotion set'}</Text>
              )}
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="note" size={14} color="#6B7280" style={styles.detailIcon} />
              {isEditing ? (
                <TextInput
                  style={styles.noteInput}
                  value={tempNote}
                  onChangeText={setTempNote}
                  placeholder={isCompleted ? 'How was working on this habit?' : 'Why did you miss this habit?'}
                  multiline
                />
              ) : (
                <Text style={styles.detailText}>
                  {note || (isCompleted ? 'How was working on this habit?' : 'Why did you miss this habit?')}
                </Text>
              )}
            </View>
            <View style={styles.detailActionContainer}>
              <TouchableOpacity onPress={handleViewDetails}>
                <Text style={styles.actionText}>View Details</Text>
              </TouchableOpacity>
              {isEditing ? (
                <TouchableOpacity onPress={handleSaveEdits}>
                  <Text style={styles.actionText}>Done</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text style={styles.actionText}>{note ? 'Edit' : 'Add Notes'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleResetTime}>
                <Text style={styles.actionText}>Reset Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Streak Display */}
        {currentStreak >= 5 && (isCompleted || isMissed) && !isExpanded && (
          <View style={styles.streakCard}>
            <Text style={styles.streakLabel}>⚡ Habit Streak - {currentStreak}</Text>
            <View style={styles.streakContainer}>
              {streakDays.slice(-7).map((day, index) => (
                <View
                  key={index}
                  style={[
                    styles.streakDay,
                    day === moment().date() && { backgroundColor: '#EA4335' },
                    index > 0 && { marginLeft: 4 },
                  ]}
                >
                  <Text style={styles.streakDayText}>{day}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 0, // Ensure no borders
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Plain white background for initial state
    borderWidth: 0, // Ensure no borders
  },
  gradientHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 0, // Ensure no borders
  },
  headerLeft: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'inter',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E1',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
    borderWidth: 0, // Ensure no borders
  },
  clockIcon: {
    marginRight: 4,
  },
  timestampText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'inter',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0, // Ensure no borders
  },
  actionButton: {
    width: 80,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 0, // Ensure no borders
  },
  timeSpentButton: {
    width: 160,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 0, // Ensure no borders
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0, // Ensure no borders
  },
  missedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444', // Red text for Missed
    fontFamily: 'inter',
    marginHorizontal: 8,
  },
  startButton: {},
  stopButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'inter',
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 0,
    borderWidth: 0, // Ensure no borders
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'inter',
  },
  emojiContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 0, // Ensure no borders
  },
  selectedEmoji: {
    backgroundColor: '#D1D5DB',
  },
  emojiText: {
    fontSize: 18,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    fontFamily: 'inter',
    color: '#333333',
    minHeight: 60,
  },
  detailActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    fontFamily: 'inter',
  },
  streakCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 0, // Ensure no borders
  },
  streakLabel: {
    fontSize: 14,
    color: '#C2410C',
    fontWeight: '600',
    fontFamily: 'inter',
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  streakDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0, // Ensure no borders
  },
  streakDayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'inter',
  },
});

export default Timebased;