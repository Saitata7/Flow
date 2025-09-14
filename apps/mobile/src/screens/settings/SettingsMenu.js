// screens/settings/SettingsMenu.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuthSimple as useAuth } from '../../hooks/useAuthSimple';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const SettingsMenu = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  const { signOut } = useAuth();

  const settingsCategories = [
    {
      id: 'account',
      title: 'Account',
      icon: 'person-outline',
      description: 'Profile, security, and account settings',
      screen: 'AccountSettings'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: 'shield-outline',
      description: 'Control what others can see',
      screen: 'PrivacySettings'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      description: 'Manage your notification preferences',
      screen: 'NotificationSettings'
    },
    {
      id: 'location',
      title: 'Location',
      icon: 'location-outline',
      description: 'Location services and permissions',
      screen: 'LocationSettings'
    },
    {
      id: 'help',
      title: 'Help & About',
      icon: 'help-circle-outline',
      description: 'Support, privacy policy, and app info',
      screen: 'HelpAbout'
    },
    {
      id: 'cheat',
      title: 'Cheat Mode',
      icon: 'settings-outline',
      description: 'Developer and testing options',
      screen: 'CheatModeSettings'
    }
  ];

  const handleCategoryPress = (category) => {
    onClose();
    // Navigate to SettingsStack screens
    navigation.navigate('SettingsStack', { 
      screen: category.screen 
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: themeColors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: screenHeight * 0.8,
      minHeight: screenHeight * 0.4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.progressBackground,
    },
    headerTitle: {
      fontSize: typography.sizes.title2,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: themeColors.background,
    },
    scrollContent: {
      padding: 20,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: themeColors.background,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.primaryOrange,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    categoryContent: {
      flex: 1,
    },
    categoryTitle: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 2,
    },
    categoryDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
    },
    chevronIcon: {
      color: themeColors.secondaryText,
    },
    signOutSection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: themeColors.progressBackground,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: themeColors.error,
      borderRadius: 12,
    },
    signOutText: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: '#fff',
      marginLeft: 8,
    },
    versionInfo: {
      alignItems: 'center',
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: themeColors.progressBackground,
    },
    versionText: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
    }
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={dynamicStyles.modalContent}>
          <SafeAreaView edges={['bottom']}>
            {/* Header */}
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.headerTitle}>Settings</Text>
              <TouchableOpacity 
                style={dynamicStyles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close settings"
                accessibilityRole="button"
              >
                <Ionicons 
                  name="close" 
                  size={20} 
                  color={themeColors.primaryText} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={dynamicStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Settings Categories */}
              {settingsCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={dynamicStyles.categoryItem}
                  onPress={() => handleCategoryPress(category)}
                  accessibilityLabel={`Open ${category.title} settings`}
                  accessibilityRole="button"
                >
                  <View style={dynamicStyles.categoryIcon}>
                    <Ionicons 
                      name={category.icon} 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                  <View style={dynamicStyles.categoryContent}>
                    <Text style={dynamicStyles.categoryTitle}>
                      {category.title}
                    </Text>
                    <Text style={dynamicStyles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={themeColors.secondaryText}
                    style={dynamicStyles.chevronIcon}
                  />
                </TouchableOpacity>
              ))}

              {/* Sign Out Section */}
              <View style={dynamicStyles.signOutSection}>
                <TouchableOpacity
                  style={dynamicStyles.signOutButton}
                  onPress={handleSignOut}
                  accessibilityLabel="Sign out of account"
                  accessibilityRole="button"
                >
                  <Ionicons 
                    name="log-out-outline" 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={dynamicStyles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>

              {/* Version Info */}
              <View style={dynamicStyles.versionInfo}>
                <Text style={dynamicStyles.versionText}>
                  Flow v1.0.0
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

export default SettingsMenu;
