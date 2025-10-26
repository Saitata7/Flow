// components/FlowList.js
// Optimized FlowList component with performance improvements

import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useFlows } from '../context/FlowContext';
import FlowItem from './FlowItem';

const FlowList = memo(({ 
  flows = [], 
  onFlowPress, 
  onFlowLongPress,
  showArchived = false,
  showDeleted = false,
  filterByPlan = null,
  filterByTag = null,
  ...props 
}) => {
  // Memoized filtered flows to prevent unnecessary recalculations
  const filteredFlows = useMemo(() => {
    let filtered = flows;

    // Apply filters
    if (!showArchived) {
      filtered = filtered.filter(flow => !flow.archived);
    }
    
    if (!showDeleted) {
      filtered = filtered.filter(flow => !flow.deletedAt);
    }
    
    if (filterByPlan) {
      filtered = filtered.filter(flow => flow.planId === filterByPlan);
    }
    
    if (filterByTag) {
      filtered = filtered.filter(flow => 
        flow.tags && flow.tags.includes(filterByTag)
      );
    }

    return filtered;
  }, [flows, showArchived, showDeleted, filterByPlan, filterByTag]);

  // Memoized render item to prevent unnecessary re-renders
  const renderFlowItem = useCallback(({ item: flow, index }) => (
    <FlowItem
      flow={flow}
      index={index}
      onPress={() => onFlowPress?.(flow)}
      onLongPress={() => onFlowLongPress?.(flow)}
    />
  ), [onFlowPress, onFlowLongPress]);

  // Memoized key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // Memoized getItemLayout for better performance (if all items have same height)
  const getItemLayout = useCallback((data, index) => ({
    length: 80, // Estimated item height
    offset: 80 * index,
    index,
  }), []);

  // Empty component
  const EmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No flows found</Text>
    </View>
  ), []);

  return (
    <FlatList
      data={filteredFlows}
      renderItem={renderFlowItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ListEmptyComponent={EmptyComponent}
      
      // Performance optimizations
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={10}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={50}
      
      // Memory optimizations
      legacyImplementation={false}
      
      {...props}
    />
  );
});

FlowList.displayName = 'FlowList';

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default FlowList;
