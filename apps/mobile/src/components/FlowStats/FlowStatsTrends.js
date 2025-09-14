import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const FlowStatsTrends = ({ navigation }) => {
  const { flows } = useContext(FlowsContext) || {};
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedYear, setSelectedYear] = useState(moment().year());

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

  if (!flows || flows.length === 0) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <Text style={[styles.errorText, dynamicStyles.errorText]}>No flows available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.header, dynamicStyles.header]}>Flow Trends Analysis</Text>
        
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

        <View style={styles.trendsContainer}>
          <Text style={[styles.trendsTitle, dynamicStyles.header]}>Overall Trends</Text>
          
          <View style={styles.trendCard}>
            <Text style={[styles.trendLabel, dynamicStyles.periodButtonText]}>Consistency Score</Text>
            <Text style={[styles.trendValue, dynamicStyles.header]}>85%</Text>
            <Text style={[styles.trendChange, dynamicStyles.periodButtonText]}>+5% from last period</Text>
          </View>

          <View style={styles.trendCard}>
            <Text style={[styles.trendLabel, dynamicStyles.periodButtonText]}>Total Flows</Text>
            <Text style={[styles.trendValue, dynamicStyles.header]}>{flows.length}</Text>
            <Text style={[styles.trendChange, dynamicStyles.periodButtonText]}>+2 new flows</Text>
          </View>

          <View style={styles.trendCard}>
            <Text style={[styles.trendLabel, dynamicStyles.periodButtonText]}>Average Streak</Text>
            <Text style={[styles.trendValue, dynamicStyles.header]}>12 days</Text>
            <Text style={[styles.trendChange, dynamicStyles.periodButtonText]}>+3 days improvement</Text>
          </View>
        </View>
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
    marginBottom: 24,
  },
  yearButton: {
    marginHorizontal: 4,
  },
  yearButtonText: {
    textAlign: 'center',
  },
  trendsContainer: {
    marginTop: 20,
  },
  trendsTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  trendCard: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  trendLabel: {
    marginBottom: 8,
    textAlign: 'center',
  },
  trendValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 4,
  },
  trendChange: {
    textAlign: 'center',
    fontSize: 14,
    color: '#4CAF50',
  },
});

export default FlowStatsTrends;
