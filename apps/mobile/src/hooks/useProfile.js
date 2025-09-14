// hooks/useProfile.js
import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userServiceMock';
import { useAuthSimple as useAuth } from './useAuthSimple';

export const useProfile = (userId = null) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const currentUserId = userId || user?.uid;

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profileData = await userService.getProfile(currentUserId);
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!currentUserId) {
      throw new Error('No user ID available');
    }

    try {
      setUpdating(true);
      setError(null);
      
      // Optimistic update
      const optimisticProfile = { ...profile, ...updates };
      setProfile(optimisticProfile);
      
      const updatedProfile = await userService.updateProfile(currentUserId, updates);
      setProfile(updatedProfile);
      
      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      
      // Revert optimistic update
      await loadProfile();
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [currentUserId, profile, loadProfile]);

  // Update display name in Firebase Auth
  const updateDisplayName = useCallback(async (displayName) => {
    try {
      setUpdating(true);
      setError(null);
      
      const success = await userService.updateDisplayName(displayName);
      if (success) {
        await updateProfile({ displayName });
      }
      return success;
    } catch (err) {
      console.error('Error updating display name:', err);
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [updateProfile]);

  // Update profile stats
  const updateStats = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      await userService.updateProfileStats(currentUserId);
      await loadProfile(); // Reload to get updated stats
    } catch (err) {
      console.error('Error updating profile stats:', err);
      setError(err.message);
    }
  }, [currentUserId, loadProfile]);

  // Validate profile data
  const validateProfile = useCallback((profileData) => {
    return userService.validateProfile(profileData);
  }, []);

  // Get public profile
  const getPublicProfile = useCallback(async (targetUserId = null) => {
    const targetId = targetUserId || currentUserId;
    if (!targetId) {
      throw new Error('No user ID provided');
    }

    try {
      return await userService.getPublicProfile(targetId);
    } catch (err) {
      console.error('Error getting public profile:', err);
      setError(err.message);
      throw err;
    }
  }, [currentUserId]);

  // Clear cache
  const clearCache = useCallback(() => {
    userService.clearCache(currentUserId);
  }, [currentUserId]);

  // Load profile on mount and when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    updating,
    updateProfile,
    updateDisplayName,
    updateStats,
    validateProfile,
    getPublicProfile,
    clearCache,
    refetch: loadProfile
  };
};

// Hook for profile stats only
export const useProfileStats = (userId = null) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    personalPlans: 0,
    publicPlans: 0,
    followers: 0,
    following: 0,
    badges: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = userId || user?.uid;

  const loadStats = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [publicCount, personalCount] = await Promise.all([
        userService.getPublicPlansCount(currentUserId),
        userService.getPersonalPlansCount(currentUserId)
      ]);

      setStats(prevStats => ({
        ...prevStats,
        personalPlans: personalCount,
        publicPlans: publicCount
      }));
    } catch (err) {
      console.error('Error loading profile stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
};

// Hook for public profile (for sharing)
export const usePublicProfile = (userId) => {
  const [publicProfile, setPublicProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPublicProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const profile = await userService.getPublicProfile(userId);
      setPublicProfile(profile);
    } catch (err) {
      console.error('Error loading public profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPublicProfile();
  }, [loadPublicProfile]);

  return {
    publicProfile,
    loading,
    error,
    refetch: loadPublicProfile
  };
};
