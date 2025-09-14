// screens/settings/LocationSettings.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import Button from '../../components/common/Button';

const LocationSettings = () => {
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

  const [locationData, setLocationData] = useState({
    enabled: false,
    precision: 'city',
    shareLocation: false
  });

  // Initialize location data when settings load
  useEffect(() => {
    if (settings?.location) {
      setLocationData({
        enabled: settings.location.enabled || false,
        precision: settings.location.precision || 'city',
        shareLocation: settings.location.shareLocation || false
      });
    }
  }, [settings]);

  const handleToggleChange = (field, value) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrecisionChange = (precision) => {
    setLocationData(prev => ({
      ...prev,
      precision
    }));
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        location: locationData
      });
      Alert.alert('Success', 'Location settings updated successfully!');
    } catch (error) {
      console.error('Error saving location settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
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
    precisionOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    precisionButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.progressBackground,
    },
    precisionButtonActive: {
      backgroundColor: themeColors.primaryOrange,
      borderColor: themeColors.primaryOrange,
    },
    precisionText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryText,
    },
    precisionTextActive: {
      color: '#fff',
    },
    saveButton: {
      marginTop: 24,
      marginBottom: 16,
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
        <Text style={dynamicStyles.headerTitle}>Location Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Services */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Location Services</Text>
          
          <View style={dynamicStyles.toggleItem}>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.toggleLabel}>Enable Location</Text>
              <Text style={dynamicStyles.toggleDescription}>
                Allow the app to access your location for context-aware features
              </Text>
            </View>
            <Switch
              value={locationData.enabled}
              onValueChange={(value) => handleToggleChange('enabled', value)}
              trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
              thumbColor={locationData.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {locationData.enabled && (
            <>
              <View style={{ marginTop: 16 }}>
                <Text style={dynamicStyles.toggleLabel}>Location Precision</Text>
                <Text style={dynamicStyles.toggleDescription}>
                  How precise should location tracking be?
                </Text>
                <View style={dynamicStyles.precisionOptions}>
                  {[
                    { key: 'city', label: 'City' },
                    { key: 'neighborhood', label: 'Neighborhood' },
                    { key: 'exact', label: 'Exact' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => handlePrecisionChange(option.key)}
                      style={[
                        dynamicStyles.precisionButton,
                        locationData.precision === option.key && dynamicStyles.precisionButtonActive
                      ]}
                    >
                      <Text
                        style={[
                          dynamicStyles.precisionText,
                          locationData.precision === option.key && dynamicStyles.precisionTextActive
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={dynamicStyles.toggleItem}>
                <View style={{ flex: 1 }}>
                  <Text style={dynamicStyles.toggleLabel}>Share Location</Text>
                  <Text style={dynamicStyles.toggleDescription}>
                    Allow others to see your general location
                  </Text>
                </View>
                <Switch
                  value={locationData.shareLocation}
                  onValueChange={(value) => handleToggleChange('shareLocation', value)}
                  trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                  thumbColor={locationData.shareLocation ? '#fff' : '#f4f3f4'}
                />
              </View>
            </>
          )}
        </View>

        {/* Save Button */}
        <Button
          title={updating ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          variant="primary"
          style={dynamicStyles.saveButton}
          disabled={updating}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default LocationSettings;
