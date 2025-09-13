// src/screens/plans/PlansDashboard.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import useAuth from '../../hooks/useAuth';
import { usePlanContext } from '../../context/PlanContext';

const PlansDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const { personalPlans, publicPlans, favouritePlans, loading } = usePlanContext();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal', icon: 'person-outline' },
    { id: 'everyone', label: 'Everyone', icon: 'globe-outline' },
    { id: 'favourites', label: 'Favourites', icon: 'heart-outline' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalPlansContent navigation={navigation} />;
      case 'everyone':
        return <EveryonePlansContent navigation={navigation} />;
      case 'favourites':
        return <FavouritePlansContent navigation={navigation} />;
      default:
        return <PersonalPlansContent navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Plans</Text>
        <Text style={styles.subtitle}>Create and join rituals & challenges</Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.id)}
            accessibilityLabel={`${tab.label} tab`}
            accessibilityRole="tab"
          >
            <Icon
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? colors.light.primaryOrange : colors.light.secondaryText}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderTabContent()}
      </ScrollView>

      <View style={styles.fabContainer}>
        <Button
          variant="primary"
          title="Create Plan"
          onPress={() => {
            if (activeTab === 'personal') {
              navigation.navigate('AddFlow', { createAsPlan: true });
            } else {
              navigation.navigate('AddPublicPlan');
            }
          }}
          style={styles.createButton}
          icon="add"
        />
      </View>
    </SafeAreaView>
  );
};

// Personal Plans Content Component
const PersonalPlansContent = ({ navigation }) => {
  const { personalPlans, loading } = usePlanContext();

  if (loading) {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your plans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Rituals</Text>
        <Text style={styles.sectionSubtitle}>
          {personalPlans.length} personal plan{personalPlans.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {personalPlans.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="leaf-outline" size={64} color={colors.light.secondaryText} />
          <Text style={styles.emptyTitle}>No personal plans yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first ritual to start building better habits
          </Text>
          <Button
            variant="primary"
            title="Create Your First Plan"
            onPress={() => navigation.navigate('AddFlow', { createAsPlan: true })}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <View style={styles.plansList}>
          {personalPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Everyone Plans Content Component
const EveryonePlansContent = ({ navigation }) => {
  const { publicPlans, loading } = usePlanContext();

  if (loading) {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading public plans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Explore Plans</Text>
        <Text style={styles.sectionSubtitle}>
          Join challenges from the community
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={colors.light.secondaryText} />
          <Text style={styles.searchPlaceholder}>Search plans...</Text>
        </View>
      </View>

      <View style={styles.plansList}>
        {publicPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
            showJoinButton
          />
        ))}
      </View>
    </View>
  );
};

// Favourite Plans Content Component
const FavouritePlansContent = ({ navigation }) => {
  const { favouritePlans, loading } = usePlanContext();

  if (loading) {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading favourites...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Favourite Plans</Text>
        <Text style={styles.sectionSubtitle}>
          Plans you've saved for later
        </Text>
      </View>

      {favouritePlans.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="heart-outline" size={64} color={colors.light.secondaryText} />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptySubtitle}>
            Save plans you like to find them easily later
          </Text>
        </View>
      ) : (
        <View style={styles.plansList}>
          {favouritePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
              showJoinButton
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Plan Card Component
const PlanCard = ({ plan, onPress, showJoinButton = false }) => {
  const { joinPlan, loading } = usePlanContext();
  
  const handleJoin = async () => {
    try {
      await joinPlan(plan.id);
    } catch (error) {
      console.error('Error joining plan:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.planCard}
      onPress={onPress}
      accessibilityLabel={`Plan: ${plan.title}`}
      accessibilityRole="button"
    >
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>
        <View style={styles.planMeta}>
          <Icon
            name={plan.visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
            size={16}
            color={colors.light.secondaryText}
          />
        </View>
      </View>

      <View style={styles.planStats}>
        <View style={styles.statItem}>
          <Icon name="people-outline" size={16} color={colors.light.secondaryText} />
          <Text style={styles.statText}>{plan.participants?.length || 0}</Text>
        </View>
        {plan.analytics?.streak > 0 && (
          <View style={styles.statItem}>
            <Icon name="trending-up-outline" size={16} color={colors.light.success} />
            <Text style={styles.statText}>{plan.analytics.streak} day streak</Text>
          </View>
        )}
      </View>

      {showJoinButton && (
        <View style={styles.joinButtonContainer}>
          <Button
            variant="secondary"
            title="Join Plan"
            onPress={handleJoin}
            loading={loading}
            style={styles.joinButton}
            size="small"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
  },
  title: {
    ...typography.styles.title1,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: layout.spacing.lg,
    marginBottom: layout.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
    marginHorizontal: layout.spacing.xs,
    borderRadius: layout.borderRadius.md,
    backgroundColor: colors.light.cardBackground,
  },
  activeTab: {
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  tabText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    marginLeft: layout.spacing.xs,
  },
  activeTabText: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for FAB + tab bar
  },
  contentContainer: {
    paddingHorizontal: layout.spacing.lg,
    paddingBottom: 120, // Space for FAB + tab bar
  },
  sectionHeader: {
    marginBottom: layout.spacing.lg,
  },
  sectionTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  sectionSubtitle: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  searchContainer: {
    marginBottom: layout.spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.cardBackground,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
    ...layout.shadows.small,
  },
  searchPlaceholder: {
    ...typography.styles.body,
    color: colors.light.placeholderText,
    marginLeft: layout.spacing.sm,
  },
  plansList: {
    gap: layout.spacing.md,
  },
  planCard: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.lg,
    ...layout.shadows.small,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.sm,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.xs,
  },
  planDescription: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  planMeta: {
    marginLeft: layout.spacing.sm,
  },
  planStats: {
    flexDirection: 'row',
    gap: layout.spacing.lg,
    marginBottom: layout.spacing.sm,
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
  joinButtonContainer: {
    marginTop: layout.spacing.sm,
  },
  joinButton: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xxl,
  },
  emptyTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    marginTop: layout.spacing.lg,
    marginBottom: layout.spacing.sm,
  },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    textAlign: 'center',
    marginBottom: layout.spacing.lg,
  },
  emptyButton: {
    marginTop: layout.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: layout.spacing.xxl,
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100, // Move above the bottom tab bar (80 + 20 padding)
    right: layout.spacing.lg,
    left: layout.spacing.lg,
    zIndex: 999, // Below tab bar but above content
  },
  createButton: {
    ...layout.shadows.medium,
  },
});

export default PlansDashboard;
