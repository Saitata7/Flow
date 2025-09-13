// components/profile/SocialLinks.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const SocialLinks = ({ 
  social, 
  onEdit,
  editable = false,
  showTitle = true,
  compact = false 
}) => {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;

  const socialPlatforms = [
    {
      key: 'twitter',
      icon: 'logo-twitter',
      label: 'Twitter',
      color: '#1DA1F2',
      placeholder: '@username'
    },
    {
      key: 'linkedin',
      icon: 'logo-linkedin',
      label: 'LinkedIn',
      color: '#0077B5',
      placeholder: 'linkedin.com/in/username'
    },
    {
      key: 'github',
      icon: 'logo-github',
      label: 'GitHub',
      color: '#333',
      placeholder: 'github.com/username'
    },
    {
      key: 'instagram',
      icon: 'logo-instagram',
      label: 'Instagram',
      color: '#E4405F',
      placeholder: '@username'
    }
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: compact ? 12 : 16,
      marginVertical: 8,
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: compact ? typography.sizes.body : typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: compact ? 8 : 12,
    },
    linksContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    socialLink: {
      alignItems: 'center',
      marginBottom: compact ? 8 : 12,
      minWidth: compact ? 70 : 80,
      flex: 1,
      maxWidth: isTablet ? '48%' : '100%',
    },
    socialIcon: {
      width: compact ? 40 : 50,
      height: compact ? 40 : 50,
      borderRadius: compact ? 20 : 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: compact ? 4 : 6,
      borderWidth: 1,
      borderColor: themeColors.progressBackground,
    },
    socialLabel: {
      fontSize: compact ? typography.sizes.caption2 : typography.sizes.caption1,
      color: themeColors.primaryText,
      textAlign: 'center',
      fontWeight: typography.weights.medium,
    },
    socialValue: {
      fontSize: compact ? typography.sizes.caption2 : typography.sizes.caption1,
      color: themeColors.secondaryText,
      textAlign: 'center',
      marginTop: 2,
      numberOfLines: 1,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyIcon: {
      marginBottom: 8,
    },
    emptyText: {
      fontSize: typography.sizes.body,
      color: themeColors.secondaryText,
      textAlign: 'center',
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginTop: 8,
    },
    editText: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.semibold,
      marginRight: 4,
    },
    editIcon: {
      color: themeColors.primaryOrange,
    }
  });

  const handleSocialPress = async (platform, url) => {
    if (!url) return;

    try {
      // Ensure URL has protocol
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      const canOpen = await Linking.canOpenURL(formattedUrl);
      
      if (canOpen) {
        await Linking.openURL(formattedUrl);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('Error opening social link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const SocialLink = ({ platform }) => {
    const url = social?.[platform.key];
    const hasValue = url && url.trim().length > 0;

    return (
      <TouchableOpacity 
        style={dynamicStyles.socialLink}
        onPress={() => hasValue ? handleSocialPress(platform.key, url) : null}
        disabled={!hasValue}
        accessibilityLabel={`${platform.label}: ${hasValue ? url : 'Not set'}`}
        accessibilityRole={hasValue ? "button" : "text"}
      >
        <View style={[
          dynamicStyles.socialIcon,
          { backgroundColor: hasValue ? platform.color : themeColors.background }
        ]}>
          <Ionicons 
            name={platform.icon} 
            size={compact ? 20 : 24} 
            color={hasValue ? '#fff' : themeColors.secondaryText} 
          />
        </View>
        <Text style={dynamicStyles.socialLabel}>
          {platform.label}
        </Text>
        {hasValue ? (
          <Text style={dynamicStyles.socialValue} numberOfLines={1}>
            {url}
          </Text>
        ) : (
          <Text style={[dynamicStyles.socialValue, { fontStyle: 'italic' }]}>
            Not set
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={dynamicStyles.emptyState}>
      <Ionicons 
        name="share-outline" 
        size={48} 
        color={themeColors.secondaryText}
        style={dynamicStyles.emptyIcon}
      />
      <Text style={dynamicStyles.emptyText}>
        No social links added{'\n'}Connect your profiles to share your journey!
      </Text>
    </View>
  );

  const hasAnySocialLinks = socialPlatforms.some(platform => 
    social?.[platform.key] && social[platform.key].trim().length > 0
  );

  return (
    <View style={dynamicStyles.container}>
      {showTitle && (
        <Text style={dynamicStyles.title}>Social Links</Text>
      )}
      
      {hasAnySocialLinks ? (
        <>
          <View style={dynamicStyles.linksContainer}>
            {socialPlatforms.map((platform) => (
              <SocialLink key={platform.key} platform={platform} />
            ))}
          </View>
          
          {editable && onEdit && (
            <TouchableOpacity 
              style={dynamicStyles.editButton}
              onPress={onEdit}
              accessibilityLabel="Edit social links"
              accessibilityRole="button"
            >
              <Text style={dynamicStyles.editText}>Edit Links</Text>
              <Ionicons 
                name="create-outline" 
                size={16} 
                color={themeColors.primaryOrange}
                style={dynamicStyles.editIcon}
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </View>
  );
};

export default SocialLinks;
