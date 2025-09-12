import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { HabitsContext } from '../../context/HabitContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';
import StatsBinary from './StatsBinary';
import StatsQuantitative from './StatsQuantitative';
import StatsTimeBased from './StatsTimeBased';

const { width: screenWidth } = Dimensions.get('window');

const HabitStatsDetail = ({ route, navigation }) => {
  const { habitId } = route?.params || {};
  const { habits } = useContext(HabitsContext) || {};
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedYear, setSelectedYear] = useState(moment().year());

  if (!habitId || !habits) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>Habit data unavailable</Text>
      </SafeAreaView>
    );
  }

  const habit = habits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#222',
    },
    header: {
      fontSize: textSize === 'small' ? 20 : textSize === 'large' ? 24 : 22,
      color: theme === 'light' ? '#222' : '#FFF',
      fontWeight: highContrast ? '800' : '700',
      textAlign: 'center',
      marginBottom: 16,
      paddingVertical: 8,
    },
    errorText: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#dc3545' : '#ff6b6b',
      fontWeight: highContrast ? '700' : '600',
      textAlign: 'center',
      marginTop: 20,
    },
    periodButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 16,
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#333',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#FFA500',
      height: 40,
      overflow: 'hidden',
    },
    button: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedButton: {
      backgroundColor: '#FFE4B5',
    },
    buttonText: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      color: '#999',
      fontWeight: '600',
      textAlign: 'center',
    },
    selectedButtonText: {
      color: '#FFA500',
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.header, dynamicStyles.header]}>{habit.title} Statistics</Text>
        
        {habit.trackingType === 'Quantitative' ? (
          <StatsQuantitative
            habit={habit}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        ) : habit.trackingType === 'Time-based' ? (
          <StatsTimeBased
            habit={habit}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        ) : (
          <StatsBinary
            habit={habit}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
});

export default HabitStatsDetail;