import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../context/ThemeContext';

const FLOWS_STORAGE_KEY = 'flows';

const ImportExport = ({ setFlows }) => {
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

  const exportFlows = async (format = 'json') => {
    try {
      const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      if (!flowsData) {
        Alert.alert('Info', 'No flows to export');
        return;
      }
      if (format === 'json') {
        setExportJson(flowsData);
        setShowExportOutput(true);
        Alert.alert('Success', 'Flows JSON data is displayed below. Copy it manually.');
      } else if (format === 'csv') {
        const flows = JSON.parse(flowsData);
        const csv = [
          'id,title,repeatType,goal,completed',
          ...flows.map((flow) => `${flow.id},${flow.title},${flow.repeatType},${flow.goal || ''},${flow.status?.completed || false}`),
        ].join('\n');
        setExportJson(csv);
        setShowExportOutput(true);
        Alert.alert('Success', 'Flows CSV data is displayed below. Copy it manually.');
      } else if (format === 'pdf') {
        Alert.alert('Info', 'PDF export is not supported in this version.');
      }
    } catch (e) {
      console.error('Failed to export flows:', e);
      Alert.alert('Error', 'Failed to export flows');
    }
  };

  const importFlows = async () => {
    if (!importJson) {
      Alert.alert('Error', 'Please paste the flows data');
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
        Alert.alert('Error', 'Invalid flows data: Must be an array');
        return;
      }
      const validFlows = parsedData.filter((flow) =>
        flow.id &&
        flow.title &&
        ['day', 'month'].includes(flow.repeatType) &&
        (flow.status ? typeof flow.status === 'object' : true)
      );
      if (validFlows.length === 0) {
        Alert.alert('Error', 'No valid flows found in the data');
        return;
      }
      const currentFlows = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      const mergedFlows = currentFlows
        ? [...JSON.parse(currentFlows), ...validFlows]
        : validFlows;
      await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(mergedFlows));
      setFlows(mergedFlows);
      setImportJson('');
      setShowImportInput(false);
      Alert.alert('Success', 'Flows imported successfully');
    } catch (e) {
      console.error('Failed to import flows:', e);
      Alert.alert('Error', 'Invalid data format or failed to import flows');
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
          onPress={() => exportFlows('json')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Export JSON</Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.button, dynamicStyles.button]}
          onPress={() => exportFlows('csv')}
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
              onPress={importFlows}
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