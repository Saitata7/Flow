// src/screens/plans/PlanDetail.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import usePlans from '../../hooks/usePlans';
import useAuth from '../../hooks/useAuth';

const PlanDetail = ({ navigation, route }) => {
  const { planId } = route.params;
  const { user } = useAuth();
  const { getPlanDetails, joinPlan, leavePlan, addToFavourites, removeFromFavourites, deletePlan } = usePlans();
  const insets = useSafeAreaInsets();

  const { data: plan, isLoading } = getPlanDetails(planId);
  const [isFavourite, setIsFavourite] = useState(false);

  const currentPlan = plan;
  
  if (!currentPlan) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Plan not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const isOwner = currentPlan.ownerId === user?.id;
  const isParticipant = currentPlan.participants?.some(p => p.userId === user?.id);

  const handleJoin = async () => {
    try {
      await joinPlan(planId);
      Alert.alert('Success!', 'You have joined this plan.');
    } catch (error) {
      Alert.alert('Error', 'Failed to join plan. Please try again.');
    }
  };

  const handleLeave = async () => {
    Alert.alert(
      'Leave Plan',
      'Are you sure you want to leave this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leavePlan(planId);
              Alert.alert('Success!', 'You have left this plan.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave plan. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleFavourite = async () => {
    try {
      if (isFavourite) {
        await removeFromFavourites(planId);
        setIsFavourite(false);
      } else {
        await addToFavourites(planId);
        setIsFavourite(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favourites. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(planId);
              Alert.alert('Success!', 'Plan has been deleted successfully.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      mindfulness: 'leaf-outline',
      fitness: 'fitness-outline',
      learning: 'book-outline',
      productivity: 'checkmark-circle-outline',
      social: 'people-outline',
      creative: 'color-palette-outline',
    };
    return icons[category] || 'calendar-outline';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {currentPlan.title}
        </Text>
        <TouchableOpacity
          style={styles.favouriteButton}
          onPress={handleFavourite}
          accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Icon
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavourite ? colors.light.error : colors.light.secondaryText}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Info */}
        <View style={styles.planInfo}>
          <View style={styles.planHeader}>
            <View style={styles.categoryBadge}>
              <Icon
                name={getCategoryIcon(currentPlan.category)}
                size={16}
                color={colors.light.primaryOrange}
              />
              <Text style={styles.categoryText}>
                {currentPlan.category.charAt(0).toUpperCase() + currentPlan.category.slice(1)}
              </Text>
            </View>
            <View style={styles.visibilityBadge}>
              <Icon
                name={currentPlan.visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                size={16}
                color={colors.light.secondaryText}
              />
              <Text style={styles.visibilityText}>
                {currentPlan.visibility === 'public' ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{currentPlan.description}</Text>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Icon name="people-outline" size={20} color={colors.light.secondaryText} />
              <Text style={styles.statText}>
                {currentPlan.participants?.length || 0} participant{(currentPlan.participants?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            {currentPlan.analytics && (
              <View style={styles.statItem}>
                <Icon name="trending-up-outline" size={20} color={colors.light.success} />
                <Text style={styles.statText}>
                  {currentPlan.analytics.streak} day streak
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps</Text>
          {currentPlan.steps?.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDuration}>{step.duration} minute{step.duration !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Analytics */}
        {currentPlan.analytics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.analytics}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Strict Score</Text>
                <Text style={styles.analyticsValue}>{currentPlan.analytics.strictScore}%</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Flexible Score</Text>
                <Text style={styles.analyticsValue}>{currentPlan.analytics.flexibleScore}%</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsLabel}>Current Streak</Text>
                <Text style={styles.analyticsValue}>{currentPlan.analytics.streak} days</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {isOwner ? (
          <View style={styles.ownerActions}>
            <Button
              variant="secondary"
              title="Edit Plan"
              onPress={() => navigation.navigate('EditPlan', { planId })}
              style={styles.actionButton}
            />
            <Button
              variant="primary"
              title="Share Plan"
              onPress={() => {}}
              style={styles.actionButton}
            />
          </View>
        ) : isParticipant ? (
          <Button
            variant="secondary"
            title="Leave Plan"
            onPress={handleLeave}
            style={styles.actionButton}
          />
        ) : (
          <Button
            variant="primary"
            title="Join Plan"
            onPress={handleJoin}
            style={styles.actionButton}
          />
        )}
        
        {/* Delete Button for Owners */}
        {isOwner && (
          <View style={styles.deleteSection}>
            <Button
              variant="destructive"
              title="Delete Plan"
              onPress={handleDelete}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    padding: layout.spacing.sm,
  },
  title: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: layout.spacing.md,
  },
  favouriteButton: {
    padding: layout.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  content: {
    flex: 1,
  },
  planInfo: {
    backgroundColor: colors.light.cardBackground,
    margin: layout.spacing.lg,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.small,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.primaryOrangeVariants.light,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
  },
  categoryText: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    marginLeft: layout.spacing.xs,
    fontWeight: '600',
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.progressBackground,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
  },
  visibilityText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginLeft: layout.spacing.xs,
  },
  description: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    gap: layout.spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  statText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  section: {
    marginHorizontal: layout.spacing.lg,
    marginBottom: layout.spacing.lg,
  },
  sectionTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    marginBottom: layout.spacing.sm,
    ...layout.shadows.small,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.spacing.md,
  },
  stepNumberText: {
    ...typography.styles.headline,
    color: colors.light.cardBackground,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  stepDuration: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  analytics: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.small,
  },
  analyticsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  analyticsLabel: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  analyticsValue: {
    ...typography.styles.headline,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  footer: {
    padding: layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    backgroundColor: colors.light.background,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: layout.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  deleteSection: {
    marginTop: layout.spacing.md,
  },
});

export default PlanDetail;
