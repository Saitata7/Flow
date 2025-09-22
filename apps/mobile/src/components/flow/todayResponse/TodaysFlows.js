import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FlowsContext } from '../../../context/FlowContext';
import moment from 'moment';
import ResponseModal from './Response';
import UnifiedFlowCard from './UnifiedFlowCard';

const TodaysFlows = ({ visibleFlows }) => {
  const { updateFlow, updateCount, updateTimeBased } = useContext(FlowsContext) || {};
  
  console.log('TodaysFlows: Received flows:', visibleFlows?.map(f => ({ id: f.id, title: f.title })) || 'No flows');
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [note, setNote] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const isUpdating = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);


  const updateFlowStatus = useCallback((flowId, dateKey, statusSymbol, emotion = null, note = null, reset = false) => {
    if (!['✅', '❌', '-'].includes(statusSymbol)) {
      return;
    }

    const trimmedNote = note && typeof note === 'string' && note.trim() ? note.trim() : null;
    
    
    if (updateFlow) {
      const currentFlow = visibleFlows.find(f => f.id === flowId);
      if (currentFlow) {
        const newStatus = { ...currentFlow.status };
        if (reset) {
          newStatus[dateKey] = {
            symbol: '-',
            emotion: null,
            note: null,
            timestamp: null,
            quantitative: currentFlow.trackingType === 'Quantitative' ? { unitText: newStatus[dateKey]?.quantitative?.unitText || '', count: 0 } : null,
            timebased: currentFlow.trackingType === 'Time-based' ? {
              hours: newStatus[dateKey]?.timebased?.hours || 0,
              minutes: newStatus[dateKey]?.timebased?.minutes || 0,
              seconds: newStatus[dateKey]?.timebased?.seconds || 0,
              time: { start0: null, break: null, start1: null, stop: null },
              totalDuration: 0
            } : null
          };
        } else {
          newStatus[dateKey] = {
            ...newStatus[dateKey],
            symbol: statusSymbol,
            emotion,
            note: trimmedNote,
            timestamp: new Date().toISOString()
          };
        }
        updateFlow(flowId, { status: newStatus });
        setRefreshKey(prev => prev + 1);
      }
    }
  }, [updateFlow, visibleFlows]);

  const handleCountChange = useCallback((flow, action, count) => {
    if (isUpdating.current) {
      return;
    }
    isUpdating.current = true;

    const todayKey = moment().format('YYYY-MM-DD');

    updateCount(flow.id, todayKey, action);
    if (action === '+' && count > 0) {
      const currentFlow = visibleFlows.find(f => f.id === flow.id);
      const newStatus = { ...currentFlow.status };
      newStatus[todayKey] = {
        ...newStatus[todayKey],
        quantitative: { ...newStatus[todayKey]?.quantitative, count },
        symbol: '+'
      };
      updateFlow(flow.id, { status: newStatus });
    }
    setRefreshKey(prev => prev + 1);
    isUpdating.current = false;
  }, [updateCount, updateFlow, visibleFlows]);

  const handleTimeUpdate = useCallback((flow) => {
    if (isUpdating.current) {
      return;
    }
    isUpdating.current = true;

    const todayKey = moment().format('YYYY-MM-DD');

    const currentStatus = flow.status?.[todayKey] || {};
    const timebased = currentStatus.timebased || {
      hours: flow.status?.[todayKey]?.timebased?.hours || 0,
      minutes: flow.status?.[todayKey]?.timebased?.minutes || 0,
      seconds: flow.status?.[todayKey]?.timebased?.seconds || 0,
      time: { start0: null, break: null, start1: null, stop: null },
      totalDuration: 0
    };

    const now = new Date().toISOString();
    let timeUpdate = { ...timebased.time };

    if (!timeUpdate.start0) {
      timeUpdate.start0 = now;
    } else if (!timeUpdate.break) {
      timeUpdate.break = now;
    } else if (!timeUpdate.start1) {
      timeUpdate.start1 = now;
    } else if (!timeUpdate.stop) {
      timeUpdate.stop = now;
    }

    updateTimeBased(flow.id, todayKey, { timeUpdate });
    setRefreshKey(prev => prev + 1);
    isUpdating.current = false;
  }, [updateTimeBased]);

  const handleAction = useCallback((flow, statusSymbol, openNoteInput = false, reset = false) => {
    if (isUpdating.current) {
      return;
    }
    isUpdating.current = true;

    const todayKey = moment().format('YYYY-MM-DD');

    setSelectedFlow(flow);
    setPendingStatus(statusSymbol);
    setNote(flow.status?.[todayKey]?.note || '');
    setSelectedEmotion(null);

    if (reset) {
      updateFlowStatus(flow.id, todayKey, statusSymbol, null, null, true);
      isUpdating.current = false;
    } else {
      setShowResponseModal(true);
      isUpdating.current = false;
    }
  }, [updateFlowStatus]);

  const handleResponseSubmit = useCallback(() => {
    if (!selectedFlow || !pendingStatus) {
      return;
    }

    const todayKey = moment().format('YYYY-MM-DD');
    updateFlowStatus(selectedFlow.id, todayKey, pendingStatus, selectedEmotion?.label, note);
    resetState();
  }, [selectedFlow, pendingStatus, selectedEmotion, note, updateFlowStatus]);

  const handleSkip = useCallback(() => {
    if (!selectedFlow || !pendingStatus) {
      return;
    }

    const todayKey = moment().format('YYYY-MM-DD');
    updateFlowStatus(selectedFlow.id, todayKey, pendingStatus, selectedEmotion?.label, note.trim() || null);
    resetState();
  }, [selectedFlow, pendingStatus, selectedEmotion, note, updateFlowStatus]);

  const resetState = useCallback(() => {
    setShowResponseModal(false);
    setNote('');
    setSelectedEmotion(null);
    setSelectedFlow(null);
    setPendingStatus(null);
    isUpdating.current = false;
  }, []);

  const sortedFlows = [...visibleFlows].sort((a, b) => {
    const todayKey = moment().format('YYYY-MM-DD');
    const statusA = a.status?.[todayKey]?.symbol || '-';
    const statusB = b.status?.[todayKey]?.symbol || '-';
    
    // Check if tasks are completed (any completion status)
    const isCompletedA = ['✅', '✓', '+', '❌'].includes(statusA);
    const isCompletedB = ['✅', '✓', '+', '❌'].includes(statusB);
    
    // Rule 1: Completed tasks go to bottom
    if (isCompletedA && !isCompletedB) return 1; // A goes after B
    if (!isCompletedA && isCompletedB) return -1; // A goes before B
    
    // Rule 2: For incomplete tasks, sort by time (nearest time first)
    if (!isCompletedA && !isCompletedB) {
      const getTimeForFlow = (flow) => {
        // Check for reminder time first
        if (flow.reminderTime) {
          return moment(flow.reminderTime);
        }
        // Check for habit time (if it's a time-based flow)
        if (flow.trackingType === 'Time-based' && flow.hours !== undefined) {
          const today = moment().format('YYYY-MM-DD');
          const timeString = `${String(flow.hours || 0).padStart(2, '0')}:${String(flow.minutes || 0).padStart(2, '0')}:${String(flow.seconds || 0).padStart(2, '0')}`;
          return moment(`${today} ${timeString}`);
        }
        return null;
      };
      
      const timeA = getTimeForFlow(a);
      const timeB = getTimeForFlow(b);
      
      // If both have times, sort by nearest time
      if (timeA && timeB) {
        return timeA.diff(moment()) - timeB.diff(moment());
      }
      // If only A has time, A goes first
      if (timeA && !timeB) return -1;
      // If only B has time, B goes first
      if (!timeA && timeB) return 1;
      // If neither has time, maintain original order
    }
    
    // Rule 3: For completed tasks, maintain original order (already at bottom)
    return 0;
  });
  
  console.log('TodaysFlows: Sorted flows:', sortedFlows.map(f => ({ id: f.id, title: f.title })));

  if (!visibleFlows || visibleFlows.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No flows for today</Text>
      </View>
    );
  }

  return (
    <View >
      {sortedFlows.map((flow) => {
        const key = `${flow.id}-${flow.status?.[moment().format('YYYY-MM-DD')]?.symbol || '-'}-${refreshKey}`;
        return (
          <UnifiedFlowCard
            key={key}
            flow={flow}
          />
        );
      })}
      <ResponseModal
        visible={showResponseModal}
        onClose={resetState}
        onSubmit={handleResponseSubmit}
        onSkip={handleSkip}
        title={pendingStatus === '✅' ? 'How was today\'s flow?' : 'Why did you miss this flow today?'}
        note={note}
        setNote={setNote}
        selectedEmotion={selectedEmotion}
        setSelectedEmotion={setSelectedEmotion}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 28,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default TodaysFlows;
