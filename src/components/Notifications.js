import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const NotificationSettings = ({
  defaultReminderLevel,
  closeTime,
  onUpdateReminderLevel,
  onUpdateCloseTime,
}) => {
  const { theme, textSize, highContrast } = useContext(ThemeContext);
  const [sound, setSound] = useState('default');
  const [vibration, setVibration] = useState(true);
  const [music, setMusic] = useState('none');

  const soundOptions = ['default', 'chime', 'bell', 'none'];
  const musicOptions = ['none', 'calm', 'upbeat'];

  const handleSoundChange = (newSound) => {
    setSound(newSound);
    // TODO: Integrate with notification library (e.g., react-native-push-notification)
  };

  const handleVibrationChange = () => {
    setVibration(!vibration);
    // TODO: Integrate with notification library
  };

  const handleMusicChange = (newMusic) => {
    setMusic(newMusic);
    // TODO: Integrate with notification library
  };

  const handleCloseTimeChange = (time) => {
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      onUpdateCloseTime(time);
    } else {
      onUpdateCloseTime('21:00'); // Fallback to default
    }
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
    optionButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'light' ? '#ccc' : '#444',
      backgroundColor: theme === 'light' ? '#f0f0f0' : '#333',
    },
    selectedOption: {
      backgroundColor: theme === 'light' ? '#007AFF' : '#5856d6',
    },
    optionText: {
      color: theme === 'light' ? '#333' : '#e0e0e0',
      fontSize: textSize === 'small' ? 12 : textSize === 'large' ? 16 : 14,
    },
    selectedOptionText: {
      color: '#fff',
    },
  });

  return (
    <View>
      <View style={styles.settingRow}>
        <Text style={[styles.label, dynamicStyles.label]}>Reminder Level</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          value={defaultReminderLevel}
          onChangeText={onUpdateReminderLevel}
          placeholder="0-3 (None, Low, Medium, High)"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.label, dynamicStyles.label]}>Close Time</Text>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          value={closeTime}
          onChangeText={handleCloseTimeChange}
          placeholder="HH:mm (e.g., 21:00)"
          keyboardType="numeric"
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.label, dynamicStyles.label]}>Sound</Text>
        <View style={styles.optionsContainer}>
          {soundOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                dynamicStyles.optionButton,
                sound === option && dynamicStyles.selectedOption,
              ]}
              onPress={() => handleSoundChange(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  dynamicStyles.optionText,
                  sound === option && dynamicStyles.selectedOptionText,
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.label, dynamicStyles.label]}>Vibration</Text>
        <Switch
          value={vibration}
          onValueChange={handleVibrationChange}
          trackColor={{ false: '#767577', true: '#007AFF' }}
          thumbColor={vibration ? '#fff' : '#f4f3f4'}
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.label, dynamicStyles.label]}>Music</Text>
        <View style={styles.optionsContainer}>
          {musicOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                dynamicStyles.optionButton,
                music === option && dynamicStyles.selectedOption,
              ]}
              onPress={() => handleMusicChange(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  dynamicStyles.optionText,
                  music === option && dynamicStyles.selectedOptionText,
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: 120,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
});

export default NotificationSettings;
