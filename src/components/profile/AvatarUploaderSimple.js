// components/profile/AvatarUploaderSimple.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';

const AvatarUploaderSimple = ({ 
  avatarUrl, 
  onAvatarChange, 
  size = 120, 
  editable = true,
  style 
}) => {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const [uploading, setUploading] = useState(false);
  
  const themeColors = colors[theme] || colors.light;

  const pickImage = async () => {
    if (!editable) return;

    Alert.alert(
      'Avatar Upload',
      'Avatar upload functionality will be available in a future update. For now, you can use a placeholder avatar.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Use Placeholder', 
          onPress: () => {
            // Simulate avatar upload with a placeholder
            setUploading(true);
            setTimeout(() => {
              onAvatarChange('https://via.placeholder.com/150/007AFF/FFFFFF?text=Avatar');
              setUploading(false);
            }, 1000);
          }
        }
      ]
    );
  };

  const removeAvatar = () => {
    if (!editable) return;
    
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onAvatarChange('')
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: themeColors.cardBackground,
      borderWidth: 2,
      borderColor: themeColors.progressBackground,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatar: {
      width: size - 4,
      height: size - 4,
      borderRadius: (size - 4) / 2,
    },
    placeholderIcon: {
      color: themeColors.secondaryText,
    },
    editButton: {
      position: 'absolute',
      bottom: -5,
      right: -5,
      backgroundColor: themeColors.primaryOrange,
      borderRadius: 15,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: themeColors.cardBackground,
    },
    removeButton: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: '#dc3545',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: themeColors.cardBackground,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      marginTop: 8,
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      textAlign: 'center',
    }
  });

  return (
    <View style={[dynamicStyles.container, style]}>
      <View style={dynamicStyles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={dynamicStyles.avatar} />
        ) : (
          <Ionicons 
            name="person" 
            size={size * 0.4} 
            color={themeColors.secondaryText} 
          />
        )}
        
        {uploading && (
          <View style={dynamicStyles.loadingOverlay}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        )}
        
        {editable && avatarUrl && (
          <TouchableOpacity 
            style={dynamicStyles.removeButton}
            onPress={removeAvatar}
            accessibilityLabel="Remove avatar"
          >
            <Ionicons name="close" size={12} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      
      {editable && (
        <TouchableOpacity 
          style={dynamicStyles.editButton}
          onPress={pickImage}
          disabled={uploading}
          accessibilityLabel="Change avatar"
        >
          <Ionicons name="camera" size={16} color="#fff" />
        </TouchableOpacity>
      )}
      
      {editable && (
        <Text style={dynamicStyles.label}>
          {uploading ? 'Uploading...' : 'Tap to change'}
        </Text>
      )}
    </View>
  );
};

export default AvatarUploaderSimple;
