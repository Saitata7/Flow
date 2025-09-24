import React, { useState, useCallback, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { FlowsContext } from '../../../context/FlowContext';
import { useNavigation } from '@react-navigation/native';

const getTimeVariation = (flow) => {
  if (flow.frequency === 'Daily') {
    if (flow.everyDay) {
      return 'Everyday';
    } else if (flow.daysOfWeek && flow.daysOfWeek.length > 0) {
      if (flow.daysOfWeek.length === 1) {
        return flow.daysOfWeek[0];
      } else if (flow.daysOfWeek.length === 5 && 
                 ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every(day => flow.daysOfWeek.includes(day))) {
        return 'Mon - Fri';
      } else if (flow.daysOfWeek.length === 3 && 
                 ['Mon', 'Tue', 'Wed'].every(day => flow.daysOfWeek.includes(day))) {
        return 'Mo, Tu, We';
      } else if (flow.daysOfWeek.length === 6 && 
                 ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].every(day => flow.daysOfWeek.includes(day))) {
        return 'Mo, Tu, We, Th, Sa, Su';
      } else if (flow.daysOfWeek.length === 2 && 
                 ['Wed', 'Fri'].every(day => flow.daysOfWeek.includes(day))) {
        return 'Wed & Fri';
      } else {
        return flow.daysOfWeek.join(', ');
      }
    }
  }
  return flow.frequency || 'No frequency set';
};

const calculateStreak = (flow) => {
  if (!flow.status) return { days: [], currentStreak: 0 };
  
  let streak = 0;
  const today = moment().startOf('day');
  const streakDays = [];
  
  for (let i = 0; i < 365; i++) {
    const date = moment(today).subtract(i, 'days');
    const dateKey = date.format('YYYY-MM-DD');
    const status = flow.status[dateKey]?.symbol;
    
    if (status === '+' || status === '✓') {
      streakDays.unshift(date.date());
      streak++;
    } else if (status === '-' || status === '/' || (i === 0 && !status)) {
      break;
    }
  }
  
  return { days: streakDays, currentStreak: streak };
};

const Quantitative = ({ flow }) => {
  const navigation = useNavigation();
  const { updateCount, updateFlowStatus } = useContext(FlowsContext);
  const todayKey = moment().format('YYYY-MM-DD');
  const status = flow.status?.[todayKey]?.symbol || '-';
  const emotion = flow.status?.[todayKey]?.emotion || '';
  const note = flow.status?.[todayKey]?.note || '';
  const flowTime = flow.reminderTime ? moment(flow.reminderTime).format('h:mm A') : 'No time set';
  const timeVariation = getTimeVariation(flow);
  const { days: streakDays, currentStreak } = calculateStreak(flow);
  const initialCount = flow.status?.[todayKey]?.quantitative?.count || 0;
  const maxCount = (flow.goalCount || 0) + 30;
  const [count, setCount] = useState(initialCount);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmotion, setTempEmotion] = useState(emotion);
  const [tempNote, setTempNote] = useState(note);

  const isCompleted = count > 0;
  const isMissed = count === 0 && status === '-';

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

  const handleAction = useCallback(async (action) => {
    triggerHaptic();
    let newCount = action === '+' ? count + 1 : Math.max(0, count - 1);
    if (newCount > maxCount) newCount = maxCount;
    
    setCount(newCount);
    
    // Update context with the new count
    await updateFlowStatus(flow.id, todayKey, {
      symbol: newCount > 0 ? '+' : '-',
      emotion: tempEmotion,
      note: tempNote,
      quantitative: { count: newCount, unitText: flow.status?.[todayKey]?.quantitative?.unitText || '' }
    });
  }, [flow.id, todayKey, count, maxCount, updateFlowStatus, tempEmotion, tempNote, triggerHaptic]);

  const handleSaveEdits = useCallback(() => {
    updateFlowStatus(flow.id, todayKey, {
      symbol: count > 0 ? '+' : count === 0 && status === '-' ? '-' : '/',
      emotion: tempEmotion,
      note: tempNote,
      quantitative: { count: count, unitText: flow.status?.[todayKey]?.quantitative?.unitText || '' }
    });
    setIsEditing(false);
  }, [flow.id, todayKey, tempEmotion, tempNote, count, status, updateFlowStatus]);

  const handleCardPress = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleViewDetails = () => {
    navigation.navigate('FlowDetails', { flowId: flow.id, initialTab: 'calendar' });
  };

  const handleReset = useCallback(async () => {
    triggerHaptic();
    try {
      await updateFlowStatus(flow.id, todayKey, {
        symbol: '-',
        emotion: '',
        note: '',
        quantitative: { count: 0, unitText: flow.status?.[todayKey]?.quantitative?.unitText || '' },
        timestamp: null
      });
      setCount(0);
      setTempEmotion('');
      setTempNote('');
    } catch (error) {
      console.error('Error resetting flow:', error);
    }
  }, [updateFlowStatus, flow.id, todayKey, triggerHaptic]);

  const handleDone = useCallback(async () => {
    console.log('Done button pressed for flow:', flow.title, 'with count:', count);
    triggerHaptic();
    try {
      // If count is 0, mark as done with count 0, otherwise use current count
      const finalCount = count > 0 ? count : 0;
      await updateFlowStatus(flow.id, todayKey, {
        symbol: '+',
        emotion: tempEmotion,
        note: tempNote,
        quantitative: { count: finalCount, unitText: flow.status?.[todayKey]?.quantitative?.unitText || '' }
      });
      console.log('Flow marked as done successfully');
    } catch (error) {
      console.error('Error marking flow as done:', error);
    }
  }, [updateFlowStatus, flow.id, todayKey, count, tempEmotion, tempNote, triggerHaptic]);

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
      <View style={styles.cardContainer}>
        {/* Card Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.flowTitle}>{flow.title}</Text>
            {(flow.reminderTime && count <= 1) && (
              <View style={styles.timestampContainer}>
                <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                <Text style={styles.timestampText}>{flowTime}</Text>
              </View>
            )}
            {count > 1 && flow.goalCount && (
              <Text style={styles.goalText}>Goal: {flow.goalCount}</Text>
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
            <TouchableOpacity
              style={[styles.doneButtonTest]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonTestText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={14} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{flowTime}</Text>
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
                  placeholder={count > 0 ? 'How was working on this flow?' : 'Why did you miss this flow?'}
                  multiline
                />
              ) : (
                <Text style={styles.detailText}>
                  {note || (count > 0 ? 'How was working on this flow?' : 'Why did you miss this flow?')}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.detailActionContainer}>
              <TouchableOpacity onPress={handleViewDetails}>
                <Text style={styles.actionText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReset}>
                <Text style={styles.resetActionText}>Reset</Text>
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
            <Text style={styles.streakLabel}>⚡ Flow Streak - {currentStreak}</Text>
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
  flowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  goalText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  countButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  resetActionText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doneButton: {
    // No extra margin needed
  },
  doneButtonCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  gradientButtonCompact: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doneButtonTest: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: '#000000',
  },
  doneButtonTestText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default Quantitative;
