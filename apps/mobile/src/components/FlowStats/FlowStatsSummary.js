import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import { ThemeContext } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const FlowStatsSummary = ({ navigation }) => {
  const { flows } = useContext(FlowsContext) || {};
  const { getScoreboard } = useContext(ActivityContext) || {};
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [flowStats, setFlowStats] = useState({});
  const [selectedYear, setSelectedYear] = useState(moment().year());

  // Load stats for each flow
  useEffect(() => {
    const loadFlowStats = async () => {
      if (!flows || flows.length === 0 || !getScoreboard) return;
      
      const stats = {};
      for (const flow of flows) {
        try {
          const scoreboard = await getScoreboard(flow.id);
          stats[flow.id] = scoreboard;
        } catch (error) {
          console.error(`Failed to load stats for flow ${flow.id}:`, error);
          stats[flow.id] = null;
        }
      }
      setFlowStats(stats);
    };

    loadFlowStats();
  }, [flows, getScoreboard]);

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
        <Text style={[styles.header, dynamicStyles.header]}>Flow Statistics Summary</Text>
        
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

        <View style={styles.statsGrid}>
          {flows.map((flow) => (
            <TouchableOpacity
              key={flow.id}
              style={styles.flowCard}
              onPress={() => navigation.navigate('FlowStatsDetail', { flowId: flow.id })}
            >
              <Text style={[styles.flowTitle, dynamicStyles.header]}>{flow.title}</Text>
              <Text style={[styles.flowType, dynamicStyles.periodButtonText]}>{flow.trackingType}</Text>
              <View style={styles.flowStats}>
                {(() => {
                  const stats = flowStats[flow.id];
                  if (!stats) {
                    return (
                      <>
                        <Text style={[styles.flowStatValue, dynamicStyles.header]}>--</Text>
                        <Text style={[styles.flowStatLabel, dynamicStyles.periodButtonText]}>Loading...</Text>
                      </>
                    );
                  }
                  
                  if (flow.trackingType === 'Binary') {
                    return (
                      <>
                        <Text style={[styles.flowStatValue, dynamicStyles.header]}>
                          {stats.currentStreak || 0} days
                        </Text>
                        <Text style={[styles.flowStatLabel, dynamicStyles.periodButtonText]}>Current Streak</Text>
                      </>
                    );
                  } else if (flow.trackingType === 'Quantitative') {
                    return (
                      <>
                        <Text style={[styles.flowStatValue, dynamicStyles.header]}>
                          {stats.totalPoints || 0}
                        </Text>
                        <Text style={[styles.flowStatLabel, dynamicStyles.periodButtonText]}>Total Value</Text>
                      </>
                    );
                  } else if (flow.trackingType === 'Time-based') {
                    return (
                      <>
                        <Text style={[styles.flowStatValue, dynamicStyles.header]}>
                          {Math.floor((stats.totalPoints || 0) / 3600)}h {Math.floor(((stats.totalPoints || 0) % 3600) / 60)}m
                        </Text>
                        <Text style={[styles.flowStatLabel, dynamicStyles.periodButtonText]}>Total Time</Text>
                      </>
                    );
                  }
                  
                  return (
                    <>
                      <Text style={[styles.flowStatValue, dynamicStyles.header]}>--</Text>
                      <Text style={[styles.flowStatLabel, dynamicStyles.periodButtonText]}>No Data</Text>
                    </>
                  );
                })()}
              </View>
            </TouchableOpacity>
          ))}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  flowCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  flowTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  flowType: {
    marginBottom: 12,
    textAlign: 'center',
  },
  flowStats: {
    alignItems: 'center',
  },
  flowStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 4,
  },
  flowStatLabel: {
    textAlign: 'center',
    fontSize: 12,
  },
});

export default FlowStatsSummary;
