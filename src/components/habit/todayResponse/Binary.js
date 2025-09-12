import React, { useState, useCallback, useContext, Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { HabitsContext } from '../../../context/HabitContext';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Define emotions array
const emotions = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Sad', emoji: '😞' },
  { label: 'Excited', emoji: '🎉' },
  { label: 'Stressed', emoji: '😓' },
];

const getTimeVariation = (habit) => {
  if (!habit) return 'No frequency set';

  const { repeatType, everyDay, daysOfWeek, selectedMonthDays } = habit;

  if (repeatType === 'day' && everyDay) {
    return 'Everyday';
  } else if (repeatType === 'day' && daysOfWeek && daysOfWeek.length > 0) {
    if (daysOfWeek.length === 1) {
      return daysOfWeek[0].slice(0, 3);
    } else if (daysOfWeek.length === 5 && 
               ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every(day => daysOfWeek.includes(day))) {
      return 'Mon - Fri';
    } else if (daysOfWeek.length === 2) {
      return `${daysOfWeek[0].slice(0, 3)} & ${daysOfWeek[1].slice(0, 3)}`;
    } else {
      return daysOfWeek.map(day => day.slice(0, 2).toUpperCase()).join(', ');
    }
  } else if (repeatType === 'month' && selectedMonthDays && selectedMonthDays.length > 0) {
    if (selectedMonthDays.length === 1) {
      return `Day ${selectedMonthDays[0]}`;
    } else {
      return `Days ${selectedMonthDays.join(', ')}`;
    }
  }

  return 'No frequency set';
};

const calculateStreak = (habit) => {
  if (!habit?.status) return { days: [], currentStreak: 0 };
  
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

const Binary = ({ habit }) => {
  if (!habit) {
    console.error('Binary: habit prop is undefined');
    return null;
  }

  const { updateHabitStatus } = useContext(HabitsContext);
  const navigation = useNavigation();
  const todayKey = moment().format('YYYY-MM-DD');
  const status = habit.status?.[todayKey]?.symbol || '-';
  const emotion = habit.status?.[todayKey]?.emotion || '';
  const note = habit.status?.[todayKey]?.note || '';
  const habitTime = habit.time ? moment(habit.time).format('h:mm A') : null;
  const timeVariation = getTimeVariation(habit);
  const { days: streakDays, currentStreak } = calculateStreak(habit);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmotion, setTempEmotion] = useState(emotion);
  const [tempNote, setTempNote] = useState(note);
  const [tempStatus, setTempStatus] = useState(status);

  const isPending = status === '-';
  const isCompleted = status === '✅';
  const isMissed = status === '❌';

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleStatusPress = useCallback(async (symbol) => {
    triggerHaptic();
    setTempStatus(symbol);
    try {
      await updateHabitStatus(habit.id, todayKey, {
        symbol,
        note: note || null,
        emotion: tempEmotion || null,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to update habit status:', e);
    }
  }, [updateHabitStatus, habit.id, todayKey, note, tempEmotion]);

  const handleSaveEdits = useCallback(async () => {
    try {
      await updateHabitStatus(habit.id, todayKey, {
        symbol: tempStatus,
        emotion: tempEmotion,
        note: tempNote.trim() || null,
        timestamp: new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save edits:', e);
    }
  }, [updateHabitStatus, habit.id, todayKey, tempStatus, tempEmotion, tempNote]);

  const handleCardPress = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
      triggerHaptic();
    }
  };

  const handleViewDetails = () => {
    triggerHaptic();
    navigation.navigate('HabitDetails', { habitId: habit.id });
  };

  return (
    <ErrorBoundary>
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
        <View style={styles.cardContainer}>
          {/* Card Header */}
          {(isCompleted || isMissed) ? (
            <LinearGradient
              colors={isCompleted ? ['#F9FAFB', '#E6F5E6'] : ['#F9FAFB', '#FEECEC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerContainer}
            >
              <View style={styles.headerLeft}>
                <Text style={styles.habitTitle}>
                  {habit.title}
                  {isCompleted && currentStreak > 3 && (
                    <Text style={styles.streakText}> {currentStreak}</Text>
                  )}
                </Text>
                {isMissed && habitTime && (
                  <View style={styles.timestampContainer}>
                    <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                    <Text style={styles.timestampText}>{habitTime}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.statusText, { color: isCompleted ? '#34A853' : '#EA4335' }]}>
                {isCompleted ? 'Completed' : 'Missed'}
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.headerContainer}>
              <View style={styles.headerLeft}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                {habitTime && (
                  <View style={styles.timestampContainer}>
                    <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                    <Text style={styles.timestampText}>{habitTime}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.tickButton]}
                  onPress={() => handleStatusPress('✅')}
                >
                  <LinearGradient
                    colors={['#E6F5E6', '#A3E635']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.actionButtonText}>✅</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.crossButton]}
                  onPress={() => handleStatusPress('❌')}
                >
                  <LinearGradient
                    colors={['#FEECEC', '#FCA5A5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.actionButtonText}>❌</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <View style={styles.detailsContainer}>
              {isEditing && (
                <View style={styles.headerLeft}>
                  <Text style={styles.habitTitle}>
                    {habit.title}
                    {isCompleted && currentStreak > 3 && (
                      <Text style={styles.streakText}> {currentStreak}</Text>
                    )}
                  </Text>
                  <Text style={[styles.statusText, { color: isCompleted ? '#34A853' : isMissed ? '#EA4335' : '#6B7280' }]}>
                    {isCompleted ? 'Completed' : isMissed ? 'Missed' : 'View stats'}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>{habitTime || 'No time set'}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="calendar-today" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>{timeVariation}</Text>
              </View>
              
              {/* Emotion Display/Edit */}
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

              {/* Notes Display/Edit */}
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

              {/* Edit Status Buttons */}
              {isEditing && (
                <View style={styles.statusEditContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.tickButton]}
                    onPress={() => setTempStatus('✅')}
                  >
                    <LinearGradient
                      colors={['#E6F5E6', '#A3E635']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.actionButtonText}>✅</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.crossButton]}
                    onPress={() => setTempStatus('❌')}
                  >
                    <LinearGradient
                      colors={['#FEECEC', '#FCA5A5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.actionButtonText}>❌</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Buttons */}
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
              </View>
            </View>
          )}

          {/* Streak Display */}
          {currentStreak > 3 && (isCompleted || isMissed) && !isExpanded && (
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
    </ErrorBoundary>
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
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
    flexWrap: 'wrap',
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Inter',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    fontFamily: 'Inter',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E1',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  clockIcon: {
    marginRight: 4,
  },
  timestampText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'Inter',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickButton: {},
  crossButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
  },
  detailsContainer: {
    padding: 16,
    paddingTop: 0,
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
    fontFamily: 'Inter',
  },
  emojiContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
    fontFamily: 'Inter',
    color: '#333333',
    minHeight: 60,
  },
  statusEditContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
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
    fontFamily: 'Inter',
  },
  statusContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  streakCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
  },
  streakLabel: {
    fontSize: 14,
    color: '#C2410C',
    fontWeight: '600',
    fontFamily: 'Inter',
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
  },
  streakDayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFE6E6',
    borderRadius: 16,
  },
  errorText: {
    color: '#EA4335',
    fontSize: 14,
    fontFamily: 'Inter',
  },
});

export default Binary;