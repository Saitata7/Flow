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
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { FlowsContext } from '../../context/FlowContext';
import { useSettings } from '../../hooks/useSettings';
import Button from '../../components/common/Button';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const CheatModeSettings = ({ route }) => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  // Get highlight flow from navigation params
  const highlightFlow = route?.params?.highlightFlow;
  
  const { 
    settings, 
    loading, 
    error, 
    updating, 
    updateSettings 
  } = useSettings();

  const { flows = [], updateFlow } = useContext(FlowsContext) || {};

  const [cheatData, setCheatData] = useState({
    highlightDayStreak: true
  });

  // Initialize cheat data when settings load
  useEffect(() => {
    if (settings) {
      setCheatData({
        highlightDayStreak: settings.highlightDayStreak ?? true
      });
    }
  }, [settings]);

  const handleToggleChange = (field, value) => {
    setCheatData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFlowCheatModeToggle = async (flowId, cheatMode) => {
    try {
      if (updateFlow) {
        await updateFlow(flowId, { cheatMode });
        Alert.alert('Success', 'Flow cheat mode updated successfully!');
      }
    } catch (error) {
      console.error('Error updating flow cheat mode:', error);
      Alert.alert('Error', 'Failed to update flow cheat mode. Please try again.');
    }
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
      borderBottomColor: themeColors.border,
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
      borderColor: themeColors.border,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureDescription: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      lineHeight: 22,
      marginBottom: 16,
    },
    benefitsList: {
      marginTop: 8,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    benefitText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.primaryText,
      marginLeft: 8,
      flex: 1,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      marginTop: 12,
      marginBottom: 4,
    },
    emptySubtext: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
    },
    flowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    flowInfo: {
      flex: 1,
      marginRight: 16,
    },
    flowTitle: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 4,
    },
    flowDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      lineHeight: 18,
      marginBottom: 6,
    },
    cheatModeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.warning,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    cheatModeText: {
      fontSize: typography.sizes.caption2,
      color: '#fff',
      marginLeft: 3,
      fontWeight: typography.weights.medium,
    },
    highlightBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.warningBackground || '#FFF7ED',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    highlightText: {
      fontSize: typography.sizes.caption2,
      marginLeft: 3,
      fontWeight: typography.weights.medium,
    },
    flowControls: {
      flexDirection: 'row',
      alignItems: 'center',
    }
  });

  if (loading && !settings) {
    return (
      <SafeAreaWrapper style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          style={dynamicStyles.backButton}
          onPress={() => navigation.navigate('Home')}
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
        {/* Feature Explanation */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.featureHeader}>
            <Ionicons name="bulb-outline" size={24} color={themeColors.primaryOrange} />
            <Text style={dynamicStyles.sectionTitle}>What is Cheat Mode?</Text>
          </View>
          
          <Text style={dynamicStyles.featureDescription}>
            Cheat Mode allows you to edit flows in previous days and future days, giving you flexibility 
            when you don't want strict daily rules. Perfect for users who prefer a more relaxed approach 
            to habit tracking.
          </Text>
          
          <View style={dynamicStyles.benefitsList}>
            <View style={dynamicStyles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
              <Text style={dynamicStyles.benefitText}>Edit past days if you forgot to log</Text>
            </View>
            <View style={dynamicStyles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
              <Text style={dynamicStyles.benefitText}>Plan ahead by setting future days</Text>
            </View>
            <View style={dynamicStyles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
              <Text style={dynamicStyles.benefitText}>More flexible habit tracking</Text>
            </View>
            <View style={dynamicStyles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
              <Text style={dynamicStyles.benefitText}>Perfect for busy schedules</Text>
            </View>
          </View>
        </View>

        {/* All Flow Habits */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>All Flow Habits ({flows.filter(flow => !flow.deletedAt).length})</Text>
          
          {flows.filter(flow => !flow.deletedAt).length === 0 ? (
            <View style={dynamicStyles.emptyState}>
              <Ionicons name="leaf-outline" size={48} color={themeColors.secondaryText} />
              <Text style={dynamicStyles.emptyText}>No flow habits created yet</Text>
              <Text style={dynamicStyles.emptySubtext}>Create your first habit to see it here</Text>
            </View>
          ) : (
            <FlatList
              data={flows.filter(flow => !flow.deletedAt)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item: flow }) => {
                const isHighlighted = highlightFlow && flow.title === highlightFlow;
                return (
                  <View style={[
                    dynamicStyles.flowItem,
                    isHighlighted && {
                      borderColor: themeColors.warning,
                      borderWidth: 2,
                      backgroundColor: themeColors.warningBackground || '#FFF7ED',
                    }
                  ]}>
                    <View style={dynamicStyles.flowInfo}>
                      <Text style={dynamicStyles.flowTitle}>{flow.title}</Text>
                      <Text style={dynamicStyles.flowDescription}>
                        {flow.description || 'No description available'}
                      </Text>
                      {flow.cheatMode && (
                        <View style={dynamicStyles.cheatModeBadge}>
                          <Ionicons name="bulb" size={12} color="#fff" />
                          <Text style={dynamicStyles.cheatModeText}>Cheat Mode Enabled</Text>
                        </View>
                      )}
                      {isHighlighted && (
                        <View style={dynamicStyles.highlightBadge}>
                          <Ionicons name="star" size={12} color={themeColors.warning} />
                          <Text style={[dynamicStyles.highlightText, { color: themeColors.warning }]}>
                            Click to enable cheat mode
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={dynamicStyles.flowControls}>
                      <Switch
                        value={flow.cheatMode || false}
                        onValueChange={(value) => handleFlowCheatModeToggle(flow.id, value)}
                        trackColor={{ false: '#767577', true: themeColors.primaryOrange }}
                        thumbColor={(flow.cheatMode || false) ? '#fff' : '#f4f3f4'}
                      />
                    </View>
                  </View>
                );
              }}
            />
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
    </SafeAreaWrapper>
  );
};

export default CheatModeSettings;
