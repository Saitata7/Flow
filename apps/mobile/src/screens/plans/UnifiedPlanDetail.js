// src/screens/plans/UnifiedPlanDetail.js
import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import { FlowsContext } from '../../context/FlowContext';
import { usePlanContext } from '../../context/PlanContext';
import useAuth from '../../hooks/useAuth';
import FlowCalendar from '../../components/flow/FlowCalendar';
import moment from 'moment';

const UnifiedPlanDetail = ({ navigation, route }) => {
  const { planId, planType = 'flow' } = route.params; // planType: 'flow' or 'group'
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Contexts
  const { flows, updateFlow, updateFlowStatus } = useContext(FlowsContext) || {};
  const { 
    personalPlans, 
    publicPlans, 
    joinPlan, 
    leavePlan, 
    addToFavourites, 
    removeFromFavourites,
    deletePlan,
    updatePlan 
  } = usePlanContext();
  
  // State
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month'));
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  
  // Get the plan/flow data
  const planData = useMemo(() => {
    if (planType === 'flow') {
      return flows.find(f => f.id === planId) || null;
    } else {
      return [...personalPlans, ...publicPlans].find(p => p.id === planId) || null;
    }
  }, [planId, planType, flows, personalPlans, publicPlans]);
  
  if (!planData) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Plan not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const isOwner = planData.ownerId === user?.id;
  const isParticipant = planData.participants?.some(p => p.userId === user?.id);
  const isFlow = planType === 'flow';
  
  // Handle status updates for flows
  const handleFlowStatusUpdate = useCallback((flowId, dateKey, statusSymbol, emotion, note, currentStatus) => {
    if (!['✅', '❌', '➖'].includes(statusSymbol)) {
      console.warn('Invalid status symbol:', statusSymbol);
      return;
    }

    const trimmedNote = note && typeof note === 'string' && note.trim() ? note.trim() : null;
    const updatedStatus = {
      ...currentStatus,
      [dateKey]: { symbol: statusSymbol, emotion, note: trimmedNote },
    };

    console.log('UnifiedPlanDetail updating flow:', { flowId, dateKey, statusSymbol, emotion, note: trimmedNote });
    updateFlow(flowId, { status: updatedStatus })
      .then(() => {
        console.log('UnifiedPlanDetail flow status updated:', { dateKey, statusSymbol, note: trimmedNote });
      })
      .catch((error) => {
        console.error('UnifiedPlanDetail flow update failed:', error);
      });
  }, [updateFlow]);
  
  // Handle plan actions
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
  
  const handleToggleFavourite = async () => {
    try {
      if (isFavourite) {
        await removeFromFavourites(planId);
        setIsFavourite(false);
        Alert.alert('Success!', 'Removed from favourites.');
      } else {
        await addToFavourites(planId);
        setIsFavourite(true);
        Alert.alert('Success!', 'Added to favourites.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favourites. Please try again.');
    }
  };
  
  const handleDelete = async () => {
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
              Alert.alert('Success!', 'Plan deleted successfully.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const handleEdit = () => {
    if (isFlow) {
      navigation.navigate('EditFlow', { flowId: planId });
    } else {
      // Navigate to group plan edit screen
      navigation.navigate('EditGroupPlan', { planId });
    }
  };
  
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {planData.title || 'Untitled Plan'}
        </Text>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowEditModal(true)}
        >
          <Icon name="ellipsis-horizontal-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.titleRow}>
              <Icon 
                name={isFlow ? getTrackingTypeIcon(planData.trackingType) : 'people-outline'} 
                size={24} 
                color={isFlow ? getTrackingTypeColor(planData.trackingType) : colors.light.info} 
              />
              <Text style={styles.planTitle}>{planData.title || 'Untitled Plan'}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{isFlow ? 'Flow' : 'Group'}</Text>
            </View>
          </View>
          
          {planData.description && (
            <Text style={styles.planDescription}>{planData.description}</Text>
          )}
          
          <View style={styles.planMeta}>
            <View style={styles.metaItem}>
              <Icon name="calendar-outline" size={16} color={colors.light.secondaryText} />
              <Text style={styles.metaText}>
                {isFlow ? (planData.frequency || 'Daily') : (planData.planKind || 'Challenge')}
              </Text>
            </View>
            {isFlow && planData.trackingType && (
              <View style={styles.metaItem}>
                <Icon name="analytics-outline" size={16} color={colors.light.secondaryText} />
                <Text style={styles.metaText}>{planData.trackingType}</Text>
              </View>
            )}
            {!isFlow && planData.participants && (
              <View style={styles.metaItem}>
                <Icon name="people-outline" size={16} color={colors.light.secondaryText} />
                <Text style={styles.metaText}>{planData.participants.length} members</Text>
              </View>
            )}
          </View>
        </View>

        {/* Calendar Section (for flows) */}
        {isFlow && (
          <View style={styles.calendarSection}>
            <Text style={styles.sectionTitle}>Progress Calendar</Text>
            <FlowCalendar
              flow={planData}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onStatusUpdate={handleFlowStatusUpdate}
            />
          </View>
        )}

        {/* Group Plan Details */}
        {!isFlow && (
          <View style={styles.groupSection}>
            <Text style={styles.sectionTitle}>Group Details</Text>
            <View style={styles.groupInfo}>
              <View style={styles.groupStat}>
                <Text style={styles.groupStatNumber}>{planData.participants?.length || 0}</Text>
                <Text style={styles.groupStatLabel}>Members</Text>
              </View>
              <View style={styles.groupStat}>
                <Text style={styles.groupStatNumber}>{planData.steps?.length || 0}</Text>
                <Text style={styles.groupStatLabel}>Steps</Text>
              </View>
              <View style={styles.groupStat}>
                <Text style={styles.groupStatNumber}>{planData.status || 'Active'}</Text>
                <Text style={styles.groupStatLabel}>Status</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!isFlow && !isParticipant && !isOwner && (
            <Button
              title="Join Plan"
              onPress={handleJoin}
              variant="primary"
              style={styles.actionButton}
            />
          )}
          
          {!isFlow && isParticipant && !isOwner && (
            <Button
              title="Leave Plan"
              onPress={handleLeave}
              variant="secondary"
              style={styles.actionButton}
            />
          )}
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleToggleFavourite}
            >
              <Icon 
                name={isFavourite ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavourite ? colors.light.error : colors.light.secondaryText} 
              />
              <Text style={styles.secondaryActionText}>
                {isFavourite ? 'Favourited' : 'Add to Favourites'}
              </Text>
            </TouchableOpacity>
            
            {isOwner && (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handleEdit}
              >
                <Icon name="create-outline" size={20} color={colors.light.secondaryText} />
                <Text style={styles.secondaryActionText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Plan Options</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Icon name="close-outline" size={24} color={colors.light.primaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalAction}
                onPress={() => {
                  setShowEditModal(false);
                  handleEdit();
                }}
              >
                <Icon name="create-outline" size={20} color={colors.light.primaryText} />
                <Text style={styles.modalActionText}>Edit Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalAction}
                onPress={() => {
                  setShowEditModal(false);
                  handleToggleFavourite();
                }}
              >
                <Icon 
                  name={isFavourite ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isFavourite ? colors.light.error : colors.light.primaryText} 
                />
                <Text style={styles.modalActionText}>
                  {isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                </Text>
              </TouchableOpacity>
              
              {isOwner && (
                <TouchableOpacity
                  style={[styles.modalAction, styles.dangerAction]}
                  onPress={() => {
                    setShowEditModal(false);
                    handleDelete();
                  }}
                >
                  <Icon name="trash-outline" size={20} color={colors.light.error} />
                  <Text style={[styles.modalActionText, styles.dangerText]}>Delete Plan</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: layout.spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.spacing.lg,
    paddingTop: layout.spacing.lg,
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
  infoCard: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.lg,
    marginBottom: layout.spacing.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: layout.spacing.sm,
  },
  planTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: colors.light.primaryOrangeVariants.light,
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
  },
  typeBadgeText: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  planDescription: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.md,
    lineHeight: 20,
  },
  planMeta: {
    flexDirection: 'row',
    gap: layout.spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  metaText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  calendarSection: {
    marginBottom: layout.spacing.lg,
  },
  sectionTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
  },
  groupSection: {
    marginBottom: layout.spacing.lg,
  },
  groupInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  groupStat: {
    alignItems: 'center',
  },
  groupStatNumber: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '700',
  },
  groupStatLabel: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginTop: layout.spacing.xs,
  },
  actionSection: {
    marginBottom: layout.spacing.xl,
  },
  actionButton: {
    marginBottom: layout.spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.sm,
    padding: layout.spacing.md,
  },
  secondaryActionText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.light.cardBackground,
    borderTopLeftRadius: layout.borderRadius.xl,
    borderTopRightRadius: layout.borderRadius.xl,
    paddingTop: layout.spacing.lg,
    paddingBottom: layout.spacing.xl,
    paddingHorizontal: layout.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.lg,
  },
  modalTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  modalActions: {
    gap: layout.spacing.md,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.md,
    paddingVertical: layout.spacing.md,
  },
  modalActionText: {
    ...typography.styles.body,
    color: colors.light.primaryText,
  },
  dangerAction: {
    // Additional styling for dangerous actions if needed
  },
  dangerText: {
    color: colors.light.error,
  },
});

export default UnifiedPlanDetail;
