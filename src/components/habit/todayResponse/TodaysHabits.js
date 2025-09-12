import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HabitsContext } from '../../../context/HabitContext';
import moment from 'moment';
import ResponseModal from './Response';
import Binary from './Binary';
import Quantitative from './Quantitative';
import Timebased from './Timebased';

const TodaysHabits = ({ visibleHabits }) => {
  const { updateHabit, updateCount, updateTimeBased } = useContext(HabitsContext) || {};
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [note, setNote] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const isUpdating = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    console.log('TodaysHabits re-rendered', visibleHabits.map(h => ({ id: h.id, trackingType: h.trackingType, status: h.status?.[moment().format('YYYY-MM-DD')]?.symbol || '-', fullStatus: h.status })));
  }, [visibleHabits, refreshKey]);

  const updateHabitStatus = useCallback((habitId, dateKey, statusSymbol, emotion = null, note = null, reset = false) => {
    if (!['✅', '❌', '-'].includes(statusSymbol)) {
      console.warn('Invalid status symbol:', statusSymbol);
      return;
    }

    const trimmedNote = note && typeof note === 'string' && note.trim() ? note.trim() : null;
    
    console.log('updateHabitStatus called:', { habitId, dateKey, statusSymbol, emotion, note: trimmedNote, reset });
    
    if (updateHabit) {
      const currentHabit = visibleHabits.find(h => h.id === habitId);
      if (currentHabit) {
        const newStatus = { ...currentHabit.status };
        if (reset) {
          newStatus[dateKey] = {
            symbol: '-',
            emotion: null,
            note: null,
            timestamp: null,
            quantitative: currentHabit.trackingType === 'Quantitative' ? { unitText: newStatus[dateKey]?.quantitative?.unitText || '', count: 0 } : null,
            timebased: currentHabit.trackingType === 'Time-based' ? {
              hours: newStatus[dateKey]?.timebased?.hours || 0,
              minutes: newStatus[dateKey]?.timebased?.minutes || 0,
              seconds: newStatus[dateKey]?.timebased?.seconds || 0,
              time: { start0: null, break: null, start1: null, stop: null },
              totalDuration: 0
            } : null
          };
          console.log('Reset applied - New Status:', newStatus);
        } else {
          newStatus[dateKey] = {
            ...newStatus[dateKey],
            symbol: statusSymbol,
            emotion,
            note: trimmedNote,
            timestamp: new Date().toISOString()
          };
        }
        updateHabit(habitId, { status: newStatus });
        setRefreshKey(prev => prev + 1);
      }
    }
  }, [updateHabit, visibleHabits]);

  const handleCountChange = useCallback((habit, action, count) => {
    if (isUpdating.current) {
      console.log('Action blocked: isUpdating');
      return;
    }
    isUpdating.current = true;

    const todayKey = moment().format('YYYY-MM-DD');
    console.log('handleCountChange:', { habitId: habit.id, action, count });

    updateCount(habit.id, todayKey, action);
    if (action === '+' && count > 0) {
      const currentHabit = visibleHabits.find(h => h.id === habit.id);
      const newStatus = { ...currentHabit.status };
      newStatus[todayKey] = {
        ...newStatus[todayKey],
        quantitative: { ...newStatus[todayKey]?.quantitative, count },
        symbol: '+'
      };
      updateHabit(habit.id, { status: newStatus });
    }
    setRefreshKey(prev => prev + 1);
    isUpdating.current = false;
  }, [updateCount, updateHabit, visibleHabits]);

  const handleTimeUpdate = useCallback((habit) => {
    if (isUpdating.current) {
      console.log('Action blocked: isUpdating');
      return;
    }
    isUpdating.current = true;

    const todayKey = moment().format('YYYY-MM-DD');
    console.log('handleTimeUpdate:', { habitId: quirk.id });

    const currentStatus = habit.status?.[todayKey] || {};
    const timebased = currentStatus.timebased || {
      hours: habit.status?.[todayKey]?.timebased?.hours || 0,
      minutes: habit.status?.[todayKey]?.timebased?.minutes || 0,
      seconds: habit.status?.[todayKey]?.timebased?.seconds || 0,
      time: { start0: null, break: null, start1: null, stop: null },
      totalDuration: 0
    };

    const now = new Date().toISOString();
    let timeUpdate = { ...timebased.time };

    if (!timeUpdate.start0) {
      timeUpdate.start0 = now;
    } else if (!timeUpdate.break) {
      timeUpdate.break = now;
    } else if (!timeUpdate.start1) {
      timeUpdate.start1 = now;
    } else if (!timeUpdate.stop) {
      timeUpdate.stop = now;
    }

    updateTimeBased(habit.id, todayKey, { timeUpdate });
    setRefreshKey(prev => prev + 1);
    isUpdating.current = false;
  }, [updateTimeBased]);

  const handleAction = useCallback((habit, statusSymbol, openNoteInput = false, reset = false) => {
    if (isUpdating.current) {
      console.log('Action blocked: isUpdating');
      return;
    }
    isUpdating.current = true;

    const todayKey = moment().format('YYYY-MM-DD');
    console.log('handleAction:', { habitId: habit.id, statusSymbol, openNoteInput, reset });

    setSelectedHabit(habit);
    setPendingStatus(statusSymbol);
    setNote(habit.status?.[todayKey]?.note || '');
    setSelectedEmotion(null);

    if (reset) {
      updateHabitStatus(habit.id, todayKey, statusSymbol, null, null, true);
      isUpdating.current = false;
    } else {
      setShowResponseModal(true);
      isUpdating.current = false;
    }
  }, [updateHabitStatus]);

  const handleResponseSubmit = useCallback(() => {
    if (!selectedHabit || !pendingStatus) {
      console.log('Response submit blocked:', { selectedHabit, pendingStatus });
      return;
    }

    const todayKey = moment().format('YYYY-MM-DD');
    updateHabitStatus(selectedHabit.id, todayKey, pendingStatus, selectedEmotion?.label, note);
    resetState();
  }, [selectedHabit, pendingStatus, selectedEmotion, note, updateHabitStatus]);

  const handleSkip = useCallback(() => {
    if (!selectedHabit || !pendingStatus) {
      console.log('Skip blocked:', { selectedHabit, pendingStatus });
      return;
    }

    const todayKey = moment().format('YYYY-MM-DD');
    updateHabitStatus(selectedHabit.id, todayKey, pendingStatus, selectedEmotion?.label, note.trim() || null);
    resetState();
  }, [selectedHabit, pendingStatus, selectedEmotion, note, updateHabitStatus]);

  const resetState = useCallback(() => {
    setShowResponseModal(false);
    setNote('');
    setSelectedEmotion(null);
    setSelectedHabit(null);
    setPendingStatus(null);
    isUpdating.current = false;
  }, []);

  const sortedHabits = [...visibleHabits].sort((a, b) => {
    const todayKey = moment().format('YYYY-MM-DD');
    const statusA = a.status?.[todayKey]?.symbol || '-';
    const statusB = b.status?.[todayKey]?.symbol || '-';
    
    const order = { '-': 0, '✅': 1, '✓': 1, '+': 1, '❌': 2 };
    return order[statusA] - order[statusB];
  });

  if (!visibleHabits || visibleHabits.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No habits for today</Text>
      </View>
    );
  }

  return (
    <View >
      {sortedHabits.map((habit) => {
        const key = `${habit.id}-${habit.status?.[moment().format('YYYY-MM-DD')]?.symbol || '-'}-${refreshKey}`;
        if (habit.trackingType === 'Quantitative') {
          return (
            <Quantitative
              key={key}
              habit={habit}
              handleAction={handleAction}
              handleCountChange={handleCountChange}
            />
          );
        } else if (habit.trackingType === 'Time-based') {
          return (
            <Timebased
              key={key}
              habit={habit}
              handleAction={handleAction}
              handleTimeUpdate={handleTimeUpdate}
            />
          );
        } else {
          return (
            <Binary
              key={key}
              habit={habit}
              handleAction={handleAction}
            />
          );
        }
      })}
      <ResponseModal
        visible={showResponseModal}
        onClose={resetState}
        onSubmit={handleResponseSubmit}
        onSkip={handleSkip}
        title={pendingStatus === '✅' ? 'How was today\'s habit?' : 'Why did you miss this habit today?'}
        note={note}
        setNote={setNote}
        selectedEmotion={selectedEmotion}
        setSelectedEmotion={setSelectedEmotion}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 28,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter',
  },
});

export default TodaysHabits;