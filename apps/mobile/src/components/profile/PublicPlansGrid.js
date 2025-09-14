// components/profile/PublicPlansGrid.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { useContext } from 'react';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const PublicPlansGrid = ({ 
  plans, 
  onPlanPress, 
  onViewAllPress,
  maxDisplay = 3,
  showTitle = true 
}) => {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;

  const displayedPlans = plans?.slice(0, maxDisplay) || [];
  const hasMorePlans = plans?.length > maxDisplay;

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      shadowColor: themeColors.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: typography.sizes.title3,
      fontWeight: typography.weights.bold,
      color: themeColors.primaryText,
      marginBottom: 12,
    },
    plansContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    planCard: {
      width: isTablet ? '48%' : '100%',
      backgroundColor: themeColors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: themeColors.progressBackground,
    },
    planTitle: {
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      color: themeColors.primaryText,
      marginBottom: 4,
    },
    planDescription: {
      fontSize: typography.sizes.caption1,
      color: themeColors.secondaryText,
      marginBottom: 8,
      numberOfLines: 2,
    },
    planMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    planCategory: {
      fontSize: typography.sizes.caption2,
      color: themeColors.primaryOrange,
      fontWeight: typography.weights.medium,
    },
    planIcon: {
      color: themeColors.secondaryText,
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

  const PlanCard = ({ plan }) => (
    <TouchableOpacity 
      style={dynamicStyles.planCard}
      onPress={() => onPlanPress?.(plan)}
      accessibilityLabel={`View plan: ${plan.title}`}
      accessibilityRole="button"
    >
      <Text style={dynamicStyles.planTitle} numberOfLines={1}>
        {plan.title}
      </Text>
      {plan.description && (
        <Text style={dynamicStyles.planDescription} numberOfLines={2}>
          {plan.description}
        </Text>
      )}
      <View style={dynamicStyles.planMeta}>
        <Text style={dynamicStyles.planCategory}>
          {plan.category || 'General'}
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={themeColors.secondaryText}
        />
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={dynamicStyles.emptyState}>
      <Ionicons 
        name="clipboard-outline" 
        size={48} 
        color={themeColors.secondaryText}
        style={dynamicStyles.emptyIcon}
      />
      <Text style={dynamicStyles.emptyText}>
        No public plans yet{'\n'}Create your first public plan to share!
      </Text>
    </View>
  );

  return (
    <View style={dynamicStyles.container}>
      {showTitle && (
        <Text style={dynamicStyles.title}>Public Plans</Text>
      )}
      
      {displayedPlans.length > 0 ? (
        <>
          <View style={dynamicStyles.plansContainer}>
            {displayedPlans.map((plan, index) => (
              <PlanCard key={plan.id || index} plan={plan} />
            ))}
          </View>
          
          {hasMorePlans && onViewAllPress && (
            <TouchableOpacity 
              style={dynamicStyles.viewAllButton}
              onPress={onViewAllPress}
              accessibilityLabel="View all public plans"
              accessibilityRole="button"
            >
              <Text style={dynamicStyles.viewAllText}>
                View All ({plans.length})
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

export default PublicPlansGrid;
