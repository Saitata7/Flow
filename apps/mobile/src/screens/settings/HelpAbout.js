// screens/settings/HelpAbout.js
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const HelpAbout = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;

  const handleLinkPress = async (url, title) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${title}`);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', `Failed to open ${title}`);
    }
  };

  const handleEmailPress = (email, subject) => {
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    handleLinkPress(url, 'email');
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
    linkItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.progressBackground,
    },
    linkItemLast: {
      borderBottomWidth: 0,
    },
    linkLabel: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryText,
      flex: 1,
    },
    linkDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginTop: 4,
    },
    chevronIcon: {
      color: themeColors.secondaryText,
    },
    aboutText: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      lineHeight: typography.sizes.body * 1.4,
      marginBottom: 16,
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
    },
    copyrightText: {
      fontSize: typography.sizes.caption2,
      color: themeColors.secondaryText,
      marginTop: 8,
      textAlign: 'center',
    }
  });

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
        <Text style={dynamicStyles.headerTitle}>Help & About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* About */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>About Flow</Text>
          <Text style={dynamicStyles.aboutText}>
            Flow is a habit tracking and personal development app designed to help you build meaningful routines and achieve your goals. Track your progress, join community challenges, and celebrate your achievements.
          </Text>
        </View>

        {/* Help & Support */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Help & Support</Text>
          
          <TouchableOpacity
            style={dynamicStyles.linkItem}
            onPress={() => handleEmailPress('support@flowapp.com', 'Support Request')}
          >
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.linkLabel}>Contact Support</Text>
              <Text style={dynamicStyles.linkDescription}>
                Get help with technical issues
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={themeColors.secondaryText}
              style={dynamicStyles.chevronIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={dynamicStyles.linkItem}
            onPress={() => handleEmailPress('feedback@flowapp.com', 'App Feedback')}
          >
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.linkLabel}>Send Feedback</Text>
              <Text style={dynamicStyles.linkDescription}>
                Share your thoughts and suggestions
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={themeColors.secondaryText}
              style={dynamicStyles.chevronIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[dynamicStyles.linkItem, dynamicStyles.linkItemLast]}
            onPress={() => handleLinkPress('https://flowapp.com/faq', 'FAQ')}
          >
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.linkLabel}>Frequently Asked Questions</Text>
              <Text style={dynamicStyles.linkDescription}>
                Find answers to common questions
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={themeColors.secondaryText}
              style={dynamicStyles.chevronIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity
            style={dynamicStyles.linkItem}
            onPress={() => handleLinkPress('https://flowapp.com/privacy', 'Privacy Policy')}
          >
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.linkLabel}>Privacy Policy</Text>
              <Text style={dynamicStyles.linkDescription}>
                How we protect your data
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={themeColors.secondaryText}
              style={dynamicStyles.chevronIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[dynamicStyles.linkItem, dynamicStyles.linkItemLast]}
            onPress={() => handleLinkPress('https://flowapp.com/terms', 'Terms of Service')}
          >
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.linkLabel}>Terms of Service</Text>
              <Text style={dynamicStyles.linkDescription}>
                Terms and conditions of use
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={themeColors.secondaryText}
              style={dynamicStyles.chevronIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={dynamicStyles.versionInfo}>
          <Text style={dynamicStyles.versionText}>
            Flow v1.0.0
          </Text>
          <Text style={dynamicStyles.copyrightText}>
            © 2024 Flow App. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default HelpAbout;
