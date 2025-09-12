import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { HabitsContext } from '../context/HabitContext';
import moment from 'moment';

const messages = [
  "Keep going, every step counts!",
  "You're building great habits, stay consistent!",
  "One small action today leads to big results!",
  "You've got this, make today count!",
  "Every habit you stick to is a win!",
];

const MotivationalMessage = () => {
  const { habits = [] } = useContext(HabitsContext) || {};
  const { theme, textSize, highContrast } = useContext(ThemeContext) || {
    theme: 'light',
    textSize: 'medium',
    highContrast: false,
  };

  const todayKey = moment().format('YYYY-MM-DD');
  const [selectedMessage, setSelectedMessage] = useState('');

  // Calculate visible and completed habits
  const visibleHabits = habits.filter((habit) => {
    const today = moment().format('ddd');
    const todayDate = moment().format('D');
    return habit.repeatType === 'day'
      ? habit.everyDay || (habit.daysOfWeek && habit.daysOfWeek.includes(today))
      : habit.selectedMonthDays && habit.selectedMonthDays.includes(todayDate);
  });
  const completedHabits = visibleHabits.filter(
    (habit) => habit.status?.[todayKey]?.symbol === '✅'
  );
  const showMessage =
    habits.length === 0 ||
    (visibleHabits.length > 0 &&
      completedHabits.length / visibleHabits.length < 0.5);

  // Update message daily or when showMessage changes
  useEffect(() => {
    if (showMessage) {
      const newMessage = messages[Math.floor(Math.random() * messages.length)];
      setSelectedMessage(newMessage);
    } else {
      setSelectedMessage('');
    }
  }, [showMessage, todayKey]);

  if (!showMessage || !selectedMessage) return null;

  const dynamicStyles = StyleSheet.create({
    container: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme === 'light' ? '#e6f0ff' : '#333',
      marginVertical: 12,
      alignItems: 'center',
    },
    message: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: theme === 'light' ? '#333' : '#e0e0e0',
      fontWeight: highContrast ? '700' : '500',
      textAlign: 'center',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.message}>{selectedMessage}</Text>
    </View>
  );
};

export default MotivationalMessage;