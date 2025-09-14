import React, { createContext, useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = 'app_settings';

export const ThemeContext = createContext();

const defaultTheme = {
  theme: 'light',
  accentColor: '#007AFF',
  textSize: 'medium',
  highContrast: false,
};

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState(defaultTheme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setThemeSettings({
            theme: parsed.theme || 'light',
            accentColor: parsed.accentColor || '#007AFF',
            textSize: parsed.textSize || 'medium',
            highContrast: parsed.highContrast || false,
          });
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      }
    };
    loadTheme();
  }, []);

  const updateThemeSettings = (updates) => {
    setThemeSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themeSettings.theme,
        accentColor: themeSettings.accentColor,
        textSize: themeSettings.textSize,
        highContrast: themeSettings.highContrast,
        updateThemeSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

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
