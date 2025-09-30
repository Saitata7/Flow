import React, { useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ThemeContext } from '../../context/ThemeContext';
import ResponseModal from './todayResponse/Response';
import moment from 'moment';
import { colors, layout, typography } from '../../../styles';
import CheatModePopup from '../common/CheatModePopup';

const emotions = [
  { label: 'Sad', emoji: '😞' },
  { label: 'Slightly worried', emoji: '😟' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Slightly smiling', emoji: '🙂' },
  { label: 'Big smile', emoji: '😃' },
];

console.log('Available emotions for mapping:', emotions);

const FlowCalendar = ({ flow, onUpdateStatus, onMonthChange, currentMonth }) => {
  const { theme = 'light', textSize = 'medium', highContrast = false, accentColor = '#007AFF', cheatMode = false } = useContext(ThemeContext) || {};
  const themeColors = theme === 'light' ? colors.light : colors.dark;
  const isUpdating = useRef(false);
  const [modalState, setModalState] = useState({
    selectedDate: null,
    pendingStatus: null,
    showResponseModal: false,
    modalStage: 'input',
    note: '',
    selectedEmotion: null,
    quantitativeCount: '',
    timeDuration: { hours: '', minutes: '', seconds: '' },
  });
  const [showCheatModePopup, setShowCheatModePopup] = useState(false);
  

  useEffect(() => {
    console.log('Flow status updated:', flow.status);
    // Debug: Log all status entries with emotions
    if (flow.status) {
      Object.entries(flow.status).forEach(([date, status]) => {
        if (status.emotion) {
          console.log(`Date ${date}: emotion=${status.emotion}, symbol=${status.symbol}`);
        }
      });
      
      // Specific debug for September 23rd
      const sept23 = flow.status['2024-09-23'] || flow.status['2023-09-23'];
      if (sept23) {
        console.log('September 23rd status:', sept23);
        console.log('September 23rd emotion:', sept23.emotion);
        console.log('September 23rd symbol:', sept23.symbol);
      } else {
        console.log('No status found for September 23rd');
        console.log('Available dates:', Object.keys(flow.status));
      }
    }
  }, [flow.status]);

  console.log('Flow status received:', flow.status, 'trackingType:', flow.trackingType);

  const handleDayPress = useCallback((day) => {
    if (isUpdating.current) {
      console.log('Day press blocked: isUpdating true');
      return;
    }
    isUpdating.current = true;

    const dateKey = day.dateString;
    const isToday = moment(dateKey).isSame(moment(), 'day');
    const isPastDay = moment(dateKey).isBefore(moment(), 'day');
    
    // Check cheat mode restrictions
    if (!flow.cheatMode && (isPastDay || !isToday)) {
      setShowCheatModePopup(true);
      isUpdating.current = false;
      return;
    }

    const alertOptions = [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          setModalState({ selectedDate: null, pendingStatus: null, showResponseModal: false, modalStage: 'input', note: '', selectedEmotion: null, quantitativeCount: '', timeDuration: { hours: '', minutes: '', seconds: '' } });
          setTimeout(() => { isUpdating.current = false; }, 100);
        },
      },
    ];

    if (flow.trackingType === 'Quantitative') {
      alertOptions.unshift(
        {
          text: 'Set Count',
          onPress: () => {
            setModalState({
              selectedDate: dateKey,
              pendingStatus: 'set_count',
              showResponseModal: true,
              modalStage: 'input',
              note: '',
              selectedEmotion: null,
              quantitativeCount: (flow.status?.[dateKey]?.quantitative?.count || 0).toString(),
              timeDuration: { hours: '', minutes: '', seconds: '' },
            });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        },
        {
          text: 'Not Set /',
          onPress: () => {
            onUpdateStatus(flow.id, dateKey, { symbol: '/', quantitative: { count: 0, goal: flow.goal || 1, unitText: flow.unitText || '' } }, flow.status);
            setModalState({ selectedDate: null, pendingStatus: null, showResponseModal: false, modalStage: 'input', note: '', selectedEmotion: null, quantitativeCount: '', timeDuration: { hours: '', minutes: '', seconds: '' } });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        }
      );
    } else if (flow.trackingType === 'Time-based') {
      alertOptions.unshift(
        {
          text: 'Set Duration',
          onPress: () => {
            const totalDuration = flow.status?.[dateKey]?.timebased?.totalDuration || flow.status?.[dateKey]?.timeUpdate?.totalDuration || 0;
            setModalState({
              selectedDate: dateKey,
              pendingStatus: totalDuration > 0 ? '+' : '/',
              showResponseModal: true,
              modalStage: 'input',
              note: '',
              selectedEmotion: null,
              quantitativeCount: '',
              timeDuration: {
                hours: Math.floor(totalDuration / 3600).toString(),
                minutes: Math.floor((totalDuration % 3600) / 60).toString(),
                seconds: (totalDuration % 60).toString(),
              },
            });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        },
        {
          text: 'Not Set /',
          onPress: () => {
            onUpdateStatus(flow.id, dateKey, { symbol: '/', timebased: { totalDuration: 0, pausesCount: 0, hours: flow.hours || 0, minutes: flow.minutes || 0, seconds: flow.seconds || 0 } }, flow.status);
            setModalState({ selectedDate: null, pendingStatus: null, showResponseModal: false, modalStage: 'input', note: '', selectedEmotion: null, quantitativeCount: '', timeDuration: { hours: '', minutes: '', seconds: '' } });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        }
      );
    } else {
      alertOptions.unshift(
        {
          text: 'Done +',
          onPress: () => {
            setModalState({
              selectedDate: dateKey,
              pendingStatus: '+',
              showResponseModal: true,
              modalStage: 'note_emotion',
              note: '',
              selectedEmotion: null,
              quantitativeCount: '',
              timeDuration: { hours: '', minutes: '', seconds: '' },
            });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        },
        {
          text: 'Missed -',
          onPress: () => {
            setModalState({
              selectedDate: dateKey,
              pendingStatus: '-',
              showResponseModal: true,
              modalStage: 'note_emotion',
              note: '',
              selectedEmotion: null,
              quantitativeCount: '',
              timeDuration: { hours: '', minutes: '', seconds: '' },
            });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        },
        {
          text: 'Not Set /',
          onPress: () => {
            onUpdateStatus(flow.id, dateKey, { symbol: '/' }, flow.status);
            setModalState({ selectedDate: null, pendingStatus: null, showResponseModal: false, modalStage: 'input', note: '', selectedEmotion: null, quantitativeCount: '', timeDuration: { hours: '', minutes: '', seconds: '' } });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        }
      );
    }

    Alert.alert(
      'Update Flow Status',
      `Update status for ${moment(dateKey).format('MMMM D, YYYY')}`,
      alertOptions
    );
  }, [cheatMode, flow.id, flow.status, flow.trackingType, flow.goal, flow.unitText, flow.hours, flow.minutes, flow.seconds, onUpdateStatus]);

  const handleInputSubmit = useCallback(() => {
    if (isUpdating.current || !modalState.selectedDate || !modalState.pendingStatus) {
      console.log('Input submit blocked: isUpdating or invalid state', { isUpdating: isUpdating.current, selectedDate: modalState.selectedDate, pendingStatus: modalState.pendingStatus });
      return;
    }
    isUpdating.current = true;

    if (flow.trackingType === 'Quantitative') {
      const count = parseInt(modalState.quantitativeCount, 10) || 0;
      if (isNaN(count) || count < 0) {
        Alert.alert('Error', 'Please enter a valid non-negative count');
        isUpdating.current = false;
        return;
      }
      setModalState((prev) => ({ ...prev, modalStage: 'note_emotion' }));
    } else if (flow.trackingType === 'Time-based') {
      const hours = parseInt(modalState.timeDuration.hours, 10) || 0;
      const minutes = parseInt(modalState.timeDuration.minutes, 10) || 0;
      const seconds = parseInt(modalState.timeDuration.seconds, 10) || 0;
      const totalDuration = (hours * 3600) + (minutes * 60) + seconds;
      if (totalDuration < 0) {
        Alert.alert('Error', 'Please enter a valid non-negative duration');
        isUpdating.current = false;
        return;
      }
      setModalState((prev) => ({ ...prev, modalStage: 'note_emotion' }));
    }

    setTimeout(() => { isUpdating.current = false; }, 100);
  }, [modalState, flow.trackingType]);

  const handleResponseSubmit = useCallback(() => {
    if (isUpdating.current || !modalState.selectedDate || !modalState.pendingStatus) {
      console.log('Response submit blocked: isUpdating or invalid state', { isUpdating: isUpdating.current, selectedDate: modalState.selectedDate, pendingStatus: modalState.pendingStatus });
      return;
    }
    isUpdating.current = true;

    const updates = {
      symbol: modalState.pendingStatus,
      emotion: modalState.selectedEmotion?.label || null,
      note: modalState.note.trim() || null,
      timestamp: new Date().toISOString(),
    };

    if (flow.trackingType === 'Quantitative') {
      const count = parseInt(modalState.quantitativeCount, 10) || 0;
      const goal = flow.goal || 1;
      updates.quantitative = {
        count,
        goal,
        unitText: flow.unitText || '',
      };
      updates.symbol = count > 0 ? '+' : '/';
    } else if (flow.trackingType === 'Time-based') {
      const hours = parseInt(modalState.timeDuration.hours, 10) || 0;
      const minutes = parseInt(modalState.timeDuration.minutes, 10) || 0;
      const seconds = parseInt(modalState.timeDuration.seconds, 10) || 0;
      const totalDuration = (hours * 3600) + (minutes * 60) + seconds;
      updates.timebased = {
        totalDuration,
        pausesCount: 0,
        hours: flow.hours || 0,
        minutes: flow.minutes || 0,
        seconds: flow.seconds || 0,
      };
      updates.symbol = totalDuration > 0 ? '+' : '/';
    }

    console.log('Submitting updates:', { id: flow.id, date: modalState.selectedDate, updates });
    onUpdateStatus(flow.id, modalState.selectedDate, updates, flow.status);
    setModalState({ selectedDate: null, pendingStatus: null, showResponseModal: false, modalStage: 'input', note: '', selectedEmotion: null, quantitativeCount: '', timeDuration: { hours: '', minutes: '', seconds: '' } });
    setTimeout(() => { isUpdating.current = false; }, 100);
  }, [modalState, flow.id, flow.trackingType, flow.goal, flow.unitText, flow.hours, flow.minutes, flow.seconds, onUpdateStatus]);

  const handleResponseSkip = useCallback(() => {
    if (isUpdating.current || !modalState.selectedDate || !modalState.pendingStatus) {
      console.log('Skip blocked: isUpdating or invalid state', { isUpdating: isUpdating.current, selectedDate: modalState.selectedDate, pendingStatus: modalState.pendingStatus });
      return;
    }
    isUpdating.current = true;

    const updates = {
      symbol: modalState.pendingStatus,
      emotion: null,
      note: null,
      timestamp: new Date().toISOString(),
    };

    if (flow.trackingType === 'Quantitative') {
      const count = parseInt(modalState.quantitativeCount, 10) || 0;
      const goal = flow.goal || 1;
      updates.quantitative = {
        count,
        goal,
        unitText: flow.unitText || '',
      };
      updates.symbol = count > 0 ? '+' : '/';
    } else if (flow.trackingType === 'Time-based') {
      const hours = parseInt(modalState.timeDuration.hours, 10) || 0;
      const minutes = parseInt(modalState.timeDuration.minutes, 10) || 0;
      const seconds = parseInt(modalState.timeDuration.seconds, 10) || 0;
      const totalDuration = (hours * 3600) + (minutes * 60) + seconds;
      updates.timebased = {
        totalDuration,
        pausesCount: 0,
        hours: flow.hours || 0,
        minutes: flow.minutes || 0,
        seconds: flow.seconds || 0,
      };
      updates.symbol = totalDuration > 0 ? '+' : '/';
    }

    console.log('Skipping note/emotion:', { id: flow.id, date: modalState.selectedDate, updates });
    onUpdateStatus(flow.id, modalState.selectedDate, updates, flow.status);
    setModalState({ selectedDate: null, pendingStatus: null, showResponseModal: false, modalStage: 'input', note: '', selectedEmotion: null, quantitativeCount: '', timeDuration: { hours: '', minutes: '', seconds: '' } });
    setTimeout(() => { isUpdating.current = false; }, 100);
  }, [modalState, flow.id, flow.trackingType, flow.goal, flow.unitText, flow.hours, flow.minutes, flow.seconds, onUpdateStatus]);

  const handleBack = useCallback(() => {
    setModalState((prev) => ({ ...prev, modalStage: 'input', note: '', selectedEmotion: null }));
    setTimeout(() => { isUpdating.current = false; }, 100);
  }, []);

  const markedDates = useMemo(() => {
    const dates = {};
    Object.entries(flow.status || {}).forEach(([date, status]) => {
      let displaySymbol = status.symbol;
      if (flow.trackingType === 'Quantitative') {
        const count = status.quantitative?.count || 0;
        displaySymbol = count > 0 ? '+' : '/';
      } else if (flow.trackingType === 'Time-based') {
        const duration = status.timebased?.totalDuration || status.timeUpdate?.totalDuration || 0;
        displaySymbol = duration > 0 ? '+' : '/';
      }
      // Define colors for different status types
      let backgroundColor;
      let textColor;
      
      if (displaySymbol === '+' || displaySymbol === '✅') {
        // Completed - Green
        backgroundColor = themeColors.success;
        textColor = themeColors.background;
      } else if (displaySymbol === '-' || displaySymbol === '❌') {
        // Missed/Failed - Red
        backgroundColor = themeColors.error;
        textColor = themeColors.background;
      } else if (displaySymbol === '*' || displaySymbol === '~' || displaySymbol === '🔄') {
        // Partial - Orange/Yellow
        backgroundColor = themeColors.warning || '#FFA500';
        textColor = themeColors.background;
      } else if (displaySymbol === '/' || displaySymbol === '⏭️') {
        // Skip/Inactive - Gray
        backgroundColor = themeColors.progressBackground;
        textColor = themeColors.secondaryText;
      } else {
        // Default - Gray
        backgroundColor = themeColors.progressBackground;
        textColor = themeColors.secondaryText;
      }
      
      dates[date] = {
        customStyles: {
          container: {
            backgroundColor: backgroundColor,
          },
          text: {
            color: textColor,
            fontWeight: highContrast ? '700' : 'bold',
          },
        },
      };
    });
    if (Object.keys(dates).length === 0) {
      dates[moment().format('YYYY-MM-DD')] = {
        customStyles: { container: { backgroundColor: themeColors.progressBackground }, text: { color: themeColors.secondaryText } },
      };
    }
    console.log('Marked dates:', dates);
    return dates;
  }, [flow.status, flow.trackingType, flow.goal, highContrast]);

  const renderCustomDay = useCallback(({ date, state }) => {
    const dateKey = date.dateString;
    const status = flow.status?.[dateKey];
    
    // Handle both emotion labels and direct emoji values
    let emotion = '';
    if (status?.emotion) {
      if (status.emotion.length === 1) {
        // Direct emoji value
        emotion = status.emotion;
      } else {
        // Emotion label - find corresponding emoji
        emotion = emotions.find((e) => e.label === status.emotion)?.emoji || '';
      }
    }
    
    // TEST: Force show emotion on September 23rd for debugging
    if (dateKey === '2025-09-23') {
      emotion = '😞'; // Force the emotion to show
      console.log('FORCING EMOTION ON SEPT 23:', emotion);
    }
    
    // TEST: Show emotion on every day for debugging
    if (!emotion) {
      emotion = '😊'; // Default test emotion
    }
    
    const hasNote = status?.note && typeof status.note === 'string' && status.note.trim() ? '📝' : '';
    const isDisabled = state === 'disabled';
    let displayText = '';
    let statusSymbol = '';

    // Debug logging
    if (status?.emotion) {
      console.log(`Date ${dateKey}: emotion=${status.emotion}, emoji=${emotion}`);
    }
    
    // Specific debug for September 23rd
    if (dateKey === '2024-09-23' || dateKey === '2023-09-23' || dateKey === '2025-09-23') {
      console.log(`Rendering September 23rd (${dateKey}):`);
      console.log('- Status:', status);
      console.log('- Emotion:', status?.emotion);
      console.log('- Emotion emoji:', emotion);
      console.log('- Available emotions:', emotions);
    }

    if (flow.trackingType === 'Quantitative') {
      const count = status?.quantitative?.count || 0;
      const unitText = status?.quantitative?.unitText || flow.unitText || '';
      displayText = count > 0 ? `${count} ${unitText}` : '';
      statusSymbol = count > 0 ? '+' : '/';
    } else if (flow.trackingType === 'Time-based') {
      const duration = status?.timebased?.totalDuration || status?.timeUpdate?.totalDuration || 0;
      displayText = duration > 0 ? `${(duration / 3600).toFixed(1)}h` : '';
      statusSymbol = duration > 0 ? '+' : '/';
    } else {
      statusSymbol = status?.symbol || '';
    }

    return (
      <View style={styles.dayContainer}>
        <Text
          style={[
            styles.dayText,
            {
              color: isDisabled ? themeColors.disabledText : themeColors.primaryText,
              fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
              fontWeight: highContrast ? '700' : '500',
            },
          ]}
        >
          {date.day}
        </Text>
        
        {/* Status Symbol */}
        {statusSymbol && (
          <Text
            style={[
              styles.statusSymbol,
              {
                fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
                color: statusSymbol === '+' || statusSymbol === '✅' ? themeColors.success : 
                       statusSymbol === '-' || statusSymbol === '❌' ? themeColors.error : 
                       statusSymbol === '*' || statusSymbol === '~' || statusSymbol === '🔄' ? (themeColors.warning || '#FFA500') :
                       themeColors.secondaryText,
              },
            ]}
          >
            {statusSymbol}
          </Text>
        )}
        
        {/* Mood/Emotion Indicator */}
        {emotion && (
          <Text
            style={[
              styles.moodIndicator,
              {
                fontSize: 18, // Larger font size
                marginTop: 2,
                backgroundColor: 'yellow', // DEBUG: Add background color to make it visible
                padding: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'orange',
                minHeight: 24,
                lineHeight: 20,
              },
            ]}
          >
            {emotion}
          </Text>
        )}
        
        {/* DEBUG: Always show test emotion on Sept 23 */}
        {dateKey === '2025-09-23' && (
          <Text
            style={[
              styles.moodIndicator,
              {
                fontSize: 12,
                marginTop: 2,
                backgroundColor: 'red',
                color: 'white',
                padding: 2,
                borderRadius: 4,
                fontWeight: 'bold',
                minHeight: 16,
                lineHeight: 14,
              },
            ]}
          >
            TEST
          </Text>
        )}
        
        {/* FORCE SHOW EMOTION ON EVERY DAY FOR DEBUGGING */}
        <Text
          style={[
            styles.moodIndicator,
            {
              fontSize: 16,
              marginTop: 2,
              backgroundColor: 'green',
              color: 'white',
              padding: 2,
              borderRadius: 4,
              fontWeight: 'bold',
            },
          ]}
        >
          😊
        </Text>
        
        {/* Value Display (for Quantitative/Time-based) */}
        {displayText && (
          <Text
            style={[
              styles.valueText,
              {
                fontSize: textSize === 'small' ? 8 : textSize === 'large' ? 12 : 10,
                color: themeColors.secondaryText,
              },
            ]}
          >
            {displayText}
          </Text>
        )}
        
        {/* Note Indicator */}
        {hasNote && (
          <Text
            style={[
              styles.noteIndicator,
              {
                fontSize: textSize === 'small' ? 8 : textSize === 'large' ? 12 : 10,
                color: themeColors.info,
              },
            ]}
          >
            {hasNote}
          </Text>
        )}
      </View>
    );
  }, [flow.status, flow.trackingType, flow.unitText, theme, textSize, highContrast]);

  const handleMonthChange = useCallback((month) => {
    const newMonth = moment(month.dateString).startOf('month');
    console.log('Month changed to:', newMonth.format('MMMM YYYY'));
    if (onMonthChange) onMonthChange(newMonth);
  }, [onMonthChange]);

  const dynamicStyles = StyleSheet.create({
    calendar: {
      backgroundColor: themeColors.background,
      borderRadius: layout.radii.large,
      marginVertical: layout.spacing.md,
      padding: layout.spacing.sm,
    },
    inputContainer: {
      flexDirection: 'row',
      gap: layout.spacing.md,
      marginBottom: layout.spacing.md,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: layout.radii.base,
      padding: layout.spacing.md,
      backgroundColor: themeColors.background,
      color: themeColors.primaryText,
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      textAlign: 'center',
      minHeight: 48,
    },
    inputLabel: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: themeColors.secondaryText,
      marginBottom: layout.spacing.sm,
    },
  });

  return (
    <>
      <Calendar
        current={currentMonth.format('YYYY-MM-DD')}
        markedDates={markedDates}
        markingType={'custom'}
        onDayPress={handleDayPress}
        renderDay={renderCustomDay}
        enableSwipe={true}
        onMonthChange={handleMonthChange}
        theme={{
          calendarBackground: themeColors.background,
          textSectionTitleColor: themeColors.primaryText,
          todayTextColor: themeColors.primaryOrange,
          dayTextColor: themeColors.primaryText,
          arrowColor: themeColors.primaryOrange,
          monthTextColor: themeColors.primaryOrange,
          textDisabledColor: themeColors.disabledText,
          'stylesheet.calendar.header': {
            week: {
              marginTop: 5,
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
            header: {
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 10,
              paddingTop: 10,
              backgroundColor: themeColors.background,
            },
          },
        }}
        style={dynamicStyles.calendar}
      />
      <ResponseModal
        visible={modalState.showResponseModal}
        onClose={handleResponseSkip}
        onSubmit={modalState.modalStage === 'input' ? handleInputSubmit : handleResponseSubmit}
        onSkip={handleResponseSkip}
        title={`Update ${flow.title} for ${moment(modalState.selectedDate).format('MMMM D, YYYY')}`}
        note={modalState.note}
        setNote={(text) => setModalState((prev) => ({ ...prev, note: text }))}
        selectedEmotion={modalState.selectedEmotion}
        setSelectedEmotion={(emotion) => setModalState((prev) => ({ ...prev, selectedEmotion: emotion }))}
        showBackButton={modalState.modalStage === 'note_emotion'}
        onBack={handleBack}
        modalStage={modalState.modalStage}
        trackingType={flow.trackingType}
      >
        {modalState.modalStage === 'input' && flow.trackingType === 'Quantitative' && (
          <View style={dynamicStyles.inputContainer}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.inputLabel}>Count ({flow.unitText || 'units'})</Text>
              <TextInput
                style={dynamicStyles.input}
                value={modalState.quantitativeCount}
                onChangeText={(text) => setModalState((prev) => ({ ...prev, quantitativeCount: text.replace(/[^0-9]/g, '') }))}
                placeholder="Enter count"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}
        {modalState.modalStage === 'input' && flow.trackingType === 'Time-based' && (
          <View style={dynamicStyles.inputContainer}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.inputLabel}>Hours</Text>
              <TextInput
                style={dynamicStyles.input}
                value={modalState.timeDuration.hours}
                onChangeText={(text) => setModalState((prev) => ({ ...prev, timeDuration: { ...prev.timeDuration, hours: text.replace(/[^0-9]/g, '') } }))}
                placeholder="0"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.inputLabel}>Minutes</Text>
              <TextInput
                style={dynamicStyles.input}
                value={modalState.timeDuration.minutes}
                onChangeText={(text) => setModalState((prev) => ({ ...prev, timeDuration: { ...prev.timeDuration, minutes: text.replace(/[^0-9]/g, '') } }))}
                placeholder="0"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.inputLabel}>Seconds</Text>
              <TextInput
                style={dynamicStyles.input}
                value={modalState.timeDuration.seconds}
                onChangeText={(text) => setModalState((prev) => ({ ...prev, timeDuration: { ...prev.timeDuration, seconds: text.replace(/[^0-9]/g, '') } }))}
                placeholder="0"
                placeholderTextColor={themeColors.secondaryText}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}
      </ResponseModal>
      
      {/* Cheat Mode Popup */}
      <CheatModePopup
        visible={showCheatModePopup}
        onClose={() => setShowCheatModePopup(false)}
        flowTitle={flow.title}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    minHeight: 60, // Increased height for better visibility
    width: '100%',
  },
  dayText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 16,
  },
  statusSymbol: {
    textAlign: 'center',
    marginTop: 2,
    fontWeight: 'bold',
    fontSize: 14,
  },
  moodIndicator: {
    textAlign: 'center',
    marginTop: 2,
    fontSize: 16,
    fontWeight: 'bold',
    minHeight: 20, // Ensure minimum height
    lineHeight: 20,
  },
  valueText: {
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
    fontSize: 10,
  },
  noteIndicator: {
    textAlign: 'center',
    marginTop: 2,
    fontSize: 10,
  },
});

export default FlowCalendar;
