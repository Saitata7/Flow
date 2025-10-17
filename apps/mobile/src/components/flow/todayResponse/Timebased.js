import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
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
    
    if (status === '+') {
      streakDays.unshift(date.date());
      streak++;
    } else if (status === '-' || status === '/' || (i === 0 && !status)) {
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

const Timebased = ({ flow }) => {
  const navigation = useNavigation();
  const { updateTimeBased, updateFlowStatus } = useContext(FlowsContext);
  const todayKey = moment().format('YYYY-MM-DD');
  const status = flow.status?.[todayKey]?.symbol || null; // Don't default to missed
  const emotion = flow.status?.[todayKey]?.emotion || '';
  const note = flow.status?.[todayKey]?.note || '';
  const flowTime = flow.reminderTime ? moment(flow.reminderTime).format('h:mm A') : 'No time set';
  const timeVariation = getTimeVariation(flow);
  const { days: streakDays, currentStreak } = calculateStreak(flow);
  const timebased = flow.status?.[todayKey]?.timebased || {
    startTime: null,
    pauses: [],
    endTime: null,
    totalDuration: 0,
    pausesCount: 0
  };
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmotion, setTempEmotion] = useState(emotion);
  const [tempNote, setTempNote] = useState(note);
  const [currentTime, setCurrentTime] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const intervalRef = useRef(null);

  // Timer states - simplified logic
  const isStopped = timebased.endTime !== null;
  const isPaused = timebased.startTime && !timebased.endTime && timebased.pauses.length > 0 && !timebased.pauses[timebased.pauses.length - 1].end;
  const isRunning = timebased.startTime && !timebased.endTime && !isPaused;
  const isNotStarted = !timebased.startTime;
  const isCompleted = status === '+';
  
  // Calculate current duration - simplified
  const getCurrentDuration = () => {
    if (!timebased.startTime) return 0;
    return timebased.totalDuration || 0;
  };
  
  const currentDuration = getCurrentDuration();
  const pausesCount = timebased.pausesCount || 0;
  const maxBreaks = 5;


  // Real-time timer effect
  useEffect(() => {
    if (isRunning && timebased.startTime) {
      // Start the timer interval
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    } else {
      // Clear the timer interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timebased.startTime]);

  // Update current time when timer state changes
  useEffect(() => {
    if (timebased.startTime) {
      const now = new Date();
      const startTime = new Date(timebased.startTime);
      let totalSeconds = Math.floor((now - startTime) / 1000);
      
      // Subtract paused time
      if (timebased.pauses && timebased.pauses.length > 0) {
        timebased.pauses.forEach(pause => {
          if (pause.start && pause.end) {
            const pauseStart = new Date(pause.start);
            const pauseEnd = new Date(pause.end);
            totalSeconds -= Math.floor((pauseEnd - pauseStart) / 1000);
          }
        });
      }
      
      setCurrentTime(Math.max(0, totalSeconds));
    } else {
      setCurrentTime(0);
    }
  }, [timebased.startTime, timebased.pauses]);

  // Force update when timebased data changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [timebased.startTime, timebased.endTime, timebased.pauses]);


  const emotions = [
    { label: 'Sad', emoji: '😞' },
    { label: 'Slightly worried', emoji: '😟' },
    { label: 'Neutral', emoji: '😐' },
    { label: 'Slightly smiling', emoji: '🙂' },
    { label: 'Big smile', emoji: '😃' },
  ];

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleStart = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    
    updateTimeBased(flow.id, todayKey, {
      startTime: now,
      pauses: [],
      endTime: null,
      totalDuration: 0,
      pausesCount: 0
    });
    
    // Reset current time and force update
    setCurrentTime(0);
    setForceUpdate(prev => prev + 1);
  }, [flow.id, todayKey, updateTimeBased, triggerHaptic]);

  const handleBreak = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    
    // Add current pause
    const newPauses = [...timebased.pauses, { 
      start: now, 
      end: null 
    }];
    
    updateTimeBased(flow.id, todayKey, {
      ...timebased,
      pauses: newPauses,
      pausesCount: pausesCount + 1
    });
  }, [flow.id, todayKey, timebased, pausesCount, updateTimeBased, triggerHaptic]);

  const handleResume = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    
    // End the current pause
    const newPauses = [...timebased.pauses];
    newPauses[newPauses.length - 1] = {
      ...newPauses[newPauses.length - 1],
      end: now
    };
    
    updateTimeBased(flow.id, todayKey, {
      ...timebased,
      pauses: newPauses
    });
  }, [flow.id, todayKey, timebased, updateTimeBased, triggerHaptic]);

  const handleStop = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    
    // End current pause if paused
    let finalPauses = [...timebased.pauses];
    if (isPaused) {
      finalPauses[finalPauses.length - 1] = {
        ...finalPauses[finalPauses.length - 1],
        end: now
      };
    }
    
    const finalDuration = currentTime;
    const newSymbol = finalDuration > 1 ? '+' : '-';

    updateTimeBased(flow.id, todayKey, {
      ...timebased,
      pauses: finalPauses,
      endTime: now,
      totalDuration: finalDuration
    });

    updateFlowStatus(flow.id, todayKey, { 
      symbol: newSymbol, 
      timebased: { 
        ...timebased, 
        pauses: finalPauses, 
        endTime: now, 
        totalDuration: finalDuration 
      } 
    });
  }, [flow.id, todayKey, timebased, isPaused, currentTime, updateTimeBased, updateFlowStatus, triggerHaptic]);

  const handleSkip = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    const resetTimebased = {
      startTime: null,
      pauses: [],
      endTime: now,
      totalDuration: 0,
      pausesCount: 0
    };
    updateFlowStatus(flow.id, todayKey, { symbol: '-', timebased: resetTimebased });
  }, [flow.id, todayKey, updateFlowStatus, triggerHaptic]);

  const handleResetTime = useCallback(() => {
    triggerHaptic();
    const resetTimebased = {
      startTime: null,
      pauses: [],
      endTime: null,
      totalDuration: 0,
      pausesCount: 0
    };
    updateTimeBased(flow.id, todayKey, resetTimebased);
    updateFlowStatus(flow.id, todayKey, {
      symbol: '-',
      emotion: null,
      note: timebased.note,
      timebased: resetTimebased
    });
    setCurrentTime(0);
    setIsEditing(false);
  }, [flow.id, todayKey, timebased.note, updateTimeBased, updateFlowStatus, triggerHaptic]);

  const handleSaveEdits = useCallback(() => {
    updateFlowStatus(flow.id, todayKey, {
      symbol: status,
      emotion: tempEmotion,
      note: tempNote,
      timebased: { ...timebased, pausesCount }
    });
    setIsEditing(false);
  }, [flow.id, todayKey, tempEmotion, tempNote, status, timebased, pausesCount, updateFlowStatus]);

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
        timebased: {
          startTime: null,
          pauses: [],
          endTime: null,
          totalDuration: 0,
          pausesCount: 0
        },
        timestamp: null
      });
      setTempEmotion('');
      setTempNote('');
    } catch (error) {
      console.error('Error resetting flow:', error);
    }
  }, [updateFlowStatus, flow.id, todayKey, triggerHaptic]);

  return (
    <TouchableOpacity key={`${flow.id}-${forceUpdate}`} onPress={handleCardPress} activeOpacity={0.8}>
      <View style={styles.cardContainer}>
        {/* Card Header */}
        <View style={[styles.headerContainer, isStopped && { backgroundColor: 'transparent' }]}>
          {isStopped ? (
            <LinearGradient
              colors={['#FFFFFF', '#FEE2E2']} // Left white to right red gradient for Missed card
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              <View style={styles.headerLeft}>
                <Text style={styles.flowTitle}>{flow.title}</Text>
                {flow.reminderTime && (
                  <View style={styles.timestampContainer}>
                    <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                    <Text style={styles.timestampText}>{flowTime}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtonsContainer}>
                <Text style={styles.missedText}>Time Spent: {formatTimeBasedDuration({ totalDuration: timebased.totalDuration || currentTime })}</Text>
              </View>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.headerLeft}>
                <Text style={styles.flowTitle}>{flow.title}</Text>
                {flow.reminderTime && (
                  <View style={styles.timestampContainer}>
                    <MaterialIcons name="access-time" size={14} color="#F4B400" style={styles.clockIcon} />
                    <Text style={styles.timestampText}>{flowTime}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtonsContainer}>
                {isStopped ? (
                  <View style={[styles.actionButton, styles.timeSpentButton]}>
                    <LinearGradient
                      colors={['#FFEDD5', '#F97316']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.actionButtonText}>Time Spent: {formatTimeBasedDuration({ totalDuration: timebased.totalDuration || currentTime })}</Text>
                    </LinearGradient>
                  </View>
                ) : isNotStarted ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={handleStart}
                    >
                      <LinearGradient
                        colors={['#D1FAE5', '#10B981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>🟢 Start</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.stopButton]}
                      onPress={handleSkip}
                    >
                      <LinearGradient
                        colors={['#FEE2E2', '#FECACA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>✗ Skip</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : isRunning ? (
                  <>
                    <View style={[styles.actionButton, styles.timeSpentButton]}>
                      <LinearGradient
                        colors={['#D1FAE5', '#10B981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>⏱️ {formatTimeBasedDuration({ totalDuration: currentTime })}</Text>
                      </LinearGradient>
                    </View>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={handleBreak}
                      disabled={pausesCount >= maxBreaks}
                    >
                      <LinearGradient
                        colors={pausesCount >= maxBreaks ? ['#F3F4F6', '#9CA3AF'] : ['#FEF3C7', '#F59E0B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>
                          ⏸ Break {pausesCount >= maxBreaks ? '(Max)' : `(${pausesCount}/${maxBreaks})`}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.stopButton]}
                      onPress={handleStop}
                    >
                      <LinearGradient
                        colors={['#FEE2E2', '#FECACA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>🔴 Stop</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : isPaused ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      onPress={handleResume}
                    >
                      <LinearGradient
                        colors={['#D1FAE5', '#10B981']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>🟢 Resume</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.stopButton]}
                      onPress={handleStop}
                    >
                      <LinearGradient
                        colors={['#FEE2E2', '#FECACA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.actionButtonText}>🔴 Stop</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </>
          )}
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
              <Text style={styles.detailText}>Breaks: {pausesCount}/{maxBreaks}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="timer" size={14} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                Time Spent: {formatTimeBasedDuration({ totalDuration: isStopped ? timebased.totalDuration : currentTime })}
                {isRunning && ' (running...)'}
                {isPaused && ' (paused)'}
              </Text>
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
                  placeholder={isStopped ? 'How was working on this flow?' : 'Why did you miss this flow?'}
                  multiline
                />
              ) : (
                <Text style={styles.detailText}>
                  {note || (isStopped ? 'How was working on this flow?' : 'Why did you miss this flow?')}
                </Text>
              )}
            </View>
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
        {currentStreak >= 5 && isStopped && !isExpanded && (
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
    borderWidth: 0, // Ensure no borders
  },
  clockIcon: {
    marginRight: 4,
  },
  timestampText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginHorizontal: 8,
  },
  startButton: {},
  stopButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    borderWidth: 0, // Ensure no borders
  },
  streakDayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default Timebased;
