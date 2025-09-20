// src/screens/plans/ModernPlansDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import useAuth from '../../hooks/useAuth';
import { usePlanContext } from '../../context/PlanContext';
import { FlowsContext } from '../../context/FlowContext';

const { width: screenWidth } = Dimensions.get('window');

const ModernPlansDashboard = ({ navigation, route }) => {
  const { user } = useAuth();
  const { 
    personalPlans, 
    publicPlans, 
    favouritePlans, 
    getPlansByKind,
    getPlansByTag 
  } = usePlanContext();
  
  // Get flows from FlowContext (Flow/Habit plans)
  const { flows, activeFlows } = useContext(FlowsContext) || { flows: [], activeFlows: [] };
  
  const insets = useSafeAreaInsets();

  // State management - Set initial tab from route params
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'all',
    status: 'all',
    type: 'all',
    sortBy: 'recent'
  });

  // Filter options
  const filterOptions = {
    category: [
      { id: 'all', label: 'All Categories', icon: 'grid-outline' },
      { id: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
      { id: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline' },
      { id: 'learning', label: 'Learning', icon: 'book-outline' },
      { id: 'productivity', label: 'Productivity', icon: 'checkmark-circle-outline' },
      { id: 'social', label: 'Social', icon: 'people-outline' },
      { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
    ],
    status: [
      { id: 'all', label: 'All Status', icon: 'list-outline' },
      { id: 'active', label: 'Active', icon: 'play-circle-outline' },
      { id: 'draft', label: 'Draft', icon: 'create-outline' },
      { id: 'archived', label: 'Archived', icon: 'archive-outline' },
    ],
    type: [
      { id: 'all', label: 'All Types', icon: 'apps-outline' },
      { id: 'personal', label: 'Personal', icon: 'person-outline' },
      { id: 'group', label: 'Group', icon: 'people-outline' },
      { id: 'public', label: 'Public', icon: 'globe-outline' },
    ],
    sortBy: [
      { id: 'recent', label: 'Most Recent', icon: 'time-outline' },
      { id: 'popular', label: 'Most Popular', icon: 'trending-up-outline' },
      { id: 'alphabetical', label: 'A-Z', icon: 'text-outline' },
      { id: 'progress', label: 'Progress', icon: 'bar-chart-outline' },
    ]
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home-outline' },
    { id: 'my-plans', label: 'My Plans', icon: 'person-outline' },
    { id: 'groups', label: 'Groups', icon: 'people-outline' },
    { id: 'explore', label: 'Explore', icon: 'compass-outline' },
    { id: 'watchlist', label: 'Watchlist', icon: 'bookmark-outline' },
  ];

  // Filter plans based on current filters
  const getFilteredPlans = () => {
    let plans = [];
    
    // Ensure we have arrays to work with
    const safePersonalPlans = Array.isArray(personalPlans) ? personalPlans : [];
    const safePublicPlans = Array.isArray(publicPlans) ? publicPlans : [];
    const safeFavouritePlans = Array.isArray(favouritePlans) ? favouritePlans : [];
    
    switch (activeTab) {
      case 'my-plans':
        plans = safePersonalPlans;
        break;
      case 'groups':
        plans = safePersonalPlans.filter(plan => plan.planKind === 'Group');
        break;
      case 'explore':
        plans = safePublicPlans;
        break;
      case 'watchlist':
        plans = safeFavouritePlans;
        break;
      default:
        plans = [...safePersonalPlans, ...safePublicPlans];
    }

    // Apply filters
    if (selectedFilters.category !== 'all') {
      plans = plans.filter(plan => plan.category === selectedFilters.category);
    }
    
    if (selectedFilters.status !== 'all') {
      plans = plans.filter(plan => plan.status === selectedFilters.status);
    }
    
    if (selectedFilters.type !== 'all') {
      if (selectedFilters.type === 'personal') {
        plans = plans.filter(plan => plan.ownerId === user?.id);
      } else if (selectedFilters.type === 'group') {
        plans = plans.filter(plan => plan.planKind === 'Group');
      } else if (selectedFilters.type === 'public') {
        plans = plans.filter(plan => plan.visibility === 'public');
      }
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      plans = plans.filter(plan => 
        plan.title?.toLowerCase().includes(query) ||
        plan.description?.toLowerCase().includes(query) ||
        plan.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    switch (selectedFilters.sortBy) {
      case 'recent':
        plans.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'popular':
        plans.sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));
        break;
      case 'alphabetical':
        plans.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'progress':
        plans.sort((a, b) => (b.analytics?.strictScore || 0) - (a.analytics?.strictScore || 0));
        break;
    }

    return plans;
  };

  const filteredPlans = getFilteredPlans();

  const handleCreatePlan = () => {
    // Navigate directly to AddFlow instead of CreatePlanWizard
    navigation.getParent()?.navigate('AddFlow');
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroupWizard');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent navigation={navigation} plans={filteredPlans} />;
      case 'my-plans':
        return <MyPlansContent navigation={navigation} plans={filteredPlans} />;
      case 'groups':
        return <GroupsContent navigation={navigation} plans={filteredPlans} />;
      case 'explore':
        return <ExploreContent navigation={navigation} plans={filteredPlans} />;
      case 'watchlist':
        return <WatchlistContent navigation={navigation} plans={filteredPlans} />;
      default:
        return <OverviewContent navigation={navigation} plans={filteredPlans} />;
    }
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Icon name="close-outline" size={24} color={colors.light.primaryText} />
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setSelectedFilters({
            category: 'all',
            status: 'all',
            type: 'all',
            sortBy: 'recent'
          })}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {Object.entries(filterOptions).map(([filterType, options]) => (
            <View key={filterType} style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              <View style={styles.filterOptions}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterOption,
                      selectedFilters[filterType] === option.id && styles.selectedFilterOption
                    ]}
                    onPress={() => setSelectedFilters(prev => ({
                      ...prev,
                      [filterType]: option.id
                    }))}
                  >
                    <Icon 
                      name={option.icon} 
                      size={20} 
                      color={selectedFilters[filterType] === option.id ? colors.light.primaryOrange : colors.light.secondaryText} 
                    />
                    <Text style={[
                      styles.filterOptionText,
                      selectedFilters[filterType] === option.id && styles.selectedFilterOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.filterFooter}>
          <Button
            variant="primary"
            title="Apply Filters"
            onPress={() => setShowFilters(false)}
            style={styles.applyButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Plans</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilters(true)}
            >
              <Icon name="filter-outline" size={24} color={colors.light.primaryText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleCreatePlan}
            >
              <Icon name="add-outline" size={24} color={colors.light.primaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search-outline" size={20} color={colors.light.secondaryText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search plans, groups, or tags..."
              placeholderTextColor={colors.light.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle-outline" size={20} color={colors.light.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.id ? colors.light.primaryOrange : colors.light.secondaryText} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {renderTabContent()}
      </View>

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 100 }]}>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={handleCreateGroup}
        >
          <Icon name="people-outline" size={24} color={colors.light.cardBackground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabPrimary}
          onPress={handleCreatePlan}
        >
          <Icon name="add-outline" size={28} color={colors.light.cardBackground} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

// Overview Content Component
const OverviewContent = ({ navigation, plans }) => {
  const { user } = useAuth();
  const { personalPlans, publicPlans, favouritePlans } = usePlanContext();
  const { flows, activeFlows } = useContext(FlowsContext) || { flows: [], activeFlows: [] };

  // Ensure we have arrays to work with
  const safePersonalPlans = Array.isArray(personalPlans) ? personalPlans : [];
  const safePublicPlans = Array.isArray(publicPlans) ? publicPlans : [];
  const safeFavouritePlans = Array.isArray(favouritePlans) ? favouritePlans : [];
  const safeFlows = Array.isArray(flows) ? flows : [];
  const safeActiveFlows = Array.isArray(activeFlows) ? activeFlows : [];

  // Use unique plans for overview (recent from all sources)
  const overviewPlans = [...safePersonalPlans, ...safePublicPlans].slice(0, 3);
  const overviewFlows = safeActiveFlows.slice(0, 3);

  const stats = {
    totalPlans: safePersonalPlans.length + safeActiveFlows.length, // Include flows
    activePlans: safePersonalPlans.filter(p => p.status === 'active').length + safeActiveFlows.length,
    groupsJoined: safePersonalPlans.filter(p => p.planKind === 'Group' && p.participants?.some(part => part.userId === user?.id)).length,
    watchlistCount: safeFavouritePlans.length,
  };

  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="list-outline" size={24} color={colors.light.primaryOrange} />
            <Text style={styles.statValue}>{stats.totalPlans}</Text>
            <Text style={styles.statLabel}>Total Plans</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="play-circle-outline" size={24} color={colors.light.success} />
            <Text style={styles.statValue}>{stats.activePlans}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="people-outline" size={24} color={colors.light.info} />
            <Text style={styles.statValue}>{stats.groupsJoined}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="bookmark-outline" size={24} color={colors.light.warning} />
            <Text style={styles.statValue}>{stats.watchlistCount}</Text>
            <Text style={styles.statLabel}>Watchlist</Text>
          </View>
        </View>
      </View>

      {/* Flow/Habit Plans */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Flow Habits ({overviewFlows.length})</Text>
        {overviewFlows.length > 0 ? (
          overviewFlows.map((flow, index) => (
            <FlowCard key={`overview-flow-${flow.id || flow.title || index}-${index}`} flow={flow} navigation={navigation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="create-outline" size={48} color={colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>No flow habits yet</Text>
            <Text style={styles.emptySubtitle}>Create your first flow habit</Text>
            <Button
              variant="primary"
              title="Add Flow"
              onPress={() => navigation.getParent()?.navigate('AddFlow')}
              style={styles.emptyActionButton}
            />
          </View>
        )}
      </View>

      {/* Group Plans */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group Plans ({overviewPlans.length})</Text>
        {overviewPlans.length > 0 ? (
          overviewPlans.map((plan, index) => (
            <PlanCard key={`overview-group-${plan.id || plan.title || index}-${index}`} plan={plan} navigation={navigation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={48} color={colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>No group plans yet</Text>
            <Text style={styles.emptySubtitle}>Create or join a group plan</Text>
            <Button
              variant="primary"
              title="Create Group"
              onPress={() => navigation.navigate('CreateGroupWizard')}
              style={styles.emptyActionButton}
            />
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('AddFlow')}
          >
            <Icon name="add-circle-outline" size={32} color={colors.light.primaryOrange} />
            <Text style={styles.quickActionText}>Add Flow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('CreateGroupWizard')}
          >
            <Icon name="people-circle-outline" size={32} color={colors.light.info} />
            <Text style={styles.quickActionText}>Create Group</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ExplorePlans')}
          >
            <Icon name="compass-outline" size={32} color={colors.light.success} />
            <Text style={styles.quickActionText}>Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// My Plans Content Component
const MyPlansContent = ({ navigation, plans }) => {
  const { personalPlans } = usePlanContext();
  const { activeFlows } = useContext(FlowsContext) || { activeFlows: [] };
  
  const safePersonalPlans = Array.isArray(personalPlans) ? personalPlans : [];
  const safeActiveFlows = Array.isArray(activeFlows) ? activeFlows : [];
  
  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Flow Habits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Flow Habits ({safeActiveFlows.length})</Text>
        {safeActiveFlows.length > 0 ? (
          safeActiveFlows.map((flow, index) => (
            <FlowCard key={`my-flow-${flow.id || index}`} flow={flow} navigation={navigation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="create-outline" size={48} color={colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>No flow habits yet</Text>
            <Text style={styles.emptySubtitle}>Create your first flow habit</Text>
            <Button
              variant="primary"
              title="Add Flow"
              onPress={() => navigation.getParent()?.navigate('AddFlow')}
              style={styles.emptyActionButton}
            />
          </View>
        )}
      </View>

      {/* Group Plans Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Group Plans ({safePersonalPlans.length})</Text>
        {safePersonalPlans.length > 0 ? (
          safePersonalPlans.map((plan, index) => (
            <PlanCard key={`my-plan-${plan.id || index}`} plan={plan} navigation={navigation} showActions />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={48} color={colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>No group plans yet</Text>
            <Text style={styles.emptySubtitle}>Create your first group plan</Text>
            <Button
              variant="primary"
              title="Create Group"
              onPress={() => navigation.navigate('CreateGroupWizard')}
              style={styles.emptyActionButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Groups Content Component
const GroupsContent = ({ navigation, plans }) => {
  const { personalPlans } = usePlanContext();
  const safePersonalPlans = Array.isArray(personalPlans) ? personalPlans : [];
  const groupPlans = safePersonalPlans.filter(plan => plan.planKind === 'Group');
  
  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Groups ({groupPlans.length})</Text>
        {groupPlans.length > 0 ? (
          groupPlans.map((plan, index) => (
            <GroupCard key={`group-${plan.id || index}`} plan={plan} navigation={navigation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={48} color={colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptySubtitle}>Create or join a group to collaborate</Text>
            <Button
              variant="primary"
              title="Create Group"
              onPress={() => navigation.navigate('CreateGroupWizard')}
              style={styles.emptyActionButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Explore Content Component
const ExploreContent = ({ navigation, plans }) => {
  const { publicPlans } = usePlanContext();
  const safePublicPlans = Array.isArray(publicPlans) ? publicPlans : [];
  
  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore Plans ({safePublicPlans.length})</Text>
        {safePublicPlans.length > 0 ? (
          safePublicPlans.map((plan, index) => (
            <PlanCard key={`explore-${plan.id || plan.title || index}-${index}`} plan={plan} navigation={navigation} showJoinButton />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="compass-outline" size={48} color={colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>No plans to explore</Text>
            <Text style={styles.emptySubtitle}>Check back later for new plans</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Watchlist Content Component
const WatchlistContent = ({ navigation, plans }) => {
  const { favouritePlans } = usePlanContext();
  const safeFavouritePlans = Array.isArray(favouritePlans) ? favouritePlans : [];
  
  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watchlist ({safeFavouritePlans.length})</Text>
        {safeFavouritePlans.length > 0 ? (
          safeFavouritePlans.map((plan, index) => (
            <PlanCard key={`watchlist-${plan.id || index}`} plan={plan} navigation={navigation} showWatchlistActions />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="bookmark-outline" size={48} color={colors.light.secondaryText} />
            <Text style={styles.emptyTitle}>No saved plans</Text>
            <Text style={styles.emptySubtitle}>Save plans you're interested in</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Flow Card Component (for Flow/Habit plans)
const FlowCard = ({ flow, navigation }) => {
  // Handle missing flow data gracefully
  if (!flow) return null;

  const getTrackingTypeIcon = (trackingType) => {
    switch (trackingType) {
      case 'Binary': return 'checkmark-circle-outline';
      case 'Quantitative': return 'bar-chart-outline';
      case 'Time-based': return 'time-outline';
      default: return 'ellipse-outline';
    }
  };

  const getTrackingTypeColor = (trackingType) => {
    switch (trackingType) {
      case 'Binary': return colors.light.success;
      case 'Quantitative': return colors.light.info;
      case 'Time-based': return colors.light.warning;
      default: return colors.light.secondaryText;
    }
  };

  const handlePress = () => {
    navigation.navigate('UnifiedPlanDetail', { planId: flow.id, planType: 'flow' });
  };

  return (
    <TouchableOpacity
      style={styles.planCard}
      onPress={handlePress}
    >
      <View style={styles.planCardHeader}>
        <View style={styles.planCardTitleRow}>
          <Icon
            name={getTrackingTypeIcon(flow.trackingType)}
            size={20}
            color={getTrackingTypeColor(flow.trackingType)}
          />
          <Text style={styles.planCardTitle} numberOfLines={1}>
            {flow.title || 'Untitled Flow'}
          </Text>
        </View>
        <View style={styles.planCardBadges}>
          <View style={[styles.statusBadge, { backgroundColor: colors.light.success + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: colors.light.success }]}>
              Flow
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.planCardDescription} numberOfLines={2}>
        {flow.description || 'No description available'}
      </Text>

      <View style={styles.planCardFooter}>
        <View style={styles.planCardStats}>
          <View style={styles.planCardStat}>
            <Icon name="analytics-outline" size={16} color={colors.light.secondaryText} />
            <Text style={styles.planCardStatText}>
              {flow.trackingType}
            </Text>
          </View>
          <View style={styles.planCardStat}>
            <Icon name="calendar-outline" size={16} color={colors.light.secondaryText} />
            <Text style={styles.planCardStatText}>
              {flow.frequency || 'Daily'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Plan Card Component
const PlanCard = ({ plan, navigation, showActions = false, showJoinButton = false, showWatchlistActions = false }) => {
  // Handle missing plan data gracefully
  if (!plan) return null;

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

  const getStatusColor = (status) => {
    const colors_map = {
      active: colors.light.success,
      draft: colors.light.warning,
      archived: colors.light.secondaryText,
    };
    return colors_map[status] || colors.light.secondaryText;
  };

  return (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => navigation.navigate('UnifiedPlanDetail', { planId: plan.id, planType: 'group' })}
    >
      <View style={styles.planCardHeader}>
        <View style={styles.planCardTitleRow}>
          <Icon
            name={getCategoryIcon(plan.category)}
            size={20}
            color={colors.light.primaryOrange}
          />
          <Text style={styles.planCardTitle} numberOfLines={1}>
            {plan.title || 'Untitled Plan'}
          </Text>
        </View>
        <View style={styles.planCardBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plan.status) + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(plan.status) }]}>
              {plan.status || 'active'}
            </Text>
          </View>
          {plan.visibility === 'public' && (
            <View style={styles.visibilityBadge}>
              <Icon name="globe-outline" size={12} color={colors.light.secondaryText} />
            </View>
          )}
        </View>
      </View>

      <Text style={styles.planCardDescription} numberOfLines={2}>
        {plan.description || 'No description available'}
      </Text>

      <View style={styles.planCardFooter}>
        <View style={styles.planCardStats}>
          <View style={styles.planCardStat}>
            <Icon name="people-outline" size={16} color={colors.light.secondaryText} />
            <Text style={styles.planCardStatText}>
              {plan.participants?.length || 0}
            </Text>
          </View>
          {plan.analytics && (
            <View style={styles.planCardStat}>
              <Icon name="trending-up-outline" size={16} color={colors.light.success} />
              <Text style={styles.planCardStatText}>
                {plan.analytics.streak || 0} day streak
              </Text>
            </View>
          )}
        </View>

        {showActions && (
          <View style={styles.planCardActions}>
            <TouchableOpacity style={styles.planCardAction}>
              <Icon name="create-outline" size={16} color={colors.light.primaryOrange} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.planCardAction}>
              <Icon name="share-outline" size={16} color={colors.light.primaryOrange} />
            </TouchableOpacity>
          </View>
        )}

        {showJoinButton && (
          <Button
            variant="primary"
            title="Join"
            onPress={() => {}}
            style={styles.joinButton}
          />
        )}

        {showWatchlistActions && (
          <View style={styles.planCardActions}>
            <TouchableOpacity style={styles.planCardAction}>
              <Icon name="heart-outline" size={16} color={colors.light.error} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.planCardAction}>
              <Icon name="share-outline" size={16} color={colors.light.primaryOrange} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Group Card Component
const GroupCard = ({ plan, navigation }) => {
  // Handle missing plan data gracefully
  if (!plan) return null;

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

  return (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('TrainerDashboard', { groupId: plan.id })}
    >
      <View style={styles.groupCardHeader}>
        <View style={styles.groupCardTitleRow}>
          <Icon
            name={getCategoryIcon(plan.category)}
            size={24}
            color={colors.light.primaryOrange}
          />
          <View style={styles.groupCardTitleContainer}>
            <Text style={styles.groupCardTitle} numberOfLines={1}>
              {plan.title || 'Untitled Group'}
            </Text>
            <Text style={styles.groupCardSubtitle}>
              Group • {plan.participants?.length || 0} members
            </Text>
          </View>
        </View>
        <View style={styles.groupCardBadge}>
          <Icon name="people-outline" size={16} color={colors.light.info} />
        </View>
      </View>

      <Text style={styles.groupCardDescription} numberOfLines={2}>
        {plan.description || 'No description available'}
      </Text>

      <View style={styles.groupCardFooter}>
        <View style={styles.groupCardStats}>
          <View style={styles.groupCardStat}>
            <Icon name="trending-up-outline" size={16} color={colors.light.success} />
            <Text style={styles.groupCardStatText}>
              {plan.analytics?.streak || 0} day streak
            </Text>
          </View>
          <View style={styles.groupCardStat}>
            <Icon name="bar-chart-outline" size={16} color={colors.light.primaryOrange} />
            <Text style={styles.groupCardStatText}>
              {plan.analytics?.strictScore || 0}% completion
            </Text>
          </View>
        </View>
        <Button
          variant="secondary"
          title="View Group"
          onPress={() => navigation.navigate('TrainerDashboard', { groupId: plan.id })}
          style={styles.viewGroupButton}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: layout.spacing.lg,
    paddingBottom: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  headerTitle: {
    ...typography.styles.largeTitle,
    color: colors.light.primaryText,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  headerButton: {
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
    backgroundColor: colors.light.cardBackground,
  },
  searchContainer: {
    marginBottom: layout.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    gap: layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.light.primaryText,
  },
  tabsContainer: {
    marginBottom: layout.spacing.sm,
  },
  tabsContent: {
    paddingRight: layout.spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.lg,
    marginRight: layout.spacing.sm,
    gap: layout.spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  tabText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: layout.spacing.lg,
    paddingBottom: layout.spacing.lg,
  },
  section: {
    marginBottom: layout.spacing.xl,
  },
  sectionTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
    fontWeight: '600',
  },
  statsSection: {
    marginTop: layout.spacing.lg,
    marginBottom: layout.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: layout.spacing.md,
  },
  statCard: {
    width: (screenWidth - layout.spacing.lg * 2 - layout.spacing.md) / 2,
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    alignItems: 'center',
    ...layout.shadows.small,
  },
  statValue: {
    ...typography.styles.largeTitle,
    color: colors.light.primaryText,
    fontWeight: '700',
    marginTop: layout.spacing.sm,
  },
  statLabel: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginTop: layout.spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layout.spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    alignItems: 'center',
    ...layout.shadows.small,
  },
  quickActionText: {
    ...typography.styles.caption1,
    color: colors.light.primaryText,
    marginTop: layout.spacing.sm,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    marginBottom: layout.spacing.md,
    ...layout.shadows.small,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.sm,
  },
  planCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: layout.spacing.sm,
  },
  planCardTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    flex: 1,
  },
  planCardBadges: {
    flexDirection: 'row',
    gap: layout.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
  },
  statusBadgeText: {
    ...typography.styles.caption2,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  visibilityBadge: {
    padding: layout.spacing.xs,
  },
  planCardDescription: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.md,
    lineHeight: 20,
  },
  planCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardStats: {
    flexDirection: 'row',
    gap: layout.spacing.md,
  },
  planCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  planCardStatText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  planCardActions: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  planCardAction: {
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.sm,
    backgroundColor: colors.light.progressBackground,
  },
  joinButton: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    marginBottom: layout.spacing.md,
    ...layout.shadows.small,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.sm,
  },
  groupCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: layout.spacing.md,
  },
  groupCardTitleContainer: {
    flex: 1,
  },
  groupCardTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  groupCardSubtitle: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginTop: layout.spacing.xs,
  },
  groupCardBadge: {
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.sm,
    backgroundColor: colors.light.info + '20',
  },
  groupCardDescription: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.md,
    lineHeight: 20,
  },
  groupCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupCardStats: {
    flexDirection: 'row',
    gap: layout.spacing.md,
  },
  groupCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  groupCardStatText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  viewGroupButton: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: layout.spacing.xl,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.small,
  },
  emptyTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginTop: layout.spacing.md,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    marginTop: layout.spacing.sm,
    textAlign: 'center',
  },
  emptyActionButton: {
    marginTop: layout.spacing.lg,
    paddingHorizontal: layout.spacing.xl,
  },
  fabContainer: {
    position: 'absolute',
    right: layout.spacing.lg,
    alignItems: 'center',
    gap: layout.spacing.md,
  },
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    ...layout.shadows.large,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.info,
    alignItems: 'center',
    justifyContent: 'center',
    ...layout.shadows.medium,
  },
  filterModal: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  filterTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  resetText: {
    ...typography.styles.body,
    color: colors.light.primaryOrange,
    fontWeight: '500',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: layout.spacing.lg,
  },
  filterSection: {
    marginBottom: layout.spacing.xl,
  },
  filterSectionTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
    fontWeight: '600',
  },
  filterOptions: {
    gap: layout.spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    backgroundColor: colors.light.cardBackground,
    gap: layout.spacing.sm,
  },
  selectedFilterOption: {
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  filterOptionText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  selectedFilterOptionText: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  filterFooter: {
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  applyButton: {
    width: '100%',
  },
});

export default ModernPlansDashboard;
