import React, { useContext } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

const ColorPicker = ({ onSelectColor, onClose }) => {
  const { accentColor } = useContext(ThemeContext);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const colors = ['#007AFF', '#28a745', '#dc3545', '#ff9500', '#5856d6'];

  return (
    <View style={styles.colorPicker}>
      {colors.map((color) => (
        <Animated.View
          key={color}
          style={{ transform: [{ scale: scaleAnim }] }}
        >
          <TouchableOpacity
            onPress={() => onSelectColor(color)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              accentColor === color && styles.selectedColor,
            ]}
          />
        </Animated.View>
      ))}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
    gap: 12,
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  selectedColor: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#666',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ColorPicker;