// screens/settings/CheatModeSettings.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import Button from '../../components/common/Button';

const CheatModeSettings = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const { 
    settings, 
    loading, 
    error, 
    updating, 
    updateSettings 
  } = useSettings();

  const [cheatData, setCheatData] = useState({
    cheatMode: false,
    highlightDayStreak: true,
    debugMode: false,
    showHiddenFeatures: false,
    testData: ''
  });

  // Initialize cheat data when settings load
  useEffect(() => {
    if (settings) {
      setCheatData({
        cheatMode: settings.cheatMode || false,
        highlightDayStreak: settings.highlightDayStreak ?? true,
        debugMode: settings.debugMode || false,
        showHiddenFeatures: settings.showHiddenFeatures || false,
        testData: settings.testData || ''
      });
    }
  }, [settings]);

  const handleToggleChange = (field, value) => {
    setCheatData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(cheatData);
      Alert.alert('Success', 'Cheat mode settings updated successfully!');
    } catch (error) {
      console.error('Error saving cheat mode settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleResetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all habits, settings, and account data. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement data reset
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              console.error('Failed to reset data:', error);
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.progressBackground,
    },
    headerTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
    },
    backButton: {
      padding: 8,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 16,
    },
    toggleItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    toggleLabel: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryText,
      flex: 1,
    },
    toggleDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginTop: 4,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.progressBackground,
      borderRadius: 8,
      padding: 12,
      fontSize: typography.sizes.body,
      color: themeColors.primaryText,
      backgroundColor: themeColors.background,
      height: 80,
      textAlignVertical: 'top',
    },
    saveButton: {
      marginTop: 24,
      marginBottom: 16,
    },
    dangerSection: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: themeColors.error,
    },
    dangerTitle: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.error,
      marginBottom: 16,
    },
    dangerButton: {
      backgroundColor: themeColors.error,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    dangerButtonText: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: '#fff',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  if (loading && !settings) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={themeColors.primaryText} 
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Cheat Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Developer Options */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Developer Options</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Cheat Mode</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Enable cheat mode for testing and development
              </Text>
            </View>
            <Switch
              value={cheatData.cheatMode}
              onValueChange={(value) => handleToggleChange('cheatMode', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={cheatData.cheatMode ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Debug Mode</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Show debug information and logs
              </Text>
            </View>
            <Switch
              value={cheatData.debugMode}
              onValueChange={(value) => handleToggleChange('debugMode', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={cheatData.debugMode ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Show Hidden Features</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Display experimental and hidden features
              </Text>
            </View>
            <Switch
              value={cheatData.showHiddenFeatures}
              onValueChange={(value) => handleToggleChange('showHiddenFeatures', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={cheatData.showHiddenFeatures ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* UI Options */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>UI Options</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Highlight Day Streak</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Emphasize consecutive day achievements
              </Text>
            </View>
            <Switch
              value={cheatData.highlightDayStreak}
              onValueChange={(value) => handleToggleChange('highlightDayStreak', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={cheatData.highlightDayStreak ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Test Data */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Test Data</Text>
          
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Test Data JSON</Text>
            <TextInput
              style={dynamicStyles.input}
              value={cheatData.testData}
              onChangeText={(text) => handleToggleChange('testData', text)}
              placeholder="Enter test data as JSON..."
              placeholderTextColor={themeColors.secondaryText}
              multiline
            />
          </View>
        </View>

        {/* Save Button */}
        <Button
          title={updating ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          variant="primary"
          style={dynamicStyles.saveButton}
          disabled={updating}
        />

        {/* Danger Zone */}
        <View style={dynamicStyles.dangerSection}>
          <Text style={dynamicStyles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={dynamicStyles.dangerButton}
            onPress={handleResetAllData}
          >
            <Text style={dynamicStyles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CheatModeSettings;
