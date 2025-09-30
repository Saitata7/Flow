import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, layout, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';

const CheatModePopup = ({ visible, onClose, flowTitle }) => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;

  const handleEnableCheatMode = () => {
    onClose();
    // Navigate to CheatModeSettings and highlight the specific flow
    navigation.navigate('SettingsStack', { 
      screen: 'CheatModeSettings',
      params: { highlightFlow: flowTitle }
    });
  };

  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    popup: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: layout.radii.squircle,
      padding: layout.spacing.lg,
      margin: layout.spacing.lg,
      maxWidth: 320,
      width: '90%',
      ...layout.elevation.high,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: layout.spacing.md,
    },
    icon: {
      marginRight: layout.spacing.sm,
    },
    title: {
      ...typography.styles.title3,
      color: themeColors.primaryText,
      fontWeight: typography.weights.bold,
    },
    message: {
      ...typography.styles.body,
      color: themeColors.secondaryText,
      lineHeight: 22,
      marginBottom: layout.spacing.lg,
    },
    flowName: {
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
    },
    featureList: {
      marginBottom: layout.spacing.lg,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: layout.spacing.sm,
    },
    featureText: {
      ...typography.styles.caption1,
      color: themeColors.primaryText,
      marginLeft: layout.spacing.sm,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      paddingVertical: layout.spacing.md,
      paddingHorizontal: layout.spacing.lg,
      borderRadius: layout.radii.base,
      alignItems: 'center',
      marginHorizontal: layout.spacing.xs,
    },
    cancelButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    enableButton: {
      backgroundColor: themeColors.warning,
    },
    buttonText: {
      ...typography.styles.button,
      fontWeight: typography.weights.semibold,
    },
    cancelButtonText: {
      color: themeColors.secondaryText,
    },
    enableButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.popup}>
          <View style={dynamicStyles.header}>
            <Ionicons 
              name="bulb-outline" 
              size={24} 
              color={themeColors.warning} 
              style={dynamicStyles.icon}
            />
            <Text style={dynamicStyles.title}>Cheat Mode Required</Text>
          </View>
          
          <Text style={dynamicStyles.message}>
            To edit or reset "<Text style={dynamicStyles.flowName}>{flowTitle}</Text>", 
            you need to enable Cheat Mode for this habit.
          </Text>
          
          <View style={dynamicStyles.featureList}>
            <View style={dynamicStyles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
              <Text style={dynamicStyles.featureText}>Edit past days if you forgot to log</Text>
            </View>
            <View style={dynamicStyles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
              <Text style={dynamicStyles.featureText}>Reset and modify any day</Text>
            </View>
            <View style={dynamicStyles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
              <Text style={dynamicStyles.featureText}>More flexible habit tracking</Text>
            </View>
          </View>
          
          <View style={dynamicStyles.buttonContainer}>
            <TouchableOpacity 
              style={[dynamicStyles.button, dynamicStyles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[dynamicStyles.buttonText, dynamicStyles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[dynamicStyles.button, dynamicStyles.enableButton]}
              onPress={handleEnableCheatMode}
            >
              <Text style={[dynamicStyles.buttonText, dynamicStyles.enableButtonText]}>
                Enable Cheat Mode
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CheatModePopup;
