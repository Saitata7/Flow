import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../context/ThemeContext';

const HABITS_STORAGE_KEY = 'habits';

const ImportExport = ({ setHabits }) => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    console.warn('ThemeContext is undefined.');
    return <Text>Error: ThemeContext not available</Text>;
  }

  const { theme, textSize, highContrast, accentColor } = themeContext;
  const [importJson, setImportJson] = useState('');
  const [exportJson, setExportJson] = useState('');
  const [showImportInput, setShowImportInput] = useState(false);
  const [showExportOutput, setShowExportOutput] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const exportHabits = async (format = 'json') => {
    try {
      const habitsData = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      if (!habitsData) {
        Alert.alert('Info', 'No habits to export');
        return;
      }
      if (format === 'json') {
        setExportJson(habitsData);
        setShowExportOutput(true);
        Alert.alert('Success', 'Habits JSON data is displayed below. Copy it manually.');
      } else if (format === 'csv') {
        const habits = JSON.parse(habitsData);
        const csv = [
          'id,title,repeatType,goal,completed',
          ...habits.map((habit) => `${habit.id},${habit.title},${habit.repeatType},${habit.goal || ''},${habit.status?.completed || false}`),
        ].join('\n');
        setExportJson(csv);
        setShowExportOutput(true);
        Alert.alert('Success', 'Habits CSV data is displayed below. Copy it manually.');
      } else if (format === 'pdf') {
        Alert.alert('Info', 'PDF export is not supported in this version.');
      }
    } catch (e) {
      console.error('Failed to export habits:', e);
      Alert.alert('Error', 'Failed to export habits');
    }
  };

  const importHabits = async () => {
    if (!importJson) {
      Alert.alert('Error', 'Please paste the habits data');
      return;
    }
    try {
      let parsedData;
      if (importJson.includes('\n')) { // Assume CSV if multiline
        const lines = importJson.split('\n').slice(1); // Skip header
        parsedData = lines.map((line) => {
          const [id, title, repeatType, goal, completed] = line.split(',');
          return { id, title, repeatType, goal: goal || undefined, status: { completed: completed === 'true' } };
        });
      } else {
        parsedData = JSON.parse(importJson);
      }
      if (!Array.isArray(parsedData)) {
        Alert.alert('Error', 'Invalid habits data: Must be an array');
        return;
      }
      const validHabits = parsedData.filter((habit) =>
        habit.id &&
        habit.title &&
        ['day', 'month'].includes(habit.repeatType) &&
        (habit.status ? typeof habit.status === 'object' : true)
      );
      if (validHabits.length === 0) {
        Alert.alert('Error', 'No valid habits found in the data');
        return;
      }
      const currentHabits = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      const mergedHabits = currentHabits
        ? [...JSON.parse(currentHabits), ...validHabits]
        : validHabits;
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(mergedHabits));
      setHabits(mergedHabits);
      setImportJson('');
      setShowImportInput(false);
      Alert.alert('Success', 'Habits imported successfully');
    } catch (e) {
      console.error('Failed to import habits:', e);
      Alert.alert('Error', 'Invalid data format or failed to import habits');
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
      padding: 12,
      height: 100,
      textAlignVertical: 'top',
      marginBottom: 12,
    },
  });

  return (
    <View style={styles.importContainer}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.button, dynamicStyles.button]}
          onPress={() => exportHabits('json')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Export JSON</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.button, dynamicStyles.button]}
          onPress={() => exportHabits('csv')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Export CSV</Text>
        </TouchableOpacity>
      </Animated.View>
      {showExportOutput && (
        <View style={styles.importContainer}>
          <Text style={[styles.label, dynamicStyles.label]}>Copy this data:</Text>
          <TextInput
            style={[styles.importInput, dynamicStyles.input]}
            value={exportJson}
            editable={false}
            multiline
            selectTextOnFocus
          />
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.button, dynamicStyles.button]}
              onPress={() => setShowExportOutput(false)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.button, dynamicStyles.button]}
          onPress={() => setShowImportInput(!showImportInput)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
            {showImportInput ? 'Cancel Import' : 'Import Habits'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      {showImportInput && (
        <View style={styles.importContainer}>
          <Text style={[styles.label, dynamicStyles.label]}>Paste Habits Data (JSON or CSV)</Text>
          <TextInput
            style={[styles.importInput, dynamicStyles.input]}
            value={importJson}
            onChangeText={setImportJson}
            placeholder="Paste JSON or CSV data here"
            multiline
          />
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.button, dynamicStyles.button]}
              onPress={importHabits}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Import</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  importContainer: {
    marginVertical: 12,
  },
  importInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
  label: {
    fontWeight: '500',
    marginBottom: 8,
  },
});

export default ImportExport;