import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';

const HABITS_STORAGE_KEY = 'habits';

export const HabitsContext = createContext();

export const HabitsProvider = ({ children }) => {
  const [habits, setHabits] = useState([]);
  const [updateQueue, setUpdateQueue] = useState([]);

  const generateStatusDates = useCallback((trackingType, unitText, hours, minutes, seconds, goal) => {
    const status = {};
    for (let i = 0; i < 7; i++) {
      const dateKey = format(addDays(new Date(), i), 'yyyy-MM-dd');
      status[dateKey] = {
        symbol: '➖',
        emotion: null,
        note: null,
        timestamp: null,
        quantitative: trackingType === 'Quantitative' ? { unitText, goal, count: 0 } : null,
        timebased: trackingType === 'Time-based' ? {
          hours,
          minutes,
          seconds,
          start0: null,
          startTime: null,
          pauses: [],
          stop: null,
          endTime: null,
          totalDuration: 0,
          pausesCount: 0
        } : null
      };
    }
    return status;
  }, []);

  const loadData = useCallback(async () => {
    try {
      const habitsData = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      if (habitsData) {
        const loadedHabits = JSON.parse(habitsData);
        setHabits(loadedHabits);
        console.log('Loaded habits:', loadedHabits);
      }
    } catch (e) {
      console.error('Failed to load habits:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (updateQueue.length > 0) {
      const processQueue = async () => {
        for (const { id, date, updates, type } of updateQueue) {
          console.log('Processing queue item:', { id, date, updates, type });
          if (type === 'status') {
            await updateHabitStatus(id, date, updates, true);
          } else if (type === 'habit') {
            await updateHabit(id, updates, true);
          }
        }
        setUpdateQueue([]);
      };
      processQueue();
    }
  }, [updateQueue]);

  const addHabit = useCallback(
    async (habit) => {
      try {
        const newHabit = {
          id: habit.id || Date.now().toString(),
          title: habit.title,
          description: habit.description || '',
          trackingType: habit.trackingType,
          frequency: habit.frequency || 'Daily',
          everyDay: habit.everyDay || false,
          daysOfWeek: habit.daysOfWeek || [],
          reminderTime: habit.time || null,
          reminderLevel: habit.reminderLevel || '1',
          goal: habit.trackingType === 'Quantitative' ? habit.goal || 0 : undefined,
          hours: habit.trackingType === 'Time-based' ? habit.hours || 0 : undefined,
          minutes: habit.trackingType === 'Time-based' ? habit.minutes || 0 : undefined,
          seconds: habit.trackingType === 'Time-based' ? habit.seconds || 0 : undefined,
          unitText: habit.trackingType === 'Quantitative' ? habit.unitText || '' : undefined,
          status: generateStatusDates(
            habit.trackingType,
            habit.trackingType === 'Quantitative' ? habit.unitText : undefined,
            habit.trackingType === 'Time-based' ? habit.hours : undefined,
            habit.trackingType === 'Time-based' ? habit.minutes : undefined,
            habit.trackingType === 'Time-based' ? habit.seconds : undefined,
            habit.trackingType === 'Quantitative' ? habit.goal : undefined
          )
        };
        const newHabits = [...habits, newHabit];
        await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(newHabits));
        setHabits(newHabits);
        console.log('Added habit:', newHabit);
      } catch (e) {
        console.error('Failed to add habit:', e);
      }
    },
    [habits, generateStatusDates]
  );

  const updateHabitStatus = useCallback(
    async (id, date, updates, fromQueue = false) => {
      try {
        const updatedHabits = habits.map((habit) => {
          if (habit.id !== id) return habit;
          const currentStatus = habit.status[date] || {
            symbol: '➖',
            emotion: null,
            note: null,
            timestamp: null,
            quantitative: habit.trackingType === 'Quantitative' ? { 
              unitText: habit.unitText || '', 
              goal: habit.goal || 0, 
              count: 0 
            } : null,
            timebased: habit.trackingType === 'Time-based' ? {
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
            } : null
          };
          let newStatus = { ...currentStatus, ...updates };

          if (habit.trackingType === 'Quantitative' && updates.quantitative) {
            newStatus.quantitative = { ...currentStatus.quantitative, ...updates.quantitative };
            const count = newStatus.quantitative.count || 0;
            const goal = newStatus.quantitative.goal || habit.goal || 1;
            newStatus.symbol = count >= goal ? '✅' : count >= goal * 0.5 ? '🌗' : count > 0 ? '❌' : '➖';
          } else if (habit.trackingType === 'Time-based' && updates.timebased) {
            newStatus.timebased = { ...currentStatus.timebased, ...updates.timebased };
            const duration = newStatus.timebased.totalDuration || 0;
            const goalSeconds = ((habit.hours || 0) * 3600) + ((habit.minutes || 0) * 60) + (habit.seconds || 0);
            newStatus.symbol = duration >= goalSeconds ? '✅' : duration >= goalSeconds * 0.5 ? '🌗' : duration > 0 ? '❌' : '➖';
          } else {
            newStatus.symbol = updates.symbol || '➖';
          }

          newStatus.emotion = updates.emotion ?? currentStatus.emotion;
          newStatus.note = updates.note ?? currentStatus.note;
          newStatus.timestamp = updates.timestamp || new Date().toISOString();

          return {
            ...habit,
            status: {
              ...habit.status,
              [date]: newStatus
            }
          };
        });

        await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedHabits));
        setHabits(updatedHabits);
        console.log('Updated habit status:', { id, date, updates, updatedHabits: updatedHabits.find(h => h.id === id)?.status[date] });
      } catch (e) {
        console.error('Failed to update habit status:', e);
        if (!fromQueue) {
          setUpdateQueue((prev) => [...prev, { id, date, updates, type: 'status' }]);
        }
      }
    },
    [habits]
  );

  const updateHabit = useCallback(
    async (id, updates, fromQueue = false) => {
      try {
        const updatedHabits = habits.map((habit) =>
          habit.id === id ? { ...habit, ...updates } : habit
        );
        await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedHabits));
        setHabits(updatedHabits);
        console.log('Updated habit:', { id, updates });
      } catch (e) {
        console.error('Failed to update habit:', e);
        if (!fromQueue) {
          setUpdateQueue((prev) => [...prev, { id, updates, type: 'habit' }]);
        }
      }
    },
    [habits]
  );

  const deleteHabit = useCallback(
    async (id) => {
      try {
        const updatedHabits = habits.filter((habit) => habit.id !== id);
        await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedHabits));
        setHabits(updatedHabits);
        console.log('Deleted habit:', id);
      } catch (e) {
        console.error('Failed to delete habit:', e);
      }
    },
    [habits]
  );

  const updateCount = useCallback(
    async (id, date, action) => {
      await updateHabitStatus(id, date, { action });
    },
    [updateHabitStatus]
  );

  const updateTimeBased = useCallback(
    async (id, date, timeUpdate) => {
      console.log('Updating timebased:', { id, date, timeUpdate });
      await updateHabitStatus(id, date, { timeUpdate });
    },
    [updateHabitStatus]
  );

  return (
    <HabitsContext.Provider
      value={{
        habits,
        addHabit,
        updateHabit,
        updateHabitStatus,
        deleteHabit,
        updateCount,
        updateTimeBased,
        setHabits
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};