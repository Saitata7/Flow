import React, { useState, useContext, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { HabitsContext } from '../../context/HabitContext';
import HabitCalendar from '../../components/habit/HabitCalendar';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HabitDetail = ({ route, navigation }) => {
  const { habitId } = route.params || {};
  const { habits = [], updateHabit = () => {} } = useContext(HabitsContext) || {};
  const { theme = 'light', accentColor = '#007AFF', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));

  const habit = useMemo(() => habits.find((h) => h.id === habitId) || {}, [habits, habitId]);

  const handleUpdateStatus = useCallback((habitId, dateKey, statusSymbol, emotion, note, currentStatus) => {
    if (!['✅', '❌', '➖'].includes(statusSymbol)) {
      console.warn('Invalid status symbol:', statusSymbol);
      return;
    }

    const trimmedNote = note && typeof note === 'string' && note.trim() ? note.trim() : null;
    const updatedStatus = {
      ...currentStatus,
      [dateKey]: { symbol: statusSymbol, emotion, note: trimmedNote },
    };

    console.log('HabitDetail updating:', { habitId, dateKey, statusSymbol, emotion, note: trimmedNote });
    updateHabit(habitId, { status: updatedStatus })
      .then(() => {
        console.log('HabitDetail status updated:', { dateKey, statusSymbol, note: trimmedNote });
      })
      .catch((error) => {
        console.error('HabitDetail update failed:', error);
      });
  }, [updateHabit]);

  useFocusEffect(
    useCallback(() => {
      console.log('HabitDetail focused:', { habitId, status: habit.status });
    }, [habitId, habit.status])
  );

  const notes = useMemo(() => {
    console.log('Filtering notes for habit:', { habitId, month: moment(currentMonth).format('MMMM YYYY'), status: habit.status });
    return Object.entries(habit.status || {})
      .filter(([date, status]) => status.note && moment(date).isSame(currentMonth, 'month'))
      .map(([date, status]) => ({ date, note: status.note, symbol: status.symbol, emotion: status.emotion }))
      .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()); // Sort by date descending
  }, [habit.status, currentMonth]);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    header: {
      padding: 16,
      borderRadius: 12,
    },
    title: {
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
      fontSize: textSize === 'small' ? 18 : textSize === 'large' ? 24 : 20,
      fontWeight: highContrast ? '700' : '600',
    },
    detail: {
      color: theme === 'light' ? '#666' : '#a0a0a0',
      fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
      fontWeight: highContrast ? '600' : '500',
    },
    button: {
      backgroundColor: highContrast ? '#000' : accentColor,
    },
    buttonText: {
      color: highContrast ? '#fff' : '#fff',
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      fontWeight: highContrast ? '700' : '600',
    },
    deleteButton: {
      backgroundColor: highContrast ? '#d00' : '#dc3545',
    },
    notesTitle: {
      color: theme === 'light' ? '#333333' : '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    noteCard: {
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1C1C1E',
      borderRadius: 24,
      padding: 16,
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'light' ? 0.15 : 0.3,
      shadowRadius: 4,
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    noteDate: {
      color: theme === 'light' ? '#00AA00' : '#90EE90',
      fontSize: 16,
      fontWeight: '600',
    },
    noteMissedDate: {
      color: theme === 'light' ? '#FF4D4D' : '#FF9999',
      fontSize: 16,
      fontWeight: '600',
    },
    noteBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    noteBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 4,
    },
    noteText: {
      color: theme === 'light' ? '#444444' : '#DDDDDD',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 21,
    },
    noNotes: {
      color: theme === 'light' ? '#666' : '#a0a0a0',
      fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
      paddingVertical: 8,
    },
    divider: {
      height: 1,
      backgroundColor: theme === 'light' ? '#EEEEEE' : '#333333',
      marginVertical: 8,
    },
  }), [theme, textSize, highContrast, accentColor]);

  const renderNote = useCallback(({ item, index }) => {
    const isCompleted = item.symbol === '✅';
    const statusText = isCompleted ? 'Completed' : 'Missed';
    const statusColor = isCompleted ? '#00AA00' : '#FF4D4D';
    const badgeBackground = isCompleted ? '#E6F4EA' : '#FCECEC';
    const badgeTextColor = isCompleted ? '#006400' : '#FF4D4D';
    const badgeIcon = isCompleted ? 'check' : 'alert';
    const updatedTime = moment(item.date).format('MMMM D - hh:mm A');

    return (
      <View style={dynamicStyles.noteCard}>
        <View style={dynamicStyles.noteHeader}>
          <Text style={[dynamicStyles.noteDate, !isCompleted && dynamicStyles.noteMissedDate]}>
            {updatedTime} {item.emotion ? `- ${item.emotion}` : ''}
          </Text>
          <View style={[dynamicStyles.noteBadge, { backgroundColor: badgeBackground }]}>
            <MaterialCommunityIcons name={badgeIcon} size={16} color={badgeTextColor} />
            <Text style={[dynamicStyles.noteBadgeText, { color: badgeTextColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
        <Text style={dynamicStyles.noteText}>{item.note}</Text>
        {index < notes.length - 1 && <View style={dynamicStyles.divider} />}
      </View>
    );
  }, [dynamicStyles, notes.length]);

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, dynamicStyles.title]}>
            {habit.title || 'Habit'}
          </Text>
          <Text style={[styles.detail, dynamicStyles.detail]}>
            Des- {habit.description || 'No description'}
          </Text>
        </View>
      </View>
      <View style={styles.timeFrequencyRow}>
        {habit.time && (
          <Text style={[styles.detail, dynamicStyles.detail]}>
            Time: {moment(habit.time).local().format('hh:mm A')}
          </Text>
        )}
        <Text style={[styles.detail, dynamicStyles.detail]}>
          Frequency: {habit.repeatType === 'day' ? (habit.everyDay ? 'Every day' : habit.daysOfWeek?.join(', ') || 'Not set') : habit.selectedMonthDays?.join(', ') || 'Not set'}
        </Text>
      </View>
      <HabitCalendar
        habit={habit}
        onUpdateStatus={handleUpdateStatus}
        onMonthChange={setCurrentMonth}
        currentMonth={currentMonth}
      />
      <View style={styles.notesHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MaterialCommunityIcons name="note-text-outline" size={24} color="#FFA500" style={{ marginRight: 8 }} />
          <Text style={[styles.notesTitle, dynamicStyles.notesTitle]}>
            Notes for {moment(currentMonth).format('MMMM YYYY')}
          </Text>
        </View>
      </View>
    </View>
  );

  if (!habit.id) {
    return (
      <LinearGradient colors={['#FEDFCD', '#FFFFFF']} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <Text style={[styles.noNotes, dynamicStyles.noNotes]}>Habit not found</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FEDFCD', '#FFFFFF']} style={styles.gradientContainer}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.date}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            notes.length === 0 ? (
              <Text style={[styles.noNotes, dynamicStyles.noNotes]}>No notes for this month</Text>
            ) : null
          }
          contentContainerStyle={styles.contentContainer}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timeFrequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
  },
  detail: {
    marginBottom: 4,
  },
  notesHeader: {
    marginVertical: 16,
  },
  notesTitle: {
    marginBottom: 8,
  },
});

export default HabitDetail;