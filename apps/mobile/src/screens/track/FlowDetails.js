import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
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
import { colors, layout, typography } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const FlowDetail = ({ route, navigation }) => {
  const { flowId, initialTab = 'calendar' } = route.params || {};
  const { flows = [], updateFlow = () => {}, deleteFlow = () => {} } = useContext(FlowsContext) || {};
  const { getFlowSummary } = useContext(ActivityContext) || {};
  const { theme = 'light', accentColor = '#007AFF', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [showMenu, setShowMenu] = useState(false);

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
    const currentTime = new Date().toISOString();
    const updatedStatus = {
      ...currentStatus,
      [dateKey]: { symbol: statusSymbol, emotion, note: trimmedNote, timestamp: currentTime },
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
      .filter(([date, status]) => {
        const hasNote = status.note && typeof status.note === 'string' && status.note.trim();
        const hasEmotion = status.emotion && typeof status.emotion === 'string' && status.emotion.trim();
        return (hasNote || hasEmotion) && moment(date).isSame(currentMonth, 'month');
      })
      .map(([date, status]) => ({ 
        date, 
        note: status.note, 
        symbol: status.symbol, 
        emotion: status.emotion,
        timestamp: status.timestamp || date // Use timestamp or fallback to date
      }))
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
    
    // Use actual timestamp if available, otherwise use current time for the date
    const creationTime = item.timestamp && item.timestamp !== item.date 
      ? moment(item.timestamp).format('MMMM D - hh:mm A')
      : moment(item.date).format('MMMM D - hh:mm A');

    return (
      <View style={dynamicStyles.noteCard}>
        <View style={dynamicStyles.noteHeader}>
          <Text style={[dynamicStyles.noteDate, !isCompleted && dynamicStyles.noteMissedDate]}>
            {creationTime} {item.emotion ? `- ${item.emotion}` : ''}
          </Text>
          <View style={[dynamicStyles.noteBadge, { backgroundColor: badgeBackground }]}>
            <MaterialCommunityIcons name={badgeIcon} size={16} color={badgeTextColor} />
            <Text style={[dynamicStyles.noteBadgeText, { color: badgeTextColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
        {item.note && <Text style={dynamicStyles.noteText}>{item.note}</Text>}
        {index < notes.length - 1 && <View style={dynamicStyles.divider} />}
      </View>
    );
  }, [dynamicStyles, notes.length]);

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
            style={styles.statsButton}
            onPress={() => navigation.navigate('Stats', { 
              screen: 'FlowStatsDetail', 
              params: { flowId: flow.id } 
            })}
            accessibilityLabel="View flow statistics"
            accessibilityHint="Navigate to detailed statistics page"
            disabled={!flow.id}
          >
            <Ionicons name="bar-chart-outline" size={24} color={themeColors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
            accessibilityLabel="Flow options"
            accessibilityHint="Show edit and delete options"
            disabled={!flow.id}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={themeColors.primaryText} />
          </TouchableOpacity>
        </View>


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

        {/* Options Menu Modal */}
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={[styles.menuContainer, { backgroundColor: themeColors.cardBackground }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('EditFlow', { flowId: flow.id });
                }}
              >
                <Ionicons name="create-outline" size={20} color={themeColors.primaryText} />
                <Text style={[styles.menuItemText, { color: themeColors.primaryText }]}>Edit</Text>
              </TouchableOpacity>
              
              <View style={[styles.menuDivider, { backgroundColor: themeColors.border }]} />
              
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert(
                    'Delete Flow',
                    `Are you sure you want to delete "${flow.title}"? This action cannot be undone.`,
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          if (deleteFlow) {
                            deleteFlow(flow.id);
                            navigation.goBack();
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color={themeColors.error} />
                <Text style={[styles.menuItemText, { color: themeColors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
  menuButton: {
    padding: layout.spacing.sm,
  },
  statsButton: {
    padding: layout.spacing.sm,
    marginRight: layout.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: layout.radii.base,
    paddingVertical: layout.spacing.sm,
    minWidth: 150,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
  },
  menuItemText: {
    ...typography.styles.body,
    marginLeft: layout.spacing.sm,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginVertical: layout.spacing.xs,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Increased bottom padding for tab navigation
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
