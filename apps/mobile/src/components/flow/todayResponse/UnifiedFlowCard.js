import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { FlowsContext } from '../../../context/FlowContext';
import { useNavigation } from '@react-navigation/native';

// Define emotions array
const emotions = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Sad', emoji: '😞' },
  { label: 'Excited', emoji: '🎉' },
  { label: 'Stressed', emoji: '😓' },
];

const getTimeVariation = (flow) => {
  if (!flow) return 'No frequency set';

  const { frequency, everyDay, daysOfWeek } = flow;

  if (frequency === 'Daily') {
    if (everyDay) {
      return 'Everyday';
    } else if (daysOfWeek && daysOfWeek.length > 0) {
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
    }
  }
  return frequency || 'No frequency set';
};

const calculateStreak = (flow) => {
  if (!flow?.status) return { days: [], currentStreak: 0 };
  
  let streak = 0;
  const today = moment().startOf('day');
  const streakDays = [];
  
  for (let i = 0; i < 365; i++) {
    const date = moment(today).subtract(i, 'days');
    const dateKey = date.format('YYYY-MM-DD');
    const status = flow.status[dateKey]?.symbol;
    
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

// Format time display based on flow state and tracking type
const formatTimeDisplay = (flow, currentTime, timebased) => {
  if (flow.trackingType === 'Time-based') {
    // Add null checks for timebased
    if (timebased && timebased.startTime && !timebased.endTime) {
      // Active timer - show current time
      const totalSeconds = Math.floor(currentTime);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (timebased && timebased.endTime) {
      // Completed timer - show total duration
      return formatTimeBasedDuration({ totalDuration: timebased.totalDuration || 0 });
    }
  }
  
  // For Binary and Quantitative flows, or Time-based flows that haven't started:
  // Only show reminder time if user has actually set one
  if (flow.reminderTime) {
    const reminderMoment = moment(flow.reminderTime);
    const now = moment();
    const isTimePassed = reminderMoment.isBefore(now);
    
    console.log('UnifiedFlowCard: Found reminder time:', flow.reminderTime, 'Formatted:', reminderMoment.format('h:mm A'), 'Time passed:', isTimePassed);
    return {
      time: reminderMoment.format('h:mm A'),
      isTimePassed: isTimePassed
    };
  }
  
  // If no reminder time is set, don't show any time
  console.log('UnifiedFlowCard: No reminder time found for flow:', flow.title);
  return null;
};

const UnifiedFlowCard = ({ flow }) => {
  if (!flow) return null;

  const navigation = useNavigation();
  const { updateFlowStatus, updateCount, updateTimeBased } = useContext(FlowsContext);
  const todayKey = moment().format('YYYY-MM-DD');
  const status = flow.status?.[todayKey]?.symbol || '-';
  const emotion = flow.status?.[todayKey]?.emotion || '';
  const note = flow.status?.[todayKey]?.note || '';
  
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempEmotion, setTempEmotion] = useState(emotion);
  const [tempNote, setTempNote] = useState(note);
  const [tempStatus, setTempStatus] = useState(status);
  
  // Tracking type specific state
  const [count, setCount] = useState(flow.status?.[todayKey]?.quantitative?.count || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const intervalRef = useRef(null);

  // Time-based specific data with proper initialization
  const timebased = flow.status?.[todayKey]?.timebased || {};
  const safeTimebased = {
    startTime: timebased.startTime || null,
    pauses: timebased.pauses || [],
    endTime: timebased.endTime || null,
    totalDuration: timebased.totalDuration || 0,
    pausesCount: timebased.pausesCount || 0
  };

  // Now calculate flowTime after safeTimebased is defined
  const flowTimeData = formatTimeDisplay(flow, currentTime, safeTimebased);
  const flowTime = typeof flowTimeData === 'string' ? flowTimeData : flowTimeData?.time;
  const isTimePassed = flowTimeData?.isTimePassed || false;
  
  // Debug reminder time
  console.log('UnifiedFlowCard: Flow reminder time:', {
    flowId: flow.id,
    flowTitle: flow.title,
    reminderTime: flow.reminderTime,
    flowTime: flowTime,
    isTimePassed: isTimePassed
  });
  const timeVariation = getTimeVariation(flow);
  const { days: streakDays, currentStreak } = calculateStreak(flow);

  // Timer states for time-based flows
  const isStopped = safeTimebased.endTime !== null;
  const isPaused = safeTimebased.startTime && !safeTimebased.endTime && safeTimebased.pauses.length > 0 && !safeTimebased.pauses[safeTimebased.pauses.length - 1].end;
  const isRunning = safeTimebased.startTime && !safeTimebased.endTime && !isPaused;
  const isNotStarted = !safeTimebased.startTime;
  const pausesCount = safeTimebased.pausesCount || 0;
  const maxBreaks = 5;

  // Status determination
  const isPending = status === '-';
  const isCompleted = status === '✅' || status === '✓' || status === '+';
  const isMissed = status === '❌';

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  // Binary flow handlers
  const handleBinaryStatusPress = useCallback(async (symbol) => {
    triggerHaptic();
    setTempStatus(symbol);
    try {
      await updateFlowStatus(flow.id, todayKey, {
        symbol,
        note: note || null,
        emotion: tempEmotion || null,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to update flow status:', e);
    }
  }, [updateFlowStatus, flow.id, todayKey, note, tempEmotion, triggerHaptic]);

  // Quantitative flow handlers
  const handleQuantitativeAction = useCallback((action) => {
    triggerHaptic();
    const maxCount = (flow.goalCount || 0) + 30;
    let newCount = action === '+' ? count + 1 : Math.max(0, count - 1);
    if (newCount > maxCount) newCount = maxCount;
    
    setCount(newCount);
    updateCount(flow.id, todayKey, action);
  }, [flow.id, todayKey, count, flow.goalCount, updateCount, triggerHaptic]);

  const handleDone = useCallback(async () => {
    console.log('Done button pressed for flow:', flow.title, 'with count:', count);
    triggerHaptic();
    try {
      const finalCount = count > 0 ? count : 0;
      const goal = flow.goalCount || 0;
      const unitText = flow.status?.[todayKey]?.quantitative?.unitText || flow.unitText || '';
      
      // Determine completion status based on goal
      let symbol, statusText;
      if (goal > 0) {
        // Has goal - compare with goal
        if (finalCount >= goal) {
          symbol = '✅'; // Completed
          statusText = unitText ? `${unitText}: ${finalCount}` : `Count: ${finalCount}`;
        } else {
          symbol = '❌'; // Missed
          statusText = unitText ? `${unitText}: ${finalCount}` : `Count: ${finalCount}`;
        }
      } else {
        // No goal - single count is completed
        symbol = '✅'; // Completed
        statusText = unitText ? `${unitText}: ${finalCount}` : `Count: ${finalCount}`;
      }
      
      await updateFlowStatus(flow.id, todayKey, {
        symbol: symbol,
        emotion: tempEmotion,
        note: tempNote,
        quantitative: { count: finalCount, unitText: unitText },
        statusText: statusText // Store the display text
      });
      
      console.log(`Flow marked as ${symbol === '✅' ? 'completed' : 'missed'} successfully`);
    } catch (error) {
      console.error('Error marking flow as done:', error);
    }
  }, [updateFlowStatus, flow.id, todayKey, count, tempEmotion, tempNote, flow.goalCount, flow.unitText, triggerHaptic]);

  // Time-based flow handlers
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
    
    setCurrentTime(0);
    setForceUpdate(prev => prev + 1);
  }, [flow.id, todayKey, updateTimeBased, triggerHaptic]);

  const handleBreak = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    
    const newPauses = [...safeTimebased.pauses, { 
      start: now, 
      end: null 
    }];
    
    updateTimeBased(flow.id, todayKey, {
      ...safeTimebased,
      pauses: newPauses,
      pausesCount: pausesCount + 1
    });
  }, [flow.id, todayKey, safeTimebased, pausesCount, updateTimeBased, triggerHaptic]);

  const handleResume = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    
    const newPauses = [...safeTimebased.pauses];
    newPauses[newPauses.length - 1] = {
      ...newPauses[newPauses.length - 1],
      end: now
    };
    
    updateTimeBased(flow.id, todayKey, {
      ...safeTimebased,
      pauses: newPauses
    });
  }, [flow.id, todayKey, safeTimebased, updateTimeBased, triggerHaptic]);

  const handleStop = useCallback(() => {
    triggerHaptic();
    const now = new Date().toISOString();
    
    let finalPauses = [...safeTimebased.pauses];
    if (isPaused) {
      finalPauses[finalPauses.length - 1] = {
        ...finalPauses[finalPauses.length - 1],
        end: now
      };
    }
    
    const finalDuration = currentTime;
    const newSymbol = finalDuration > 1 ? '✅' : '❌';

    updateTimeBased(flow.id, todayKey, {
      ...safeTimebased,
      pauses: finalPauses,
      endTime: now,
      totalDuration: finalDuration
    });

    updateFlowStatus(flow.id, todayKey, { 
      symbol: newSymbol, 
      timebased: { 
        ...safeTimebased, 
        pauses: finalPauses, 
        endTime: now, 
        totalDuration: finalDuration 
      } 
    });
  }, [flow.id, todayKey, safeTimebased, isPaused, currentTime, updateTimeBased, updateFlowStatus, triggerHaptic]);

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
    updateFlowStatus(flow.id, todayKey, { symbol: '❌', timebased: resetTimebased });
  }, [flow.id, todayKey, updateFlowStatus, triggerHaptic]);

  // Common handlers
  const handleSaveEdits = useCallback(async () => {
    try {
      const updateData = {
        symbol: tempStatus,
        emotion: tempEmotion,
        note: tempNote.trim() || null,
        timestamp: new Date().toISOString(),
      };

      // Add tracking type specific data
      if (flow.trackingType === 'Quantitative') {
        updateData.quantitative = { count: count, unitText: flow.status?.[todayKey]?.quantitative?.unitText || '' };
      } else if (flow.trackingType === 'Time-based') {
        updateData.timebased = { ...safeTimebased, pausesCount };
      }

      await updateFlowStatus(flow.id, todayKey, updateData);
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save edits:', e);
    }
  }, [updateFlowStatus, flow.id, todayKey, tempStatus, tempEmotion, tempNote, flow.trackingType, count, safeTimebased, pausesCount]);

  const handleCardPress = () => {
    if (!isEditing) {
      setIsExpanded(!isExpanded);
      triggerHaptic();
    }
  };

  const handleViewDetails = () => {
    triggerHaptic();
    navigation.navigate('FlowDetails', { flowId: flow.id, initialTab: 'calendar' });
  };

  const handleReset = useCallback(async () => {
    triggerHaptic();
    try {
      // Reset based on tracking type
      if (flow.trackingType === 'Binary') {
        await updateFlowStatus(flow.id, todayKey, {
          symbol: '-',
          emotion: '',
          note: '',
          timestamp: null
        });
      } else if (flow.trackingType === 'Quantitative') {
        await updateFlowStatus(flow.id, todayKey, {
          symbol: '-',
          emotion: '',
          note: '',
          quantitative: { count: 0, unitText: flow.status?.[todayKey]?.quantitative?.unitText || '' },
          timestamp: null
        });
        setCount(0);
      } else if (flow.trackingType === 'Time-based') {
        const resetTimebased = {
          startTime: null,
          pauses: [],
          endTime: null,
          totalDuration: 0,
          pausesCount: 0
        };
        await updateFlowStatus(flow.id, todayKey, {
          symbol: '-',
          emotion: '',
          note: '',
          timebased: resetTimebased,
          timestamp: null
        });
      }
      
      setTempEmotion('');
      setTempNote('');
      console.log('Flow reset successfully');
    } catch (error) {
      console.error('Error resetting flow:', error);
    }
  }, [updateFlowStatus, flow.id, todayKey, flow.trackingType, triggerHaptic]);

  // Real-time timer effect for time-based flows
  useEffect(() => {
    if (isRunning && safeTimebased.startTime) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, safeTimebased.startTime]);

  // Auto-complete at 11:50 PM for quantitative flows
  useEffect(() => {
    if (flow.trackingType === 'Quantitative' && !isCompleted && !isMissed && count > 0) {
      const checkAutoComplete = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Check if it's 11:50 PM (23:50)
        if (currentHour === 23 && currentMinute >= 50) {
          console.log('Auto-completing flow at 11:50 PM:', flow.title);
          handleDone();
        }
      };
      
      // Check immediately
      checkAutoComplete();
      
      // Set up interval to check every minute
      const interval = setInterval(checkAutoComplete, 60000);
      
      return () => clearInterval(interval);
    }
  }, [flow.trackingType, isCompleted, isMissed, count, handleDone]);

  // Update current time when timer state changes
  useEffect(() => {
    if (safeTimebased.startTime) {
      const now = new Date();
      const startTime = new Date(safeTimebased.startTime);
      let totalSeconds = Math.floor((now - startTime) / 1000);
      
      if (safeTimebased.pauses && safeTimebased.pauses.length > 0) {
        safeTimebased.pauses.forEach(pause => {
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
  }, [safeTimebased.startTime, safeTimebased.pauses]);

  // Render action buttons based on tracking type - matching Figma designs
  const renderActionButtons = () => {
    if (flow.trackingType === 'Binary') {
      if (isCompleted || isMissed) {
        return (
          <View style={styles.actionButtonsContainer}>
            <Text style={[styles.statusText, { color: isCompleted ? '#34A853' : '#EA4335' }]}>
              {isCompleted ? 'Completed' : 'Missed'}
            </Text>
          </View>
        );
      } else {
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.completeButton]}
              onPress={() => handleBinaryStatusPress('✅')}
            >
              <Text style={styles.rectangularButtonText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.missButton]}
              onPress={() => handleBinaryStatusPress('❌')}
            >
              <Text style={styles.rectangularButtonText}>✗</Text>
            </TouchableOpacity>
          </View>
        );
      }
    } else if (flow.trackingType === 'Quantitative') {
      // Show status text when completed or missed
      if (isCompleted || isMissed) {
        const statusText = flow.status?.[todayKey]?.statusText || 
          (flow.status?.[todayKey]?.quantitative?.unitText ? 
            `${flow.status[todayKey].quantitative.unitText}: ${count}` : 
            `Count: ${count}`);
        return (
          <View style={styles.actionButtonsContainer}>
            <Text style={[styles.statusText, { color: isCompleted ? '#34A853' : '#EA4335' }]}>
              {statusText}
            </Text>
          </View>
        );
      }
      // Special case: Show time input field for quantitative flows
      else if (count === 0) {
        return (
          <View style={styles.actionButtonsContainer}>
            {flowTime && (
              <View style={styles.timeInputField}>
                <Text style={styles.timeInputText}>{flowTime}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.rectangularButton, styles.startButton]}
              onPress={() => handleQuantitativeAction('+')}
            >
              <Text style={styles.rectangularButtonText}>Add Start</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.doneButton]}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circularButton, styles.missButton]}
              onPress={() => handleQuantitativeAction('-')}
            >
              <Text style={styles.circularButtonText}>✗</Text>
            </TouchableOpacity>
            <View style={styles.countInputField}>
              <Text style={styles.countText}>{count}</Text>
            </View>
            <TouchableOpacity
              style={[styles.circularButton, styles.completeButton]}
              onPress={() => handleQuantitativeAction('+')}
            >
              <Text style={styles.circularButtonText}>✓</Text>
            </TouchableOpacity>
          </View>
        );
      }
    } else if (flow.trackingType === 'Time-based') {
      if (isStopped) {
        return (
          <Text style={styles.missedText}>
            Time Spent: {formatTimeBasedDuration({ totalDuration: safeTimebased.totalDuration || currentTime })}
          </Text>
        );
      } else if (isNotStarted) {
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.startButton]}
              onPress={handleStart}
            >
              <Text style={styles.rectangularButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={styles.rectangularButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        );
      } else if (isRunning) {
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.breakButton]}
              onPress={handleBreak}
              disabled={pausesCount >= maxBreaks}
            >
              <Text style={styles.rectangularButtonText}>Break</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.stopButton]}
              onPress={handleStop}
            >
              <Text style={styles.rectangularButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        );
      } else if (isPaused) {
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.startButton]}
              onPress={handleResume}
            >
              <Text style={styles.rectangularButtonText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rectangularButton, styles.stopButton]}
              onPress={handleStop}
            >
              <Text style={styles.rectangularButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
    return null;
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
      <View style={styles.cardContainer}>
        {/* Card Header - matching Figma designs */}
        {(isCompleted || isMissed) ? (
          <LinearGradient
            colors={isCompleted ? ['#FFFFFF', '#D1FAE5'] : ['#FFFFFF', '#FEE2E2']}
            style={styles.headerContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerLeft}>
              <Text style={styles.flowTitle}>
                {flow.title}
                {isCompleted && currentStreak > 3 && (
                  <Text style={styles.streakText}> {currentStreak}</Text>
                )}
              </Text>
              {flow.trackingType === 'Quantitative' && count > 1 && flow.goalCount && (
                <Text style={styles.goalText}>Goal: {flow.goalCount}</Text>
              )}
            </View>
            <View style={styles.timeSection}>
              {flowTime && (
                <View style={styles.timestampContainer}>
                  <MaterialIcons 
                    name="access-time" 
                    size={14} 
                    color={isTimePassed ? "#FF4444" : "#F4B400"} 
                    style={styles.clockIcon} 
                  />
                  <Text style={[
                    styles.timestampText,
                    { color: isTimePassed ? "#FF4444" : "#F4B400" }
                  ]}>
                    {flowTime}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.buttonsSection}>
              {renderActionButtons()}
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
              <Text style={styles.flowTitle}>
                {flow.title}
                {isCompleted && currentStreak > 3 && (
                  <Text style={styles.streakText}> {currentStreak}</Text>
                )}
              </Text>
              {flow.trackingType === 'Quantitative' && count > 1 && flow.goalCount && (
                <Text style={styles.goalText}>Goal: {flow.goalCount}</Text>
              )}
            </View>
            <View style={styles.timeSection}>
              {flowTime && (
                <View style={styles.timestampContainer}>
                  <MaterialIcons 
                    name="access-time" 
                    size={14} 
                    color={isTimePassed ? "#FF4444" : "#F4B400"} 
                    style={styles.clockIcon} 
                  />
                  <Text style={[
                    styles.timestampText,
                    { color: isTimePassed ? "#FF4444" : "#F4B400" }
                  ]}>
                    {flowTime}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.buttonsSection}>
              {renderActionButtons()}
            </View>
          </View>
        )}


        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.detailsContainer}>
            {flowTime && (
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>{flowTime}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <MaterialIcons name="calendar-today" size={14} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{timeVariation}</Text>
            </View>
            
            {/* Quantitative specific details */}
            {flow.trackingType === 'Quantitative' && (
              <>
                {flow.unitText && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="straighten" size={14} color="#6B7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>Unit: {flow.unitText}</Text>
                  </View>
                )}
                {flow.goalCount && flow.goalCount > 0 && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="flag" size={14} color="#6B7280" style={styles.detailIcon} />
                    <Text style={styles.detailText}>Goal: {flow.goalCount} {flow.unitText || ''}</Text>
                  </View>
                )}
              </>
            )}
            
            {/* Time-based specific details */}
            {flow.trackingType === 'Time-based' && safeTimebased.startTime && (
              <View style={styles.detailRow}>
                <MaterialIcons name="play-arrow" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>Start Time: {moment(safeTimebased.startTime).format('h:mm A')}</Text>
              </View>
            )}
            {flow.trackingType === 'Time-based' && safeTimebased.endTime && (
              <View style={styles.detailRow}>
                <MaterialIcons name="stop" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>End Time: {moment(safeTimebased.endTime).format('h:mm A')}</Text>
              </View>
            )}
            {flow.trackingType === 'Time-based' && (
              <View style={styles.detailRow}>
                <MaterialIcons name="pause" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>Breaks: {pausesCount}/{maxBreaks}</Text>
              </View>
            )}
            {flow.trackingType === 'Time-based' && (
              <View style={styles.detailRow}>
                <MaterialIcons name="timer" size={14} color="#6B7280" style={styles.detailIcon} />
                <Text style={styles.detailText}>
                  Time Spent: {formatTimeBasedDuration({ totalDuration: isStopped ? safeTimebased.totalDuration : currentTime })}
                  {isRunning && ' (running...)'}
                  {isPaused && ' (paused)'}
                </Text>
              </View>
            )}
            
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
                  placeholder={isCompleted ? 'How was working on this flow?' : 'Why did you miss this flow?'}
                  multiline
                />
              ) : (
                <Text style={styles.detailText}>
                  {note || (isCompleted ? 'How was working on this flow?' : 'Why did you miss this flow?')}
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
        {currentStreak > 3 && (isCompleted || isMissed) && !isExpanded && (
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
    borderRadius: 22, // Squircle formula
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
    flex: 3, // Flow name section (3/10)
    flexWrap: 'wrap',
  },
  timeSection: {
    flex: 2, // Time section (2/10)
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonsSection: {
    flex: 5, // Buttons section (5/10)
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
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
    gap: 8,
  },
  // Circular buttons for Binary and Quantitative (matching Figma with squircle)
  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 18, // Squircle formula for buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickButton: {
    backgroundColor: '#D1FAE5', // Corrected light green from design
  },
  crossButton: {
    backgroundColor: '#FEE2E2', // Corrected light red from design
  },
  missButton: {
    backgroundColor: '#FEE2E2', // Corrected light red from design
  },
  completeButton: {
    backgroundColor: '#D1FAE5', // Corrected light green from design
  },
  circularButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Rectangular buttons for Time-based (matching Figma with squircle)
  rectangularButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18, // Squircle formula for buttons
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  startButton: {
    backgroundColor: '#D1FAE5', // Light green for start/positive actions
  },
  skipButton: {
    backgroundColor: '#FEE2E2', // Light red for skip/negative actions
  },
  breakButton: {
    backgroundColor: '#FEF3C7', // Light yellow/beige for neutral actions
  },
  stopButton: {
    backgroundColor: '#FEE2E2', // Light red for stop/negative actions
  },
  completeButton: {
    backgroundColor: '#D1FAE5', // Light green for complete/positive actions
  },
  missButton: {
    backgroundColor: '#FEE2E2', // Light red for miss/negative actions
  },
  timeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeDetailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  resetTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetTimeText: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  notesSection: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    minHeight: 60,
  },
  rectangularButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Count input field for Quantitative (matching Figma with squircle)
  countInputField: {
    width: 40,
    height: 40,
    borderRadius: 18, // Squircle formula for input field
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Time input field for quantitative flows (matching Figma)
  timeInputField: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18, // Squircle formula
    backgroundColor: '#FEF3C7', // Light yellow/beige
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  timeInputText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4B400', // Orange/brown color
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  missedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginHorizontal: 8,
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
  // Done button for quantitative flows
  doneButton: {
    width: 50,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default UnifiedFlowCard;
