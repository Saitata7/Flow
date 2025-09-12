import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, Animated } from 'react-native';
import { ThemeContext } from '../../context/ThemeContext';

const NotificationSettings = ({
  globalNotifications,
  defaultReminderMethod,
  closeTime,
  onUpdateNotifications,
  onUpdateReminderMethod,
  onUpdateCloseTime,
}) => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    console.warn('ThemeContext is undefined.');
    return <Text>Error: ThemeContext not available</Text>;
  }

  const { theme, textSize, highContrast, accentColor } = themeContext;
  const [reminderTime, setReminderTime] = useState(closeTime);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleCloseTimeUpdate = (time) => {
    setReminderTime(time);
    onUpdateCloseTime(time);
  };

  const dynamicStyles = StyleSheet.create({
    label: {
      color: theme === 'light' ? '#333' : '#e0e0e0',
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      fontWeight: highContrast ? '700' : '500',
    },
    text: {
      color: theme === 'light' ? '#666' : '#a0a0a0',
      fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
    },
    button: {
      backgroundColor: highContrast ? '#000' : accentColor || '#007AFF',
      borderWidth: highContrast ? 2 : 0,
      borderColor: highContrast ? '#fff' : 'transparent',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 8,
    },
    buttonText: {
      color: highContrast ? '#fff' : '#fff',
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      fontWeight: '600',
    },
    input: {
      color: theme === 'light' ? '#333' : '#e0e0e0',
      borderColor: theme === 'light' ? '#ccc' : '#444',
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      backgroundColor: theme === 'light' ? '#fff' : '#2a2a2a',
      borderWidth: 1,
      borderRadius: 8,
      padding: 8,
      width: 120,
      textAlign: 'center',
    },
  });

  return (
    <View>
      <View style={styles.settingRow}>
        <Text style={[styles.label, dynamicStyles.label]}>Enable Notifications</Text>
        <Switch
          value={globalNotifications}
          onValueChange={onUpdateNotifications}
          trackColor={{ false: '#767577', true: accentColor }}
          thumbColor={globalNotifications ? '#fff' : '#f4f3f4'}
        />
      </View>
      {globalNotifications && (
        <>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Reminder Method</Text>
            <View style={styles.textSizeOptions}>
              {['notification', 'email', 'none'].map((method) => (
                <TouchableOpacity
                  key={method}
                  onPress={() => onUpdateReminderMethod(method)}
                  style={[
                    styles.textSizeButton,
                    defaultReminderMethod === method && {
                      backgroundColor: accentColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.text,
                      dynamicStyles.text,
                      defaultReminderMethod === method && { color: '#fff' },
                    ]}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Reminder Time</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={reminderTime}
              onChangeText={handleCloseTimeUpdate}
              placeholder="e.g., 21:00"
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.label, dynamicStyles.label]}>Motivation Nudges</Text>
            <Switch
              value={globalNotifications}
              onValueChange={onUpdateNotifications}
              trackColor={{ false: '#767577', true: accentColor }}
              thumbColor={globalNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '500',
    flex: 1,
  },
  text: {
    marginVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 120,
    textAlign: 'center',
  },
  textSizeOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  textSizeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default NotificationSettings;