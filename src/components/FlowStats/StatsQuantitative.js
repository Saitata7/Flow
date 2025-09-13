import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const StatsQuantitative = ({ flow, selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear }) => {
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [selectedMetric, setSelectedMetric] = useState('total');

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
      <Text style={[styles.header, dynamicStyles.header]}>Quantitative Flow Statistics</Text>
      
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
            selectedMetric === 'total' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedMetric('total')}
        >
          <Text
            style={[
              styles.metricButtonText,
              dynamicStyles.periodButtonText,
              selectedMetric === 'total' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Total
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.metricButton,
            dynamicStyles.periodButton,
            selectedMetric === 'average' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedMetric('average')}
        >
          <Text
            style={[
              styles.metricButtonText,
              dynamicStyles.periodButtonText,
              selectedMetric === 'average' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Average
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.metricButton,
            dynamicStyles.periodButton,
            selectedMetric === 'trend' && dynamicStyles.activePeriodButton,
          ]}
          onPress={() => setSelectedMetric('trend')}
        >
          <Text
            style={[
              styles.metricButtonText,
              dynamicStyles.periodButtonText,
              selectedMetric === 'trend' && dynamicStyles.activePeriodButtonText,
            ]}
          >
            Trend
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, dynamicStyles.header]}>
          {selectedMetric === 'total' ? 'Total Value' : selectedMetric === 'average' ? 'Average Value' : 'Trend'}
        </Text>
        <Text style={[styles.statsValue, dynamicStyles.header]}>
          {selectedMetric === 'total' ? '1,250' : selectedMetric === 'average' ? '45.2' : '+12%'}
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

export default StatsQuantitative;
