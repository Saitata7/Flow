// src/services/planService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';
import { generateIdempotencyKey } from '../utils/idempotency';
import { flowService } from './flowService';

// Global reference to FlowsContext addFlow function
let flowsContextAddFlow = null;

// Function to set the FlowsContext addFlow function
export const setFlowsContextAddFlow = (addFlowFunction) => {
  flowsContextAddFlow = addFlowFunction;
  console.log('PlanService: FlowsContext addFlow function registered:', !!addFlowFunction);
};

const PLANS_STORAGE_KEY = 'user_plans';
const PUBLIC_PLANS_STORAGE_KEY = 'public_plans';
const FAVOURITES_STORAGE_KEY = 'favourite_plans';

class PlanService {
  constructor() {
    this.plans = new Map();
    this.publicPlans = new Map();
    this.favourites = new Set();
  }


  // Load plans from storage
  async loadPlansFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(PLANS_STORAGE_KEY);
      if (stored) {
        const plans = JSON.parse(stored);
        plans.forEach(plan => this.plans.set(plan.id, plan));
        return plans;
      }
      return [];
    } catch (error) {
      console.error('Error loading plans from storage:', error);
      return [];
    }
  }

  // Save plans to storage
  async savePlansToStorage(plans) {
    try {
      await AsyncStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
      plans.forEach(plan => this.plans.set(plan.id, plan));
    } catch (error) {
      console.error('Error saving plans to storage:', error);
    }
  }

  // Load public plans from storage
  async loadPublicPlansFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(PUBLIC_PLANS_STORAGE_KEY);
      if (stored) {
        const plans = JSON.parse(stored);
        plans.forEach(plan => this.publicPlans.set(plan.id, plan));
        return plans;
      }
      return [];
    } catch (error) {
      console.error('Error loading public plans from storage:', error);
      return [];
    }
  }

  // Load favourites from storage
  async loadFavouritesFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(FAVOURITES_STORAGE_KEY);
      if (stored) {
        const favourites = JSON.parse(stored);
        favourites.forEach(id => this.favourites.add(id));
        return favourites;
      }
      return [];
    } catch (error) {
      console.error('Error loading favourites from storage:', error);
      return [];
    }
  }

  // Save favourites to storage
  async saveFavouritesToStorage() {
    try {
      await AsyncStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify([...this.favourites]));
    } catch (error) {
      console.error('Error saving favourites to storage:', error);
    }
  }

  // Get all plans for a user
  async getUserPlans(userId) {
    try {
      const plans = await this.loadPlansFromStorage();
      
      // Filter plans by user
      return plans.filter(plan => plan.ownerId === userId);
    } catch (error) {
      console.error('Error fetching user plans:', error);
      return [];
    }
  }

  // Get public plans (explore feed)
  async getPublicPlans(filters = {}) {
    try {
      const plans = await this.loadPlansFromStorage();
      
      // Filter public plans
      let publicPlans = plans.filter(plan => plan.visibility === 'public');
      
      // Apply filters
      if (filters.category) {
        publicPlans = publicPlans.filter(plan => plan.category === filters.category);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        publicPlans = publicPlans.filter(plan => 
          plan.title.toLowerCase().includes(searchTerm) ||
          plan.description.toLowerCase().includes(searchTerm)
        );
      }
      
      return publicPlans;
    } catch (error) {
      console.error('Error fetching public plans:', error);
      return [];
    }
  }

  // Get user's favourite plans
  async getFavouritePlans(userId) {
    try {
      const favouriteIds = await this.loadFavouritesFromStorage();
      const plans = await this.loadPlansFromStorage();
      
      return plans.filter(plan => favouriteIds.includes(plan.id));
    } catch (error) {
      console.error('Error fetching favourite plans:', error);
      return [];
    }
  }

  // Get plan details by ID
  async getPlanById(planId) {
    try {
      const plans = await this.loadPlansFromStorage();
      
      return plans.find(plan => plan.id === planId) || null;
    } catch (error) {
      console.error('Error fetching plan details:', error);
      return null;
    }
  }

  // Create a new plan
  async createPlan(planData, idempotencyKey) {
    try {
      // Validate plan data
      const validation = this.validatePlanData(planData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const plans = await this.loadPlansFromStorage();
      const newPlan = {
        ...planData,
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedPlans = [...plans, newPlan];
      await this.savePlansToStorage(updatedPlans);
      
      // If this is a group plan with flows, convert them to personal flows for the owner
      if (newPlan.flows && newPlan.flows.length > 0 && newPlan.ownerId) {
        await this.convertGroupFlowsToPersonalFlows(newPlan.flows, newPlan.ownerId, newPlan.id);
      }
      
      return newPlan;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  }

  // Update an existing plan
  async updatePlan(planId, updateData, idempotencyKey) {
    try {
      const plans = await this.loadPlansFromStorage();
      const planIndex = plans.findIndex(plan => plan.id === planId);
      
      if (planIndex === -1) {
        throw new Error('Plan not found');
      }
      
      const updatedPlan = {
        ...plans[planIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      
      plans[planIndex] = updatedPlan;
      await this.savePlansToStorage(plans);
      
      return updatedPlan;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  }

  // Delete a plan
  async deletePlan(planId, idempotencyKey) {
    try {
      const plans = await this.loadPlansFromStorage();
      const filteredPlans = plans.filter(plan => plan.id !== planId);
      await this.savePlansToStorage(filteredPlans);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }

  // Join a plan
  async joinPlan(planId, userId, idempotencyKey) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const plans = await this.loadPlansFromStorage();
      const planIndex = plans.findIndex(plan => plan.id === planId);
      
      if (planIndex === -1) {
        throw new Error('Plan not found');
      }
      
      const plan = plans[planIndex];
      
      // Check if user is already the owner
      if (plan.ownerId === userId) {
        throw new Error('You are already the owner of this plan');
      }
      
      const isAlreadyParticipant = plan.participants.some(p => p.userId === userId);
      
      if (!isAlreadyParticipant) {
        plan.participants.push({
          userId,
          role: 'participant',
          joinedAt: new Date().toISOString(),
        });
        
        plan.updatedAt = new Date().toISOString();
        plans[planIndex] = plan;
        await this.savePlansToStorage(plans);
        
        // Convert group flows to personal flows for the user
        if (plan.flows && plan.flows.length > 0) {
          await this.convertGroupFlowsToPersonalFlows(plan.flows, userId, plan.id);
        }
      }
      
      return plan;
    } catch (error) {
      console.error('Error joining plan:', error);
      throw error;
    }
  }

  // Leave a plan
  async leavePlan(planId, userId, idempotencyKey) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const plans = await this.loadPlansFromStorage();
      const planIndex = plans.findIndex(plan => plan.id === planId);
      
      if (planIndex === -1) {
        throw new Error('Plan not found');
      }
      
      const plan = plans[planIndex];
      
      // Check if user is the owner
      if (plan.ownerId === userId) {
        throw new Error('Owners cannot leave their own plans. Delete the plan instead.');
      }
      
      const wasParticipant = plan.participants.some(p => p.userId === userId);
      if (!wasParticipant) {
        throw new Error('You are not a participant of this plan');
      }
      
      plan.participants = plan.participants.filter(p => p.userId !== userId);
      plan.updatedAt = new Date().toISOString();
      
      plans[planIndex] = plan;
      await this.savePlansToStorage(plans);
      
      // Remove personal flows from this group
      await this.removeGroupFlowsFromPersonalFlows(planId, userId);
      
      return plan;
    } catch (error) {
      console.error('Error leaving plan:', error);
      throw error;
    }
  }

  // Add plan to favourites
  async addToFavourites(planId, userId, idempotencyKey) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Verify plan exists
      const plan = await this.getPlanById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      this.favourites.add(planId);
      await this.saveFavouritesToStorage();
      
      return { success: true };
    } catch (error) {
      console.error('Error adding to favourites:', error);
      throw error;
    }
  }

  // Remove plan from favourites
  async removeFromFavourites(planId, userId, idempotencyKey) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      this.favourites.delete(planId);
      await this.saveFavouritesToStorage();
      
      return { success: true };
    } catch (error) {
      console.error('Error removing from favourites:', error);
      throw error;
    }
  }

  // Get plan analytics
  async getPlanAnalytics(planId) {
    try {
      const plan = await this.getPlanById(planId);
      return plan?.analytics || null;
    } catch (error) {
      console.error('Error fetching plan analytics:', error);
      return null;
    }
  }

  // Get plan leaderboard
  async getPlanLeaderboard(planId, type = 'strict') {
    try {
      const plan = await this.getPlanById(planId);
      if (!plan) return [];
      
      // Mock leaderboard data
      return plan.participants.map(participant => ({
        userId: participant.userId,
        score: type === 'strict' ? plan.analytics?.strictScore || 0 : plan.analytics?.flexibleScore || 0,
        streak: plan.analytics?.streak || 0,
        joinedAt: participant.joinedAt,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Generate share link for a plan
  async generateShareLink(planId) {
    try {
      const plan = await this.getPlanById(planId);
      if (!plan) return null;
      
      return {
        url: `https://flow.app/p/${planId}`,
        qrCode: `data:image/png;base64,mock_qr_code_${planId}`,
      };
    } catch (error) {
      console.error('Error generating share link:', error);
      return null;
    }
  }

  // Get plan participants
  async getPlanParticipants(planId) {
    try {
      const plan = await this.getPlanById(planId);
      return plan?.participants || [];
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  }

  // Update plan progress
  async updatePlanProgress(planId, userId, progressData, idempotencyKey) {
    try {
      const plans = await this.loadPlansFromStorage();
      const planIndex = plans.findIndex(plan => plan.id === planId);
      
      if (planIndex === -1) {
        throw new Error('Plan not found');
      }
      
      const plan = plans[planIndex];
      
      // Update analytics based on progress
      if (plan.analytics) {
        plan.analytics.strictScore = Math.min(100, (plan.analytics.strictScore || 0) + 5);
        plan.analytics.flexibleScore = Math.min(100, (plan.analytics.flexibleScore || 0) + 3);
        plan.analytics.streak = (plan.analytics.streak || 0) + 1;
      }
      
      plan.updatedAt = new Date().toISOString();
      plans[planIndex] = plan;
      await this.savePlansToStorage(plans);
      
      return plan;
    } catch (error) {
      console.error('Error updating plan progress:', error);
      throw error;
    }
  }

  // Search plans
  async searchPlans(query, filters = {}) {
    try {
      const publicPlans = await this.getPublicPlans({ ...filters, search: query });
      return publicPlans;
    } catch (error) {
      console.error('Error searching plans:', error);
      return [];
    }
  }

  // Get plan categories
  async getPlanCategories() {
    try {
      return [
        { id: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline' },
        { id: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
        { id: 'learning', label: 'Learning', icon: 'book-outline' },
        { id: 'productivity', label: 'Productivity', icon: 'checkmark-circle-outline' },
        { id: 'social', label: 'Social', icon: 'people-outline' },
        { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
      ];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Validate plan data
  validatePlanData(planData) {
    const errors = [];

    if (!planData.title || planData.title.trim().length < 1) {
      errors.push('Title is required');
    } else if (planData.title.length > 80) {
      errors.push('Title must be 80 characters or less');
    }

    if (!planData.description || planData.description.trim().length < 1) {
      errors.push('Description is required');
    }

    if (!planData.steps || planData.steps.length === 0) {
      errors.push('At least one step is required');
    }

    if (planData.steps) {
      planData.steps.forEach((step, index) => {
        if (!step.title || step.title.trim().length < 1) {
          errors.push(`Step ${index + 1} title is required`);
        }
        if (!step.duration || step.duration < 1) {
          errors.push(`Step ${index + 1} duration must be at least 1 minute`);
        }
      });
    }

    if (!planData.category) {
      errors.push('Category is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Convert group flows to personal flows for a user
  async convertGroupFlowsToPersonalFlows(groupFlows, userId, groupId) {
    try {
      console.log('PlanService: Converting group flows to personal flows:', groupFlows.length, 'flows for user:', userId);
      console.log('PlanService: Group flows data:', groupFlows.map(f => ({ id: f.id, title: f.title, trackingType: f.trackingType })));
      
      for (const groupFlow of groupFlows) {
        // Skip flows without titles
        if (!groupFlow.title || !groupFlow.title.trim()) {
          continue;
        }

        // Create personal flow from group flow with proper structure
        const now = new Date().toISOString();
        
        // Convert tracking type to proper case for stats service compatibility
        const trackingTypeMap = {
          'binary': 'Binary',
          'quantitative': 'Quantitative', 
          'time-based': 'Time-based'
        };
        const properTrackingType = trackingTypeMap[groupFlow.trackingType] || groupFlow.trackingType;
        
        const personalFlow = {
          // Required fields
          id: `${groupId}_${groupFlow.id}_${userId}`, // Unique ID combining group, flow, and user
          title: groupFlow.title,
          trackingType: properTrackingType,
          frequency: groupFlow.frequency || 'Daily',
          ownerId: userId,
          schemaVersion: 2,
          createdAt: now,
          updatedAt: now,
          
          // Optional fields with defaults
          description: groupFlow.description || '',
          everyDay: true, // Default to daily for group flows
          daysOfWeek: [],
          reminderTime: groupFlow.reminderTime || null,
          reminderLevel: '1',
          cheatMode: false,
          
          // New v2 fields
          planId: groupId, // Reference to the group
          goal: groupFlow.goal || null,
          progressMode: 'sum',
          tags: ['Group Flow'],
          archived: false,
          visibility: 'private',
          deletedAt: null,
          
          // Legacy fields for backward compatibility
          goalLegacy: groupFlow.trackingType === 'quantitative' ? groupFlow.goal || 0 : undefined,
          hours: groupFlow.trackingType === 'time-based' ? 0 : undefined,
          minutes: groupFlow.trackingType === 'time-based' ? 0 : undefined,
          seconds: groupFlow.trackingType === 'time-based' ? 0 : undefined,
          unitText: groupFlow.trackingType === 'quantitative' ? groupFlow.unit || '' : undefined,
          
          // Group flow references
          groupId: groupId,
          groupFlowId: groupFlow.id,
          
          // Status tracking - use the same structure as FlowsContext
          status: this.generateStatusDates(
            groupFlow.trackingType,
            groupFlow.trackingType === 'quantitative' ? groupFlow.unit : undefined,
            groupFlow.trackingType === 'time-based' ? 0 : undefined,
            groupFlow.trackingType === 'time-based' ? 0 : undefined,
            groupFlow.trackingType === 'time-based' ? 0 : undefined,
            groupFlow.trackingType === 'quantitative' ? groupFlow.goal : undefined
          ),
        };

        // Add to personal flows - use FlowsContext if available, otherwise use flowService
        if (flowsContextAddFlow) {
          console.log('PlanService: Using FlowsContext.addFlow for:', personalFlow.title);
          console.log('PlanService: FlowsContext.addFlow function available:', !!flowsContextAddFlow);
          
          // Convert to format expected by FlowsContext.addFlow
          const flowForContext = {
            id: personalFlow.id,
            title: personalFlow.title,
            trackingType: personalFlow.trackingType,
            frequency: personalFlow.frequency,
            ownerId: personalFlow.ownerId,
            description: personalFlow.description,
            everyDay: personalFlow.everyDay,
            daysOfWeek: personalFlow.daysOfWeek,
            time: personalFlow.reminderTime, // FlowsContext expects 'time' not 'reminderTime'
            reminderLevel: personalFlow.reminderLevel,
            cheatMode: personalFlow.cheatMode,
            planId: personalFlow.planId,
            goal: personalFlow.goal,
            progressMode: personalFlow.progressMode,
            tags: personalFlow.tags,
            archived: personalFlow.archived,
            visibility: personalFlow.visibility,
            // Legacy fields
            goalLegacy: personalFlow.goalLegacy,
            hours: personalFlow.hours,
            minutes: personalFlow.minutes,
            seconds: personalFlow.seconds,
            unitText: personalFlow.unitText,
            // Group flow references
            groupId: personalFlow.groupId,
            groupFlowId: personalFlow.groupFlowId,
          };
          
          await flowsContextAddFlow(flowForContext);
          console.log('Added to FlowsContext:', personalFlow.title);
        } else {
          console.log('FlowsContext not available, using flowService for:', personalFlow.title);
          const createdFlow = await flowService.createFlow(personalFlow);
          console.log('Created personal flow:', createdFlow.title, 'with ID:', createdFlow.id);
        }
        
        // Verify the flow was saved
        const allFlows = await flowService.getFlows();
        console.log('Total flows after creation:', allFlows.length);
        console.log('Latest flows:', allFlows.slice(-3).map(f => ({ id: f.id, title: f.title, groupId: f.groupId })));
      }
    } catch (error) {
      console.error('Error converting group flows to personal flows:', error);
      throw error;
    }
  }

  // Generate initial status data for a flow (matching FlowsContext structure)
  generateStatusDates(trackingType, unitText, hours, minutes, seconds, goal) {
    const status = {};
    for (let i = 0; i < 7; i++) {
      const dateKey = format(addDays(new Date(), i), 'yyyy-MM-dd');
      status[dateKey] = {
        symbol: '➖',
        emotion: null,
        note: null,
        timestamp: null,
        quantitative: trackingType === 'quantitative' ? { unitText, goal, count: 0 } : null,
        timebased: trackingType === 'time-based' ? {
          hours,
          minutes,
          seconds,
          start0: null,
          startTime: null,
          pauses: [],
          stop: null,
          endTime: null,
          totalDuration: 0,
          pausesCount: 0
        } : null
      };
    }
    return status;
  }

  // Remove personal flows that belong to a specific group
  async removeGroupFlowsFromPersonalFlows(groupId, userId) {
    try {
      console.log('Removing group flows from personal flows for group:', groupId, 'user:', userId);
      
      const flows = await flowService.getFlows();
      const flowsToRemove = flows.filter(flow => 
        flow.groupId === groupId && flow.ownerId === userId
      );
      
      for (const flow of flowsToRemove) {
        await flowService.deleteFlow(flow.id);
        console.log('Removed personal flow:', flow.title);
      }
    } catch (error) {
      console.error('Error removing group flows from personal flows:', error);
      throw error;
    }
  }
}

// Create singleton instance
const planService = new PlanService();

export default planService;
