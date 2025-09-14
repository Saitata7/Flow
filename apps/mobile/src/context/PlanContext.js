// src/context/PlanContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import planService from '../services/planService';
import useAuth from '../hooks/useAuth';

const PlanContext = createContext();

const PLANS_STORAGE_KEY = 'user_plans';
const FAVOURITES_STORAGE_KEY = 'favourite_plans';

export const PlanProvider = ({ children }) => {
  const { user } = useAuth();
  const [personalPlans, setPersonalPlans] = useState([]);
  const [publicPlans, setPublicPlans] = useState([]);
  const [favouritePlans, setFavouritePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load plans when user is available
  useEffect(() => {
    if (user?.id) {
      loadAllPlans();
    }
  }, [user?.id]);

  const loadAllPlans = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const plans = await planService.loadPlansFromStorage();
      const favourites = await planService.loadFavouritesFromStorage();
      
      // Filter plans by type
      const personal = plans.filter(plan => plan.ownerId === user.id);
      const publicPlansData = plans.filter(plan => plan.visibility === 'public');
      const favouritesData = plans.filter(plan => favourites.includes(plan.id));
      
      setPersonalPlans(personal);
      setPublicPlans(publicPlansData);
      setFavouritePlans(favouritesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData) => {
    try {
      setLoading(true);
      
      // Ensure new plan has v2 schema fields
      const now = new Date().toISOString();
      const enhancedPlanData = {
        ...planData,
        schemaVersion: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        
        // Set defaults for new v2 fields
        planKind: planData.planKind || 'Challenge',
        status: planData.status || 'draft',
        tags: planData.tags || [],
        rules: planData.rules || {
          frequency: 'daily',
          scoring: {
            method: 'binary',
            pointsPerCompletion: 1
          },
          cheatModePolicy: 'flexible',
          maxParticipants: 100
        }
      };
      
      const newPlan = await planService.createPlan(enhancedPlanData, `create-${Date.now()}`);
      await loadAllPlans(); // Reload all plans
      return newPlan;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId, updateData) => {
    try {
      setLoading(true);
      
      // Ensure update includes schema version and timestamp
      const now = new Date().toISOString();
      const enhancedUpdateData = {
        ...updateData,
        updatedAt: now,
        schemaVersion: 2
      };
      
      const updatedPlan = await planService.updatePlan(planId, enhancedUpdateData, `update-${Date.now()}`);
      await loadAllPlans(); // Reload all plans
      return updatedPlan;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId, softDelete = true) => {
    try {
      setLoading(true);
      
      if (softDelete) {
        // Soft delete - set deletedAt timestamp
        const now = new Date().toISOString();
        await planService.updatePlan(planId, { 
          deletedAt: now, 
          updatedAt: now 
        }, `soft-delete-${Date.now()}`);
      } else {
        // Hard delete - remove completely
        await planService.deletePlan(planId, `hard-delete-${Date.now()}`);
      }
      
      await loadAllPlans(); // Reload all plans
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restorePlan = async (planId) => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      await planService.updatePlan(planId, { 
        deletedAt: null, 
        updatedAt: now 
      }, `restore-${Date.now()}`);
      await loadAllPlans(); // Reload all plans
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinPlan = async (planId) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      const updatedPlan = await planService.joinPlan(planId, user.id, `join-${Date.now()}`);
      await loadAllPlans(); // Reload all plans
      return updatedPlan;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leavePlan = async (planId) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      const updatedPlan = await planService.leavePlan(planId, user.id, `leave-${Date.now()}`);
      await loadAllPlans(); // Reload all plans
      return updatedPlan;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addToFavourites = async (planId) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      await planService.addToFavourites(planId, user.id, `favourite-${Date.now()}`);
      await loadAllPlans(); // Reload all plans
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavourites = async (planId) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      await planService.removeFromFavourites(planId, user.id, `unfavourite-${Date.now()}`);
      await loadAllPlans(); // Reload all plans
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPlanById = async (planId) => {
    try {
      return await planService.getPlanById(planId);
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const searchPlans = async (query, filters = {}) => {
    try {
      return await planService.searchPlans(query, filters);
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  // Helper functions for filtering plans
  const getActivePlans = () => {
    return [...personalPlans, ...publicPlans].filter(plan => !plan.deletedAt && plan.status === 'active');
  };

  const getDraftPlans = () => {
    return personalPlans.filter(plan => !plan.deletedAt && plan.status === 'draft');
  };

  const getArchivedPlans = () => {
    return [...personalPlans, ...publicPlans].filter(plan => !plan.deletedAt && plan.status === 'archived');
  };

  const getDeletedPlans = () => {
    return [...personalPlans, ...publicPlans].filter(plan => plan.deletedAt);
  };

  const getPlansByKind = (planKind) => {
    return [...personalPlans, ...publicPlans].filter(plan => !plan.deletedAt && plan.planKind === planKind);
  };

  const getPlansByTag = (tag) => {
    return [...personalPlans, ...publicPlans].filter(plan => !plan.deletedAt && plan.tags?.includes(tag));
  };

  const value = {
    // Data
    personalPlans,
    publicPlans,
    favouritePlans,
    activePlans: getActivePlans(),
    draftPlans: getDraftPlans(),
    archivedPlans: getArchivedPlans(),
    deletedPlans: getDeletedPlans(),
    loading,
    error,
    
    // Actions
    createPlan,
    updatePlan,
    deletePlan,
    restorePlan,
    joinPlan,
    leavePlan,
    addToFavourites,
    removeFromFavourites,
    getPlanById,
    searchPlans,
    loadAllPlans,
    
    // Filters
    getPlansByKind,
    getPlansByTag,
    getActivePlans,
    getDraftPlans,
    getArchivedPlans,
    getDeletedPlans,
    
    // Utilities
    clearError: () => setError(null),
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlanContext = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlanContext must be used within a PlanProvider');
  }
  return context;
};

export default PlanContext;
