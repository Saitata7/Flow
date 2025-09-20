import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';

const TimePicker = ({ 
  initialHours = 0, 
  initialMinutes = 0, 
  onTimeChange,
  style 
}) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);

  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(hours, minutes);
    }
  }, [hours, minutes]);

  const formatTime = (value) => {
    return value.toString().padStart(2, '0');
  };

  const incrementHours = () => {
    setHours(prev => (prev + 1) % 24);
  };

  const decrementHours = () => {
    setHours(prev => prev === 0 ? 23 : prev - 1);
  };

  const incrementMinutes = () => {
    setMinutes(prev => (prev + 1) % 60);
  };

  const decrementMinutes = () => {
    setMinutes(prev => prev === 0 ? 59 : prev - 1);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.timeDisplay}>
        <Text style={styles.timeDisplayText}>
          {formatTime(hours)}:{formatTime(minutes)}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        {/* Hours Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Hours</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity style={styles.controlButton} onPress={decrementHours}>
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.controlValue}>{formatTime(hours)}</Text>
            <TouchableOpacity style={styles.controlButton} onPress={incrementHours}>
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Minutes Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Minutes</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity style={styles.controlButton} onPress={decrementMinutes}>
              <Text style={styles.controlButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.controlValue}>{formatTime(minutes)}</Text>
            <TouchableOpacity style={styles.controlButton} onPress={incrementMinutes}>
              <Text style={styles.controlButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Time Presets */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>Quick Presets</Text>
        <View style={styles.presetsRow}>
          <TouchableOpacity 
            style={styles.presetButton} 
            onPress={() => { setHours(0); setMinutes(15); }}
          >
            <Text style={styles.presetButtonText}>15m</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.presetButton} 
            onPress={() => { setHours(0); setMinutes(30); }}
          >
            <Text style={styles.presetButtonText}>30m</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.presetButton} 
            onPress={() => { setHours(1); setMinutes(0); }}
          >
            <Text style={styles.presetButtonText}>1h</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.presetButton} 
            onPress={() => { setHours(2); setMinutes(0); }}
          >
            <Text style={styles.presetButtonText}>2h</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  timeDisplayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  controlGroup: {
    alignItems: 'center',
    flex: 1,
  },
  controlLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 6,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    backgroundColor: '#FF9500',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  presetsContainer: {
    alignItems: 'center',
  },
  presetsLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  presetButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presetButtonText: {
    color: '#1D1D1F',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TimePicker;