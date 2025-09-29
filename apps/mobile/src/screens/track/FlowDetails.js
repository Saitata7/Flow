import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { FlowsContext } from '../../context/FlowContext';
import { ActivityContext } from '../../context/ActivityContext';
import FlowCalendar from '../../components/flow/FlowCalendar';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { colors, layout, typography } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const FlowDetail = ({ route, navigation }) => {
  const { flowId, initialTab = 'calendar' } = route.params || {};
  const { flows = [], updateFlow = () => {} } = useContext(FlowsContext) || {};
  const { getScoreboard, getActivityStats, getEmotionalActivity, getFlowSummary } = useContext(ActivityContext) || {};
  const { theme = 'light', accentColor = '#007AFF', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [selectedView, setSelectedView] = useState(initialTab === 'calendar' ? 'scoreboard' : initialTab);
  const [chartTimeframe, setChartTimeframe] = useState('weekly'); // Chart-specific timeframe

  // Add scoreboard view
  const renderScoreboardView = () => {
    console.log('FlowDetails: renderScoreboardView - flowId:', flowId);
    console.log('FlowDetails: chartTimeframe:', chartTimeframe);
    const scoreboardData = getScoreboard(flowId);
    console.log('FlowDetails: scoreboardData:', scoreboardData);
    
    return (
      <View>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, dynamicStyles.title]}>Scoreboard</Text>
            <Text style={[styles.detail, dynamicStyles.detail]}>
              Track your scoring and achievements
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreboardStats}>
          <Text style={[styles.statsTitle, dynamicStyles.statsTitle]}>Score Summary</Text>
          <View style={styles.scoreboardGrid}>
            <View style={styles.scoreboardItem}>
              <Text style={[styles.scoreboardValue, { color: themeColors.primaryOrange }]}>
                {scoreboardData.finalScore || 0}
              </Text>
              <Text style={[styles.scoreboardLabel, dynamicStyles.statLabel]}>Final Score</Text>
            </View>
            <View style={styles.scoreboardItem}>
              <Text style={[styles.scoreboardValue, { color: themeColors.success }]}>
                {Math.round(scoreboardData.completionRate || 0)}%
              </Text>
              <Text style={[styles.scoreboardLabel, dynamicStyles.statLabel]}>Completion Rate</Text>
            </View>
            <View style={styles.scoreboardItem}>
              <Text style={[styles.scoreboardValue, { color: themeColors.primaryText }]}>
                {scoreboardData.longestStreak || 0}
              </Text>
              <Text style={[styles.scoreboardLabel, dynamicStyles.statLabel]}>Longest Streak</Text>
            </View>
            <View style={styles.scoreboardItem}>
              <Text style={[styles.scoreboardValue, { color: themeColors.primaryText }]}>
                {scoreboardData.currentStreak || 0}
              </Text>
              <Text style={[styles.scoreboardLabel, dynamicStyles.statLabel]}>Current Streak</Text>
            </View>
            <View style={styles.scoreboardItem}>
              <Text style={[styles.scoreboardValue, { color: themeColors.secondaryText }]}>
                {scoreboardData.emotionBonus || 0}
              </Text>
              <Text style={[styles.scoreboardLabel, dynamicStyles.statLabel]}>Emotion Bonus</Text>
            </View>
            <View style={styles.scoreboardItem}>
              <Text style={[styles.scoreboardValue, { color: themeColors.secondaryText }]}>
                {scoreboardData.notesCount || 0}
              </Text>
              <Text style={[styles.scoreboardLabel, dynamicStyles.statLabel]}>Notes Count</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.scoreboardBreakdown}>
          <Text style={[styles.statsTitle, dynamicStyles.statsTitle]}>Success Rate Analysis</Text>
          {(() => {
            // Use scheduledDays directly from scoreboard data
            const scheduledDays = scoreboardData.scheduledDays || 0;
            const overallSuccessRate = scheduledDays > 0 ? ((scoreboardData.completed || 0) + (scoreboardData.partial || 0)) / scheduledDays * 100 : 0;
            const pureCompletionRate = scheduledDays > 0 ? (scoreboardData.completed || 0) / scheduledDays * 100 : 0;
            const partialSuccessRate = scheduledDays > 0 ? (scoreboardData.partial || 0) / scheduledDays * 100 : 0;
            const failureRate = scheduledDays > 0 ? (scoreboardData.failed || 0) / scheduledDays * 100 : 0;
            const skipRate = scheduledDays > 0 ? (scoreboardData.skipped || 0) / scheduledDays * 100 : 0;
            
            return (
              <>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Overall Success Rate</Text>
                  <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                    {overallSuccessRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Pure Completion Rate</Text>
                  <Text style={[styles.statValue, { color: '#FF9500' }]}>
                    {pureCompletionRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Partial Success Rate</Text>
                  <Text style={[styles.statValue, { color: '#F2A005' }]}>
                    {partialSuccessRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Failure Rate</Text>
                  <Text style={[styles.statValue, { color: '#FF4D4D' }]}>
                    {failureRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Skip Rate</Text>
                  <Text style={[styles.statValue, { color: '#999999' }]}>
                    {skipRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Scheduled Days</Text>
                  <Text style={[styles.statValue, dynamicStyles.statValue]}>
                    {scheduledDays}
                  </Text>
                </View>
              </>
            );
          })()}
        </View>
        
        <View style={styles.scoreboardBreakdown}>
          <Text style={[styles.statsTitle, dynamicStyles.statsTitle]}>Status Breakdown</Text>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Completed</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {scoreboardData.completed || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Partial</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {scoreboardData.partial || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Failed</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {scoreboardData.failed || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Skipped</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {scoreboardData.skipped || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Inactive</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {scoreboardData.inactive || 0}
            </Text>
          </View>
        </View>
        
        {/* Chart-specific timeframe selector - positioned at top of chart */}
        <View style={styles.chartTimeframeSelector}>
          <Text style={[styles.statsTitle, dynamicStyles.statsTitle]}>Chart Timeframe</Text>
          {[
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
            { key: 'yearly', label: 'Yearly' }
          ].map((timeframe) => (
            <TouchableOpacity
              key={timeframe.key}
              style={[
                styles.chartTimeframeButton,
                chartTimeframe === timeframe.key && styles.activeChartTimeframeButton,
                { backgroundColor: chartTimeframe === timeframe.key ? themeColors.primaryOrange : themeColors.cardBackground }
              ]}
              onPress={() => setChartTimeframe(timeframe.key)}
              accessibilityLabel={`Select ${timeframe.label.toLowerCase()} chart timeframe`}
            >
              <Text
                style={[
                  styles.chartTimeframeText,
                  { color: chartTimeframe === timeframe.key ? '#FFFFFF' : themeColors.primaryText }
                ]}
              >
                {timeframe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Performance Chart */}
        <View style={styles.chartSection}>
          {/* Chart container */}
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: chartTimeframe === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                       chartTimeframe === 'monthly' ? ['W1', 'W2', 'W3', 'W4'] :
                       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                  data: chartTimeframe === 'weekly' ? [85, 92, 78, 88, 95, 82, 90] :
                        chartTimeframe === 'monthly' ? [88, 85, 92, 89] :
                        [87, 89, 85, 92, 88, 90],
                  color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
                  strokeWidth: 2
                }]
              }}
              width={screenWidth - 40}
              height={200}
              chartConfig={{
                backgroundColor: themeColors.background,
                backgroundGradientFrom: themeColors.background,
                backgroundGradientTo: themeColors.background,
                decimalPlaces: 0,
                color: (opacity = 1) => `${themeColors.primaryOrange}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
                labelColor: (opacity = 1) => `${themeColors.primaryText}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
                style: {
                  borderRadius: layout.radii.large,
                },
                paddingLeft: 0,
                propsForDots: {
                  r: '3',
                  strokeWidth: '2',
                  stroke: themeColors.primaryOrange,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: themeColors.surface,
                  strokeWidth: 1,
                },
              }}
              bezier
              style={styles.chart}
              withDots={true}
              withShadow={false}
              withInnerLines={false}
              withOuterLines={false}
            />
          </View>
        </View>
        
        <FlowCalendar
          flow={flow}
          onUpdateStatus={handleUpdateStatus}
          onMonthChange={setCurrentMonth}
          currentMonth={currentMonth}
        />
      </View>
    );
  };

  const themeColors = colors[theme] || colors.light;

  console.log('FlowDetails: Received flowId:', flowId);
  console.log('FlowDetails: Available flows:', flows.map(f => ({ id: f.id, title: f.title })));

  const flow = useMemo(() => {
    const foundFlow = flows.find((f) => f.id === flowId && !f.deletedAt && !f.archived) || {};
    console.log('FlowDetails: Found flow:', { id: foundFlow.id, title: foundFlow.title });
    return foundFlow;
  }, [flows, flowId]);

  // Force re-render when flowId changes
  useEffect(() => {
    console.log('FlowDetails: flowId changed, forcing re-render:', flowId);
  }, [flowId]);

  const handleUpdateStatus = useCallback((flowId, dateKey, statusSymbol, emotion, note, currentStatus) => {
    if (!['+', '-', '/'].includes(statusSymbol)) {
      console.warn('Invalid status symbol:', statusSymbol);
      return;
    }

    const trimmedNote = note && typeof note === 'string' && note.trim() ? note.trim() : null;
    const updatedStatus = {
      ...currentStatus,
      [dateKey]: { symbol: statusSymbol, emotion, note: trimmedNote },
    };

    console.log('FlowDetail updating:', { flowId, dateKey, statusSymbol, emotion, note: trimmedNote });
    updateFlow(flowId, { status: updatedStatus })
      .then(() => {
        console.log('FlowDetail status updated:', { dateKey, statusSymbol, note: trimmedNote });
      })
      .catch((error) => {
        console.error('FlowDetail update failed:', error);
      });
  }, [updateFlow]);

  useFocusEffect(
    useCallback(() => {
      console.log('FlowDetail focused:', { flowId, status: flow.status });
    }, [flowId, flow.status])
  );

  const notes = useMemo(() => {
    console.log('Filtering notes for flow:', { flowId, month: moment(currentMonth).format('MMMM YYYY'), status: flow.status });
    return Object.entries(flow.status || {})
      .filter(([date, status]) => status.note && moment(date).isSame(currentMonth, 'month'))
      .map(([date, status]) => ({ date, note: status.note, symbol: status.symbol, emotion: status.emotion }))
      .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()); // Sort by date descending
  }, [flow.status, currentMonth]);

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
    const isCompleted = item.symbol === '+';
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

  // Emotional tracking view
  const renderEmotionalView = () => {
    console.log('FlowDetails: renderEmotionalView - flowId:', flowId);
    const emotionalData = getEmotionalActivity(flowId);
    console.log('FlowDetails: emotionalData:', emotionalData);
    const emotions = ['Happy', 'Sad', 'Angry', 'Excited', 'Calm'];
    
    return (
      <View>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, dynamicStyles.title]}>Emotional Tracking</Text>
            <Text style={[styles.detail, dynamicStyles.detail]}>
              Track your emotional responses to this flow
            </Text>
          </View>
        </View>
        
        <View style={styles.emotionalStats}>
          <Text style={[styles.statsTitle, dynamicStyles.statsTitle]}>Emotion Summary</Text>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Emotions</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {emotionalData.totalEmotions || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Positive</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {emotionalData.positiveCount || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Negative</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {emotionalData.negativeCount || 0}
            </Text>
          </View>
          {emotions.map((emotion) => (
            <View key={emotion} style={styles.emotionRow}>
              <Text style={[styles.emotionLabel, dynamicStyles.emotionLabel]}>{emotion}</Text>
              <Text style={[styles.emotionCount, dynamicStyles.emotionCount]}>
                {emotionalData.byEmotion?.[emotion] || 0}
              </Text>
            </View>
          ))}
        </View>
        
        <FlowCalendar
          flow={flow}
          onUpdateStatus={handleUpdateStatus}
          onMonthChange={setCurrentMonth}
          currentMonth={currentMonth}
        />
      </View>
    );
  };

  // Activity tracking view
  const renderActivityView = () => {
    console.log('FlowDetails: renderActivityView - flowId:', flowId);
    const activityData = getActivityStats(flowId);
    console.log('FlowDetails: activityData:', activityData);
    
    return (
      <View>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, dynamicStyles.title]}>Activity Tracking</Text>
            <Text style={[styles.detail, dynamicStyles.detail]}>
              Monitor your activity patterns and progress
            </Text>
          </View>
        </View>
        
        <View style={styles.activityStats}>
          <Text style={[styles.statsTitle, dynamicStyles.statsTitle]}>Activity Summary</Text>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Days</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {activityData.total || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Completed</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {activityData.byStatus?.Completed || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Partial</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {activityData.byStatus?.Partial || 0}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Missed</Text>
            <Text style={[styles.statValue, dynamicStyles.statValue]}>
              {activityData.byStatus?.Missed || 0}
            </Text>
          </View>
          {(() => {
            // Use total as the denominator since activityData.total represents scheduled days
            const scheduledDays = activityData.total || 0;
            const successRate = scheduledDays > 0 ? ((activityData.byStatus?.Completed || 0) + (activityData.byStatus?.Partial || 0)) / scheduledDays * 100 : 0;
            return (
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Success Rate</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {successRate.toFixed(1)}%
                </Text>
              </View>
            );
          })()}
          {flow.trackingType === 'Time-based' && (
            <>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Duration</Text>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>
                  {activityData.timeBased?.totalDuration || 0} min
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Average Duration</Text>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>
                  {activityData.timeBased?.averageDuration || 0} min
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Pauses</Text>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>
                  {activityData.timeBased?.totalPauses || 0}
                </Text>
              </View>
            </>
          )}
          {flow.trackingType === 'Quantitative' && (
            <>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Total Count</Text>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>
                  {activityData.quantitative?.totalCount || 0} {activityData.quantitative?.unitText || ''}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, dynamicStyles.statLabel]}>Average Count</Text>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>
                  {activityData.quantitative?.averageCount || 0} {activityData.quantitative?.unitText || ''}
                </Text>
              </View>
            </>
          )}
        </View>
        
        <FlowCalendar
          flow={flow}
          onUpdateStatus={handleUpdateStatus}
          onMonthChange={setCurrentMonth}
          currentMonth={currentMonth}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, dynamicStyles.title]}>
            {flow.title || 'Flow'}
          </Text>
          <Text style={[styles.detail, dynamicStyles.detail]}>
            Des- {flow.description || 'No description'}
          </Text>
        </View>
      </View>
      <View style={styles.timeFrequencyRow}>
        {flow.time && (
          <Text style={[styles.detail, dynamicStyles.detail]}>
            Time: {moment(flow.time).local().format('hh:mm A')}
          </Text>
        )}
        <Text style={[styles.detail, dynamicStyles.detail]}>
          Frequency: {flow.repeatType === 'day' ? (flow.everyDay ? 'Every day' : flow.daysOfWeek?.join(', ') || 'Not set') : flow.selectedMonthDays?.join(', ') || 'Not set'}
        </Text>
      </View>
      <FlowCalendar
        flow={flow}
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

  if (!flow.id) {
    return (
      <LinearGradient colors={['#FEDFCD', '#FFFFFF']} style={styles.gradientContainer}>
        <SafeAreaView style={styles.container}>
          <Text style={[styles.noNotes, dynamicStyles.noNotes]}>Flow not found</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#FEDFCD', '#FFFFFF']} style={styles.gradientContainer}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.primaryText} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>{flow.title || 'Flow'}</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>
              {flow.trackingType || 'Flow'} Calendar
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => flow.id && navigation.navigate('EditFlow', { flowId: flow.id })}
            accessibilityLabel="Edit flow"
            accessibilityHint="Modify flow settings and configuration"
            disabled={!flow.id}
          >
            <Ionicons name="create-outline" size={24} color={themeColors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, selectedView === 'scoreboard' && styles.activeTabButton]}
            onPress={() => setSelectedView('scoreboard')}
          >
            <Text style={[styles.tabText, selectedView === 'scoreboard' && styles.activeTabText]}>
              Scoreboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedView === 'activity' && styles.activeTabButton]}
            onPress={() => setSelectedView('activity')}
          >
            <Text style={[styles.tabText, selectedView === 'activity' && styles.activeTabText]}>
              Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedView === 'emotional' && styles.activeTabButton]}
            onPress={() => setSelectedView('emotional')}
          >
            <Text style={[styles.tabText, selectedView === 'emotional' && styles.activeTabText]}>
              Emotional
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedView === 'calendar' && styles.activeTabButton]}
            onPress={() => setSelectedView('calendar')}
          >
            <Text style={[styles.tabText, selectedView === 'calendar' && styles.activeTabText]}>
              Calendar
            </Text>
          </TouchableOpacity>
        </View>

        {selectedView === 'emotional' ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            keyExtractor={() => 'empty'}
            ListHeaderComponent={renderEmotionalView}
            ListEmptyComponent={
              <Text style={[styles.noNotes, dynamicStyles.noNotes]}>No emotional data available</Text>
            }
            contentContainerStyle={styles.contentContainer}
          />
        ) : selectedView === 'activity' ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            keyExtractor={() => 'empty'}
            ListHeaderComponent={renderActivityView}
            ListEmptyComponent={
              <Text style={[styles.noNotes, dynamicStyles.noNotes]}>No activity data available</Text>
            }
            contentContainerStyle={styles.contentContainer}
          />
        ) : selectedView === 'scoreboard' ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            keyExtractor={() => 'empty'}
            ListHeaderComponent={renderScoreboardView}
            ListEmptyComponent={
              <Text style={[styles.noNotes, dynamicStyles.noNotes]}>No scoreboard data available</Text>
            }
            contentContainerStyle={styles.contentContainer}
          />
        ) : (
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
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: layout.spacing.sm,
    marginRight: layout.spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.styles.title2,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  headerSubtitle: {
    ...typography.styles.caption,
    opacity: 0.8,
  },
  editButton: {
    padding: layout.spacing.sm,
    borderRadius: layout.radii.small,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
  emotionalStats: {
    marginBottom: 16,
  },
  activityStats: {
    marginBottom: 16,
  },
  scoreboardStats: {
    marginBottom: 16,
  },
  scoreboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: layout.spacing.sm,
  },
  scoreboardItem: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: layout.radii.base,
    padding: layout.spacing.sm,
    marginBottom: layout.spacing.sm,
    alignItems: 'center',
  },
  scoreboardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: layout.spacing.xs,
  },
  scoreboardLabel: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  scoreboardBreakdown: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  emotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emotionLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  emotionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  chartSection: {
    marginBottom: 16,
  },
  chartTimeframeSelector: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: layout.radii.base,
    padding: layout.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  chartTimeframeButton: {
    width: '100%',
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.radii.small,
    alignItems: 'center',
    marginVertical: layout.spacing.xs,
  },
  activeChartTimeframeButton: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTimeframeText: {
    ...typography.styles.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  chartContainer: {
    backgroundColor: 'transparent',
    borderRadius: layout.radii.base,
    marginBottom: 16,
    alignItems: 'center',
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.radii.large,
  },
  chartPlaceholder: {
    ...typography.styles.body,
    textAlign: 'center',
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: layout.radii.base,
    margin: layout.spacing.sm,
    padding: layout.spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.sm,
    borderRadius: layout.radii.small,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});

export default FlowDetail;
