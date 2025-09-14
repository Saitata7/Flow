import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';
import StatsBinary from './StatsBinary';
import StatsQuantitative from './StatsQuantitative';
import StatsTimeBased from './StatsTimeBased';

const { width: screenWidth } = Dimensions.get('window');

const FlowStatsDetail = ({ route, navigation }) => {
  const { flowId } = route?.params || {};
  const { flows } = useContext(FlowsContext) || {};
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedYear, setSelectedYear] = useState(moment().year());

  if (!flowId || !flows) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>Flow data unavailable</Text>
      </SafeAreaView>
    );
  }

  const flow = flows.find((f) => f.id === flowId);

  if (!flow) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>Flow not found</Text>
      </SafeAreaView>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme === 'light' ? '#FAF9F6' : '#121212',
    },
    header: {
      fontSize: textSize === 'small' ? 20 : textSize === 'large' ? 28 : 24,
      fontWeight: highContrast ? '700' : '600',
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
      textAlign: 'center',
      marginBottom: 20,
    },
    errorText: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#dc3545' : '#ff6b6b',
      fontWeight: highContrast ? '700' : '600',
      textAlign: 'center',
      marginTop: 20,
    },
    periodButton: {
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#2a2a2a',
      borderWidth: 1,
      borderColor: '#FFA500',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 4,
    },
    activePeriodButton: {
      backgroundColor: '#FFA500',
      borderColor: '#FFA500',
    },
    periodButtonText: {
      color: theme === 'light' ? '#333' : '#e0e0e0',
      fontWeight: '600',
    },
    activePeriodButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    yearButton: {
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#2a2a2a',
      borderWidth: 1,
      borderColor: '#FFA500',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 4,
    },
    activeYearButton: {
      backgroundColor: '#FFA500',
      borderColor: '#FFA500',
    },
    yearButtonText: {
      color: theme === 'light' ? '#333' : '#e0e0e0',
      fontWeight: '600',
    },
    activeYearButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.header, dynamicStyles.header]}>{flow.title} Statistics</Text>
        
        {flow.trackingType === 'Quantitative' ? (
          <StatsQuantitative
            flow={flow}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        ) : flow.trackingType === 'Time-based' ? (
          <StatsTimeBased
            flow={flow}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        ) : (
          <StatsBinary
            flow={flow}
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

export default FlowStatsDetail;
