// components/FlowItem.js
// Optimized FlowItem component with memoization

import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

const FlowItem = memo(({ 
  flow, 
  index, 
  onPress, 
  onLongPress,
  showStoragePreference = true 
}) => {
  // Memoized handlers to prevent unnecessary re-renders
  const handlePress = useCallback(() => {
    onPress?.(flow);
  }, [onPress, flow]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(flow);
  }, [onLongPress, flow]);

  // Memoized status calculation
  const flowStatus = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const status = flow.status?.[today];
    
    if (!status) return { symbol: null, text: 'Not started' };
    
    if (flow.trackingType === 'Binary') {
      return status.symbol === '✓' 
        ? { symbol: '✓', text: 'Completed', color: '#4CAF50' }
        : { symbol: '✗', text: 'Not completed', color: '#F44336' };
    }
    
    if (flow.trackingType === 'Quantitative') {
      const count = status.quantitative?.count || 0;
      const goal = status.quantitative?.goal || 0;
      return {
        symbol: count,
        text: `${count}/${goal} ${status.quantitative?.unitText || ''}`,
        color: count >= goal ? '#4CAF50' : '#FF9800'
      };
    }
    
    if (flow.trackingType === 'Time-based') {
      const duration = status.timebased?.totalDuration || 0;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return {
        symbol: `${hours}:${minutes.toString().padStart(2, '0')}`,
        text: 'Time tracked',
        color: duration > 0 ? '#4CAF50' : '#F44336'
      };
    }
    
    return { symbol: null, text: 'Unknown', color: '#666' };
  }, [flow.status, flow.trackingType]);

  // Memoized storage preference indicator
  const storageIndicator = useMemo(() => {
    if (!showStoragePreference) return null;
    
    return (
      <View style={styles.storageIndicator}>
        <Ionicons 
          name={flow.storagePreference === 'cloud' ? 'cloud' : 'phone-portrait'} 
          size={12} 
          color={flow.storagePreference === 'cloud' ? '#2196F3' : '#666'} 
        />
      </View>
    );
  }, [flow.storagePreference, showStoragePreference]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff' }]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {flow.title}
          </Text>
          {storageIndicator}
        </View>
        
        {flow.description && (
          <Text style={styles.description} numberOfLines={2}>
            {flow.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusSymbol, { color: flowStatus.color }]}>
              {flowStatus.symbol}
            </Text>
            <Text style={styles.statusText}>
              {flowStatus.text}
            </Text>
          </View>
          
          <View style={styles.metaContainer}>
            <Text style={styles.frequency}>
              {flow.frequency}
            </Text>
            {flow.archived && (
              <Text style={styles.archivedLabel}>
                Archived
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

FlowItem.displayName = 'FlowItem';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  storageIndicator: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequency: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  archivedLabel: {
    fontSize: 10,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default FlowItem;
