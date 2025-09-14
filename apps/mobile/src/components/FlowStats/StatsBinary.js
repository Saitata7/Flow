import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const StatsBinary = ({ flow, selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear }) => {
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [selectedMetric, setSelectedMetric] = useState('streak');

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
    <View style={styles.container}>
      <Text style={[styles.header, dynamicStyles.header]}>Binary Flow Statistics</Text>
      
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            dynamicStyles.periodButton,
            selectedPeriod === 'weekly' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedPeriod('weekly')}
        >
          <Text
            style={[
              styles.periodButtonText,
              dynamicStyles.periodButtonText,
              selectedPeriod === 'weekly' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            dynamicStyles.periodButton,
            selectedPeriod === 'monthly' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedPeriod('monthly')}
        >
          <Text
            style={[
              styles.periodButtonText,
              dynamicStyles.periodButtonText,
              selectedPeriod === 'monthly' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            dynamicStyles.periodButton,
            selectedPeriod === 'yearly' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedPeriod('yearly')}
        >
          <Text
            style={[
              styles.periodButtonText,
              dynamicStyles.periodButtonText,
              selectedPeriod === 'yearly' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Yearly
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.yearSelector}>
        <TouchableOpacity
          style={[
            styles.yearButton,
            dynamicStyles.yearButton,
            selectedYear === moment().year() && dynamicStyles.activeYearButton,
          ]}
          onPress={() => setSelectedYear(moment().year())}
        >
          <Text
            style={[
              styles.yearButtonText,
              dynamicStyles.yearButtonText,
              selectedYear === moment().year() && dynamicStyles.activeYearButtonText,
            ]}
          >
            {moment().year()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.yearButton,
            dynamicStyles.yearButton,
            selectedYear === moment().year() - 1 && dynamicStyles.activeYearButton,
          ]}
          onPress={() => setSelectedYear(moment().year() - 1)}
        >
          <Text
            style={[
              styles.yearButtonText,
              dynamicStyles.yearButtonText,
              selectedYear === moment().year() - 1 && dynamicStyles.activeYearButtonText,
            ]}
          >
            {moment().year() - 1}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricSelector}>
        <TouchableOpacity
          style={[
            styles.metricButton,
            dynamicStyles.periodButton,
            selectedMetric === 'streak' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedMetric('streak')}
        >
          <Text
            style={[
              styles.metricButtonText,
              dynamicStyles.periodButtonText,
              selectedMetric === 'streak' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Streak
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.metricButton,
            dynamicStyles.periodButton,
            selectedMetric === 'completion' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedMetric('completion')}
        >
          <Text
            style={[
              styles.metricButtonText,
              dynamicStyles.periodButtonText,
              selectedMetric === 'completion' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Completion Rate
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, dynamicStyles.header]}>
          {selectedMetric === 'streak' ? 'Current Streak' : 'Completion Rate'}
        </Text>
        <Text style={[styles.statsValue, dynamicStyles.header]}>
          {selectedMetric === 'streak' ? '7 days' : '85%'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  periodButton: {
    marginHorizontal: 4,
  },
  periodButtonText: {
    textAlign: 'center',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  yearButton: {
    marginHorizontal: 4,
  },
  yearButtonText: {
    textAlign: 'center',
  },
  metricSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  metricButton: {
    marginHorizontal: 4,
  },
  metricButtonText: {
    textAlign: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 12,
    marginTop: 20,
  },
  statsText: {
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFA500',
  },
});

export default StatsBinary;
