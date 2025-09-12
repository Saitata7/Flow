import React, { useState, useCallback, useContext } from 'react';
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

const Quantitative = ({ habit }) => {
  const navigation = useNavigation();
  const { updateCount, updateHabitStatus } = useContext(HabitsContext);
  const todayKey = moment().format('YYYY-MM-DD');
  const status = habit.status?.[todayKey]?.symbol || '-';
  const emotion = habit.status?.[todayKey]?.emotion || '';
  const note = habit.status?.[todayKey]?.note || '';
  const habitTime = habit.reminderTime ? moment(habit.reminderTime).format('h:mm A') : 'No time set';
  const timeVariation = getTimeVariation(habit);
  const { days: streakDays, currentStreak } = calculateStreak(habit);
  const initialCount = habit.status?.[todayKey]?.quantitative?.count || 0;
  const maxCount = (habit.goalCount || 0) + 30;
  const [count, setCount] = useState(initialCount);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmotion, setTempEmotion] = useState(emotion);
  const [tempNote, setTempNote] = useState(note);

  const isCompleted = count > 0;
  const isMissed = count === 0 && status === '❌';

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

  const handleAction = useCallback((action) => {
    triggerHaptic();
    let newCount = action === '+' ? count + 1 : Math.max(0, count - 1);
    if (newCount > maxCount) newCount = maxCount;
    
    setCount(newCount);
    updateCount(habit.id, todayKey, action);
  }, [habit.id, todayKey, count, maxCount, updateCount, triggerHaptic]);

  const handleSaveEdits = useCallback(() => {
    updateHabitStatus(habit.id, todayKey, {
      symbol: count > 0 ? '+' : count === 0 && status === '❌' ? '❌' : '-',
      emotion: tempEmotion,
      note: tempNote,
      quantitative: { count: count, unitText: habit.status?.[todayKey]?.quantitative?.unitText || '' }
    });
    setIsEditing(false);
  }, [habit.id, todayKey, tempEmotion, tempNote, count, status, updateHabitStatus]);

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
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            {(habit.reminderTime && count <= 1) && (
              <View style={styles.timestampContainer}>
                <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                <Text style={styles.timestampText}>{habitTime}</Text>
              </View>
            )}
            {count > 1 && habit.goalCount && (
              <Text style={styles.goalText}>Goal: {habit.goalCount}</Text>
            )}
          </View>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.missButton]}
              onPress={() => handleAction('-')}
            >
              <LinearGradient
                colors={['#FEECEC', '#FCA5A5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.actionButtonText}>–</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.countButton}>
              <Text style={styles.countText}>{count}</Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleAction('+')}
            >
              <LinearGradient
                colors={['#E6F5E6', '#A3E635']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.actionButtonText}>+</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
                  placeholder={count > 0 ? 'How was working on this habit?' : 'Why did you miss this habit?'}
                  multiline
                />
              ) : (
                <Text style={styles.detailText}>
                  {note || (count > 0 ? 'How was working on this habit?' : 'Why did you miss this habit?')}
                </Text>
              )}
            </View>

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
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
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
  goalText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 4,
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
  missButton: {},
  completeButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Inter',
  },
  countButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
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
});

export default Quantitative;