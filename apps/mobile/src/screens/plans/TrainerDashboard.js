// src/screens/plans/TrainerDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import useAuth from '../../hooks/useAuth';
import { usePlanContext } from '../../context/PlanContext';

const { width: screenWidth } = Dimensions.get('window');

const TrainerDashboard = ({ navigation, route }) => {
  const { groupId } = route.params;
  const { user } = useAuth();
  const { getPlanById, updatePlan } = usePlanContext();
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      try {
        const groupData = await getPlanById(groupId);
        setGroup(groupData);
      } catch (error) {
        Alert.alert('Error', 'Failed to load group data');
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'home-outline' },
    { id: 'members', label: 'Members', icon: 'people-outline' },
    { id: 'progress', label: 'Progress', icon: 'bar-chart-outline' },
    { id: 'leaderboard', label: 'Leaderboard', icon: 'trophy-outline' },
  ];

  const isOwner = group?.ownerId === user?.id;
  const memberCount = group?.participants?.length || 0;
  const activeMembers = group?.participants?.filter(p => p.status === 'active').length || 0;

  const groupStats = {
    totalMembers: memberCount,
    activeMembers: activeMembers,
    completionRate: group?.analytics?.strictScore || 0,
    averageStreak: group?.analytics?.streak || 0,
    totalPoints: group?.participants?.reduce((sum, p) => sum + (p.points || 0), 0) || 0,
  };

  const handleInviteMembers = () => {
    navigation.navigate('InviteMembers', { groupId });
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleManageMember = (member) => {
    setSelectedMember(member);
    // Show member management modal
  };

  const handleRemoveMember = async (memberId) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove member logic
              Alert.alert('Success', 'Member removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleMakeAdmin = async (member) => {
    Alert.alert(
      'Make Admin',
      `Are you sure you want to make ${member.displayName || member.name || member.userName || 'this member'} an admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Admin',
          onPress: async () => {
            try {
              // Mock make admin logic
              Alert.alert('Success', 'Member promoted to admin successfully');
              // In real implementation, call API to update member role
            } catch (error) {
              Alert.alert('Error', 'Failed to promote member to admin');
            }
          },
        },
      ]
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent group={group} stats={groupStats} />;
      case 'members':
        return <MembersContent 
          group={group} 
          onInviteMembers={handleInviteMembers}
          onEditMember={handleEditMember}
        />;
      case 'progress':
        return <ProgressContent group={group} />;
      case 'leaderboard':
        return <LeaderboardContent group={group} />;
      case 'settings':
        return <SettingsContent group={group} navigation={navigation} onTabChange={setActiveTab} />;
      default:
        return <OverviewContent group={group} stats={groupStats} />;
    }
  };

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading group data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            Trainer Dashboard • {memberCount} members
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleInviteMembers}
          >
            <Icon name="person-add-outline" size={24} color={colors.light.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setActiveTab('settings')}
          >
            <Icon name="settings-outline" size={24} color={colors.light.primaryText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View 
        style={styles.tabsContainer}
      >
        <View style={styles.tabsContent}>
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
              size={18} 
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
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {renderTabContent()}
      </View>

      {/* Member Actions Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showMemberModal}
        onRequestClose={() => setShowMemberModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowMemberModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedMember?.displayName || selectedMember?.name || selectedMember?.userName || 'Member'}
            </Text>
            
            <View style={styles.modalActions}>
              {/* Show Remove and Make Admin options only for group owner */}
              {group?.ownerId === user?.id && (
                <>
                  <TouchableOpacity
                    style={[styles.modalAction, styles.deleteAction]}
                    onPress={() => {
                      setShowMemberModal(false);
                      handleRemoveMember(selectedMember?.userId);
                    }}
                  >
                    <Icon name="trash-outline" size={20} color={colors.light.error} />
                    <Text style={[styles.modalActionText, styles.deleteActionText]}>Remove</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalAction}
                    onPress={() => {
                      setShowMemberModal(false);
                      handleMakeAdmin(selectedMember);
                    }}
                  >
                    <Icon name="shield-outline" size={20} color={colors.light.primaryOrange} />
                    <Text style={styles.modalActionText}>Make Admin</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowMemberModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// Overview Content Component
const OverviewContent = ({ group, stats }) => (
  <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
    {/* Quick Stats */}
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Group Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="people-outline" size={24} color={colors.light.info} />
          <Text style={styles.statValue}>{stats.totalMembers}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="checkmark-circle-outline" size={24} color={colors.light.success} />
          <Text style={styles.statValue}>{stats.activeMembers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="bar-chart-outline" size={24} color={colors.light.primaryOrange} />
          <Text style={styles.statValue}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Completion Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="trophy-outline" size={24} color={colors.light.warning} />
          <Text style={styles.statValue}>{stats.averageStreak}</Text>
          <Text style={styles.statLabel}>Avg Streak</Text>
        </View>
      </View>
    </View>

    {/* Group Info */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Group Information</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={20} color={colors.light.secondaryText} />
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>
            {new Date(group.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="grid-outline" size={20} color={colors.light.secondaryText} />
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>
            {group.category.charAt(0).toUpperCase() + group.category.slice(1)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="bar-chart-outline" size={20} color={colors.light.secondaryText} />
          <Text style={styles.infoLabel}>Tracking:</Text>
          <Text style={styles.infoValue}>
            {group.trackingType.charAt(0).toUpperCase() + group.trackingType.slice(1)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="globe-outline" size={20} color={colors.light.secondaryText} />
          <Text style={styles.infoLabel}>Visibility:</Text>
          <Text style={styles.infoValue}>
            {group.visibility.charAt(0).toUpperCase() + group.visibility.slice(1)}
          </Text>
        </View>
      </View>
    </View>

    {/* Recent Activity */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityCard}>
        <Text style={styles.activityText}>No recent activity</Text>
      </View>
    </View>
  </ScrollView>
);

// Members Content Component
const MembersContent = ({ group, onInviteMembers, onEditMember }) => (
  <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Members ({group.participants?.length || 0})</Text>
        <Button
          variant="primary"
          title="Invite Members"
          onPress={onInviteMembers}
          style={styles.inviteButton}
        />
      </View>

      {group.participants?.map((member) => (
        <MemberCard
          key={member.userId}
          member={member}
          onEdit={onEditMember}
        />
      ))}
    </View>
  </ScrollView>
);

// Progress Content Component
const ProgressContent = ({ group }) => (
  <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Progress Overview</Text>
      
      {/* Progress Chart Placeholder */}
      <View style={styles.chartCard}>
        <Text style={styles.chartPlaceholder}>Progress Chart</Text>
        <Text style={styles.chartDescription}>
          Visual representation of group progress over time
        </Text>
      </View>

      {/* Individual Progress */}
      <Text style={styles.sectionTitle}>Individual Progress</Text>
      {group.participants?.map((member) => (
        <ProgressCard key={member.userId} member={member} />
      ))}
    </View>
  </ScrollView>
);

// Leaderboard Content Component
const LeaderboardContent = ({ group }) => {
  const sortedMembers = group.participants?.sort((a, b) => (b.points || 0) - (a.points || 0)) || [];

  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        
        {sortedMembers.map((member, index) => (
          <LeaderboardCard
            key={member.userId}
            member={member}
            rank={index + 1}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// Settings Content Component
const SettingsContent = ({ group, navigation, onTabChange }) => {
  const { deletePlan, updatePlan } = usePlanContext();
  const handleEditGroupInfo = () => {
    Alert.prompt(
      'Edit Group Title',
      'Enter new group title:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: async (newTitle) => {
            if (newTitle && newTitle.trim()) {
              try {
                // Update group title using plan context
                await updatePlan(group?.id, { 
                  title: newTitle.trim(),
                  updatedAt: new Date().toISOString()
                });
                
                Alert.alert('Success', `Group title updated to: "${newTitle.trim()}"`);
              } catch (error) {
                Alert.alert('Error', `Failed to update group title: ${error.message}`);
              }
            } else {
              Alert.alert('Error', 'Please enter a valid group title');
            }
          }
        }
      ],
      'plain-text',
      group?.title || ''
    );
  };

  const handleManageMembers = () => {
    Alert.alert(
      'Manage Members',
      `Current members: ${group?.members?.length || 0}\n\nWhat would you like to do?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View All', onPress: () => {
          // Switch to members tab
          onTabChange('members');
        }},
        { text: 'Invite More', onPress: () => {
          // Navigate to invite members
          navigation.navigate('InviteMembers', { groupId: group?.id });
        }}
      ]
    );
  };

  const handleShareGroup = () => {
    const shareLink = `https://flowapp.com/join/${group?.id}`;
    Alert.alert(
      'Share Group',
      `Share this group with others:\n\n${shareLink}\n\nCopy link to clipboard?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy Link', onPress: () => {
          // Copy to clipboard (simulated)
          Alert.alert('Copied!', 'Group link copied to clipboard');
        }},
        { text: 'Share via App', onPress: () => {
          Alert.alert('Share Options', 'Choose how to share:', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'WhatsApp', onPress: () => Alert.alert('Shared', 'Shared via WhatsApp') },
            { text: 'Email', onPress: () => Alert.alert('Shared', 'Shared via Email') },
            { text: 'SMS', onPress: () => Alert.alert('Shared', 'Shared via SMS') }
          ]);
        }}
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CSV', onPress: () => {
          Alert.alert('Exporting...', 'Generating CSV file...', [], { cancelable: false });
          setTimeout(() => {
            Alert.alert('Export Complete', 'CSV file saved to Downloads folder');
          }, 2000);
        }},
        { text: 'PDF Report', onPress: () => {
          Alert.alert('Exporting...', 'Generating PDF report...', [], { cancelable: false });
          setTimeout(() => {
            Alert.alert('Export Complete', 'PDF report saved to Downloads folder');
          }, 3000);
        }},
        { text: 'JSON Data', onPress: () => {
          Alert.alert('Exporting...', 'Generating JSON data...', [], { cancelable: false });
          setTimeout(() => {
            Alert.alert('Export Complete', 'JSON file saved to Downloads folder');
          }, 1500);
        }}
      ]
    );
  };

  const handleDeleteGroup = async () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group?.title}"?\n\nThis will permanently remove:\n• All group data\n• ${group?.members?.length || 0} members\n• All progress tracking\n• Group history\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Group', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure you want to permanently delete this group?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Forever', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      Alert.alert('Deleting...', 'Removing group and all data...', [], { cancelable: false });
                      
                      // Actually delete the group using plan context
                      await deletePlan(group?.id, false); // false = hard delete
                      
                      Alert.alert(
                        'Group Deleted',
                        'Group has been permanently deleted.',
                        [
                          { 
                            text: 'OK', 
                            onPress: () => {
                              // Navigate back to plans dashboard
                              navigation.getParent()?.navigate('Plans', { 
                                screen: 'PlansDashboard',
                                params: { initialTab: 'groups' }
                              });
                            }
                          }
                        ]
                      );
                    } catch (error) {
                      Alert.alert(
                        'Delete Failed',
                        `Failed to delete group: ${error.message}`,
                        [{ text: 'OK' }]
                      );
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group Settings</Text>
        
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingItem} onPress={handleEditGroupInfo}>
            <Icon name="create-outline" size={20} color={colors.light.primaryOrange} />
            <Text style={styles.settingLabel}>Edit Group Info</Text>
            <Icon name="chevron-forward-outline" size={16} color={colors.light.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleManageMembers}>
            <Icon name="people-outline" size={20} color={colors.light.info} />
            <Text style={styles.settingLabel}>Manage Members</Text>
            <Icon name="chevron-forward-outline" size={16} color={colors.light.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleShareGroup}>
            <Icon name="share-outline" size={20} color={colors.light.success} />
            <Text style={styles.settingLabel}>Share Group</Text>
            <Icon name="chevron-forward-outline" size={16} color={colors.light.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <Icon name="analytics-outline" size={20} color={colors.light.warning} />
            <Text style={styles.settingLabel}>Export Data</Text>
            <Icon name="chevron-forward-outline" size={16} color={colors.light.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, styles.dangerSettingItem]} onPress={handleDeleteGroup}>
            <Icon name="trash-outline" size={20} color={colors.light.error} />
            <Text style={[styles.settingLabel, styles.dangerSettingLabel]}>Delete Group</Text>
            <Icon name="chevron-forward-outline" size={16} color={colors.light.error} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Member Card Component
const MemberCard = ({ member, onEdit }) => (
  <View style={styles.memberCard}>
    <View style={styles.memberInfo}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {(member.displayName || member.name || member.userName || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberDetails}>
        <Text style={styles.memberName} numberOfLines={2}>{member.displayName || member.name || member.userName || 'Unknown User'}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
        <Text style={styles.memberJoined}>
          Joined {new Date(member.joinedAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
    <View style={styles.memberStats}>
      <View style={styles.memberStat}>
        <Text style={styles.memberStatValue}>{member.points || 0}</Text>
        <Text style={styles.memberStatLabel}>Points</Text>
      </View>
      <View style={styles.memberStat}>
        <Text style={styles.memberStatValue}>{member.streak || 0}</Text>
        <Text style={styles.memberStatLabel}>Streak</Text>
      </View>
    </View>
    <TouchableOpacity
      style={styles.memberEditButton}
      onPress={() => onEdit(member)}
    >
      <Icon name="create-outline" size={20} color={colors.light.primaryOrange} />
    </TouchableOpacity>
  </View>
);

// Progress Card Component
const ProgressCard = ({ member }) => (
  <View style={styles.progressCard}>
    <View style={styles.progressHeader}>
      <Text style={styles.progressMemberName}>{member.displayName || member.name || member.userName || 'Unknown User'}</Text>
      <Text style={styles.progressPercentage}>{member.completionRate || 0}%</Text>
    </View>
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressFill, 
          { width: `${member.completionRate || 0}%` }
        ]} 
      />
    </View>
    <View style={styles.progressStats}>
      <Text style={styles.progressStat}>Points: {member.points || 0}</Text>
      <Text style={styles.progressStat}>Streak: {member.streak || 0}</Text>
    </View>
  </View>
);

// Leaderboard Card Component
const LeaderboardCard = ({ member, rank }) => {
  const getRankIcon = (rank) => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'ribbon';
    return 'ellipse';
  };

  const getRankColor = (rank) => {
    if (rank === 1) return colors.light.warning;
    if (rank === 2) return colors.light.secondaryText;
    if (rank === 3) return '#CD7F32'; // Bronze color
    return colors.light.secondaryText;
  };

  return (
    <View style={styles.leaderboardCard}>
      <View style={styles.leaderboardRank}>
        <Icon 
          name={getRankIcon(rank)} 
          size={24} 
          color={getRankColor(rank)} 
        />
        <Text style={styles.leaderboardRankText}>#{rank}</Text>
      </View>
      <View style={styles.leaderboardInfo}>
        <Text style={styles.leaderboardName}>{member.displayName || member.name || member.userName || 'Unknown User'}</Text>
        <Text style={styles.leaderboardPoints}>{member.points || 0} points</Text>
      </View>
      <View style={styles.leaderboardStats}>
        <Text style={styles.leaderboardStat}>{member.streak || 0} day streak</Text>
        <Text style={styles.leaderboardStat}>{member.completionRate || 0}% completion</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    padding: layout.spacing.sm,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: layout.spacing.md,
  },
  headerTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginTop: layout.spacing.xs,
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    height: 48,
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: layout.spacing.md,
    alignItems: 'center',
    height: 48,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.md,
    marginRight: layout.spacing.xs,
    gap: layout.spacing.xs,
    height: 36,
    flex: 1,
    justifyContent: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  sectionTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
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
  infoCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
    gap: layout.spacing.sm,
  },
  infoLabel: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    fontWeight: '500',
  },
  infoValue: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    alignItems: 'center',
    ...layout.shadows.small,
  },
  activityText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  inviteButton: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
  },
  memberCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.lg,
    marginBottom: layout.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    ...layout.shadows.small,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    ...typography.styles.body,
    color: colors.light.cardBackground,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
    minWidth: 0, // Allows flex to shrink properly
  },
  memberName: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberJoined: {
    ...typography.styles.caption2,
    color: colors.light.secondaryText,
  },
  memberStats: {
    flexDirection: 'row',
    gap: layout.spacing.md,
    marginHorizontal: layout.spacing.md,
  },
  memberStat: {
    alignItems: 'center',
  },
  memberStatValue: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  memberStatLabel: {
    ...typography.styles.caption2,
    color: colors.light.secondaryText,
  },
  memberEditButton: {
    padding: layout.spacing.sm,
    borderRadius: layout.borderRadius.md,
    backgroundColor: colors.light.progressBackground,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.xl,
    borderRadius: layout.borderRadius.lg,
    alignItems: 'center',
    marginBottom: layout.spacing.lg,
    ...layout.shadows.small,
  },
  chartPlaceholder: {
    ...typography.styles.title3,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.sm,
  },
  chartDescription: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    marginBottom: layout.spacing.md,
    ...layout.shadows.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  progressMemberName: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  progressPercentage: {
    ...typography.styles.title3,
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.light.progressBackground,
    borderRadius: 4,
    marginBottom: layout.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.light.primaryOrange,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    gap: layout.spacing.md,
  },
  progressStat: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  leaderboardCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    marginBottom: layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...layout.shadows.small,
  },
  leaderboardRank: {
    alignItems: 'center',
    marginRight: layout.spacing.md,
    width: 60,
  },
  leaderboardRankText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginTop: layout.spacing.xs,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  leaderboardPoints: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '500',
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  leaderboardStat: {
    ...typography.styles.caption2,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.xs,
  },
  settingsCard: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    ...layout.shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    gap: layout.spacing.md,
  },
  dangerSettingItem: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '500',
    flex: 1,
  },
  dangerSettingLabel: {
    color: colors.light.error,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.xl,
    marginHorizontal: layout.spacing.lg,
    minWidth: 280,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.lg,
    textAlign: 'center',
  },
  modalActions: {
    width: '100%',
    marginBottom: layout.spacing.lg,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.lg,
    borderRadius: layout.borderRadius.md,
    backgroundColor: colors.light.progressBackground,
    marginBottom: layout.spacing.sm,
    gap: layout.spacing.sm,
  },
  deleteAction: {
    backgroundColor: colors.light.error + '10',
  },
  modalActionText: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '500',
  },
  deleteActionText: {
    color: colors.light.error,
  },
  modalCancelButton: {
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.xl,
  },
  modalCancelText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    fontWeight: '500',
  },
});

export default TrainerDashboard;
