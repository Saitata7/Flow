import React, { useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ThemeContext } from '../../context/ThemeContext';
import ResponseModal from './todayResponse/Response';
import moment from 'moment';

const FlowCalendar = ({ flow, onUpdateStatus, onMonthChange, currentMonth }) => {
  const { theme = 'light', textSize = 'medium', highContrast = false, accentColor = '#007AFF', cheatMode = false } = useContext(ThemeContext) || {};
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

  useEffect(() => {
    console.log('Flow status updated:', flow.status);
  }, [flow.status]);

  console.log('Flow status received:', flow.status, 'trackingType:', flow.trackingType);

  const handleDayPress = useCallback((day) => {
    if (isUpdating.current) {
      console.log('Day press blocked: isUpdating true');
      return;
    }
    isUpdating.current = true;

    const dateKey = day.dateString;
    if (!cheatMode && moment(dateKey).isAfter(moment(), 'day')) {
      Alert.alert('Error', 'Cannot set status for future dates unless cheat mode is enabled');
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
          text: 'Not Set ➖',
          onPress: () => {
            onUpdateStatus(flow.id, dateKey, { symbol: '➖', quantitative: { count: 0, goal: flow.goal || 1, unitText: flow.unitText || '' } }, flow.status);
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
              pendingStatus: totalDuration > 0 ? '✅' : '➖',
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
          text: 'Not Set ➖',
          onPress: () => {
            onUpdateStatus(flow.id, dateKey, { symbol: '➖', timebased: { totalDuration: 0, pausesCount: 0, hours: flow.hours || 0, minutes: flow.minutes || 0, seconds: flow.seconds || 0 } }, flow.status);
            setModalState({ selectedDate: null, pendingStatus: null, showResponseModal: false, modalStage: 'input', note: '', selectedEmotion: null, quantitativeCount: '', timeDuration: { hours: '', minutes: '', seconds: '' } });
            setTimeout(() => { isUpdating.current = false; }, 100);
          },
        }
      );
    } else {
      alertOptions.unshift(
        {
          text: 'Done ✅',
          onPress: () => {
            setModalState({
              selectedDate: dateKey,
              pendingStatus: '✅',
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
          text: 'Missed ❌',
          onPress: () => {
            setModalState({
              selectedDate: dateKey,
              pendingStatus: '❌',
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
          text: 'Not Set ➖',
          onPress: () => {
            onUpdateStatus(flow.id, dateKey, { symbol: '➖' }, flow.status);
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
      updates.symbol = count > 0 ? '✅' : '➖';
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
      updates.symbol = totalDuration > 0 ? '✅' : '➖';
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
      updates.symbol = count > 0 ? '✅' : '➖';
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
      updates.symbol = totalDuration > 0 ? '✅' : '➖';
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
        displaySymbol = count > 0 ? '✅' : '➖';
      } else if (flow.trackingType === 'Time-based') {
        const duration = status.timebased?.totalDuration || status.timeUpdate?.totalDuration || 0;
        displaySymbol = duration > 0 ? '✅' : '➖';
      }
      dates[date] = {
        customStyles: {
          container: {
            backgroundColor: displaySymbol === '✅' ? '#28a745' : displaySymbol === '❌' ? '#dc3545' : '#e0e0e0',
          },
          text: {
            color: displaySymbol === '➖' ? '#666' : '#fff',
            fontWeight: highContrast ? '700' : 'bold',
          },
        },
      };
    });
    if (Object.keys(dates).length === 0) {
      dates[moment().format('YYYY-MM-DD')] = {
        customStyles: { container: { backgroundColor: '#e0e0e0' }, text: { color: '#666' } },
      };
    }
    console.log('Marked dates:', dates);
    return dates;
  }, [flow.status, flow.trackingType, flow.goal, highContrast]);

  const renderCustomDay = useCallback(({ date, state }) => {
    const dateKey = date.dateString;
    const status = flow.status?.[dateKey];
    const emotion = status?.emotion ? emotions.find((e) => e.label === status.emotion)?.emoji || '' : '';
    const hasNote = status?.note && typeof status.note === 'string' && status.note.trim() ? '📝' : '';
    const isDisabled = state === 'disabled';
    let displayText = '';

    if (flow.trackingType === 'Quantitative') {
      const count = status?.quantitative?.count || 0;
      const unitText = status?.quantitative?.unitText || flow.unitText || '';
      displayText = count > 0 ? `${count} ${unitText}` : '';
    } else if (flow.trackingType === 'Time-based') {
      const duration = status?.timebased?.totalDuration || status?.timeUpdate?.totalDuration || 0;
      displayText = duration > 0 ? `${(duration / 3600).toFixed(1)}h` : '';
    }

    return (
      <View style={styles.dayContainer}>
        <Text
          style={[
            styles.dayText,
            {
              color: isDisabled
                ? theme === 'light' ? '#ccc' : '#666'
                : theme === 'light' ? '#333' : '#e0e0e0',
              fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
              fontWeight: highContrast ? '700' : '500',
            },
          ]}
        >
          {date.day}
        </Text>
        {displayText && (
          <Text
            style={{
              fontSize: textSize === 'small' ? 10 : textSize === 'large' ? 14 : 12,
              marginTop: 2,
              color: theme === 'light' ? '#333' : '#e0e0e0',
            }}
          >
            {displayText}
          </Text>
        )}
        {emotion && (
          <Text
            style={{
              fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
              marginTop: 2,
              color: theme === 'light' ? '#333' : '#e0e0e0',
            }}
          >
            {emotion}
          </Text>
        )}
        {hasNote && (
          <Text
            style={{
              fontSize: textSize === 'small' ? 10 : textSize === 'large' ? 14 : 12,
              marginTop: 2,
              color: theme === 'light' ? '#666' : '#a0a0a0',
            }}
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
      backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e',
      borderRadius: 8,
      marginVertical: 12,
      padding: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme === 'light' ? '#ccc' : '#666',
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme === 'light' ? '#fff' : '#333',
      color: theme === 'light' ? '#333' : '#e0e0e0',
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      textAlign: 'center',
      minHeight: 48,
    },
    inputLabel: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: theme === 'light' ? '#666' : '#aaa',
      marginBottom: 8,
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
          calendarBackground: theme === 'light' ? '#fff' : '#1e1e1e',
          textSectionTitleColor: '#000',
          todayTextColor: accentColor,
          dayTextColor: theme === 'light' ? '#333' : '#e0e0e0',
          arrowColor: '#FF9500',
          monthTextColor: '#FF9500',
          textDisabledColor: theme === 'light' ? '#ccc' : '#666',
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
              backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e',
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
                placeholderTextColor={theme === 'light' ? '#666' : '#999'}
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
                placeholderTextColor={theme === 'light' ? '#666' : '#999'}
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
                placeholderTextColor={theme === 'light' ? '#666' : '#999'}
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
                placeholderTextColor={theme === 'light' ? '#666' : '#999'}
                keyboardType="numeric"
              />
            </View>
          </View>
        )}
      </ResponseModal>
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
  },
  dayText: {
    textAlign: 'center',
  },
});

export default FlowCalendar;
