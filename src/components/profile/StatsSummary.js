// components/profile/StatsSummary.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const StatsSummary = ({ 
  stats, 
  onPress, 
  showLabels = true,
  compact = false 
}) => {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;

  const statItems = [
    {
      key: 'personalPlans',
      label: 'Personal',
      value: stats?.personalPlans || 0,
      icon: 'person-outline',
      color: themeColors.primaryOrange
    },
    {
      key: 'publicPlans',
      label: 'Public',
      value: stats?.publicPlans || 0,
      icon: 'globe-outline',
      color: themeColors.primaryBlue
    },
    {
      key: 'followers',
      label: 'Followers',
      value: stats?.followers || 0,
      icon: 'people-outline',
      color: themeColors.success
    },
    {
      key: 'following',
      label: 'Following',
      value: stats?.following || 0,
      icon: 'person-add-outline',
      color: themeColors.warning
    }
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: compact ? 12 : 16,
      marginVertical: compact ? 4 : 8,
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
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    statItem: {
      alignItems: 'center',
      minWidth: compact ? 60 : 70,
      marginVertical: compact ? 4 : 8,
    },
    statIcon: {
      marginBottom: compact ? 4 : 6,
    },
    statValue: {
      fontSize: compact ? typography.sizes.title2 : typography.sizes.title1,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: compact ? 2 : 4,
    },
    statLabel: {
      fontSize: compact ? typography.sizes.caption2 : typography.sizes.caption1,
      color: themeColors.secondaryText,
      textAlign: 'center',
      fontWeight: typography.weights.medium,
    },
    pressableContainer: {
      opacity: onPress ? 1 : 0.7,
    },
    chevron: {
      alignSelf: 'center',
      marginTop: compact ? 4 : 8,
    }
  });

  const StatItem = ({ item }) => (
    <View style={dynamicStyles.statItem}>
      <View style={dynamicStyles.statIcon}>
        <Ionicons 
          name={item.icon} 
          size={compact ? 20 : 24} 
          color={item.color} 
        />
      </View>
      <Text style={dynamicStyles.statValue}>
        {item.value.toLocaleString()}
      </Text>
      {showLabels && (
        <Text style={dynamicStyles.statLabel}>
          {item.label}
        </Text>
      )}
    </View>
  );

  const content = (
    <View style={dynamicStyles.container}>
      {showLabels && (
        <Text style={dynamicStyles.title}>Your Stats</Text>
      )}
      <View style={dynamicStyles.statsGrid}>
        {statItems.map((item) => (
          <StatItem key={item.key} item={item} />
        ))}
      </View>
      {onPress && (
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={themeColors.secondaryText}
          style={dynamicStyles.chevron}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        style={dynamicStyles.pressableContainer}
        accessibilityLabel="View detailed stats"
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default StatsSummary;
