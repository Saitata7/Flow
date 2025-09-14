// components/profile/BadgeRow.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

// Predefined badge configurations
const BADGE_CONFIGS = {
  '7-day streak': {
    icon: 'flame',
    color: '#FF6B35',
    description: '7 days in a row'
  },
  '14-day streak': {
    icon: 'flame',
    color: '#FF6B35',
    description: '14 days in a row'
  },
  '30-day streak': {
    icon: 'flame',
    color: '#FF6B35',
    description: '30 days in a row'
  },
  'Early Adopter': {
    icon: 'rocket',
    color: '#4ECDC4',
    description: 'Joined in beta'
  },
  'Plan Creator': {
    icon: 'create',
    color: '#45B7D1',
    description: 'Created 5+ plans'
  },
  'Community Helper': {
    icon: 'people',
    color: '#96CEB4',
    description: 'Helped 10+ users'
  },
  'Consistency King': {
    icon: 'trophy',
    color: '#FFD93D',
    description: '90% completion rate'
  },
  'Night Owl': {
    icon: 'moon',
    color: '#6C5CE7',
    description: 'Active after midnight'
  },
  'Early Bird': {
    icon: 'sunny',
    color: '#FDCB6E',
    description: 'Active before 6 AM'
  }
};

const BadgeRow = ({ 
  badges, 
  onBadgePress,
  showTitle = true,
  maxDisplay = 6,
  compact = false 
}) => {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;

  const displayedBadges = badges?.slice(0, maxDisplay) || [];
  const hasMoreBadges = badges?.length > maxDisplay;

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
    badgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    badge: {
      alignItems: 'center',
      marginRight: compact ? 8 : 12,
      marginBottom: compact ? 8 : 12,
      minWidth: compact ? 60 : 70,
    },
    badgeIcon: {
      width: compact ? 40 : 50,
      height: compact ? 40 : 50,
      borderRadius: compact ? 20 : 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: compact ? 4 : 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    badgeText: {
      fontSize: compact ? typography.sizes.caption2 : typography.sizes.caption1,
      color: themeColors.primaryText,
      textAlign: 'center',
      fontWeight: typography.weights.medium,
      maxWidth: compact ? 60 : 70,
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
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginTop: 8,
    },
    viewAllText: {
      fontSize: typography.sizes.body,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.semibold,
      marginRight: 4,
    },
    chevronIcon: {
      color: themeColors.primaryOrange,
    }
  });

  const Badge = ({ badgeName }) => {
    const config = BADGE_CONFIGS[badgeName] || {
      icon: 'star',
      color: themeColors.primaryOrange,
      description: badgeName
    };

    return (
      <TouchableOpacity 
        style={dynamicStyles.badge}
        onPress={() => onBadgePress?.(badgeName, config)}
        disabled={!onBadgePress}
        accessibilityLabel={`Badge: ${badgeName}`}
        accessibilityRole={onBadgePress ? "button" : "text"}
      >
        <View style={[dynamicStyles.badgeIcon, { backgroundColor: config.color }]}>
          <Ionicons 
            name={config.icon} 
            size={compact ? 20 : 24} 
            color="#fff" 
          />
        </View>
        <Text style={dynamicStyles.badgeText} numberOfLines={2}>
          {badgeName}
        </Text>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={dynamicStyles.emptyState}>
      <Ionicons 
        name="trophy-outline" 
        size={48} 
        color={themeColors.secondaryText}
        style={dynamicStyles.emptyIcon}
      />
      <Text style={dynamicStyles.emptyText}>
        No badges yet{'\n'}Keep building habits to earn badges!
      </Text>
    </View>
  );

  return (
    <View style={dynamicStyles.container}>
      {showTitle && (
        <Text style={dynamicStyles.title}>Badges</Text>
      )}
      
      {displayedBadges.length > 0 ? (
        <>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.badgesContainer}
          >
            {displayedBadges.map((badge, index) => (
              <Badge key={index} badgeName={badge} />
            ))}
          </ScrollView>
          
          {hasMoreBadges && (
            <TouchableOpacity 
              style={dynamicStyles.viewAllButton}
              onPress={() => onBadgePress?.('viewAll', { badges })}
              accessibilityLabel="View all badges"
              accessibilityRole="button"
            >
              <Text style={dynamicStyles.viewAllText}>
                View All ({badges.length})
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={themeColors.primaryOrange}
                style={dynamicStyles.chevronIcon}
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

export default BadgeRow;
