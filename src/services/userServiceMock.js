// services/userServiceMock.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_STORAGE_KEY = 'user_profile';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default profile structure
const defaultProfile = {
  id: '',
  displayName: '',
  avatarUrl: '',
  bio: '',
  stats: {
    personalPlans: 0,
    publicPlans: 0,
    followers: 0,
    following: 0,
    badges: []
  },
  social: {
    twitter: '',
    linkedin: '',
    github: '',
    instagram: ''
  },
  visibility: {
    bio: true,
    stats: true,
    plans: true
  },
  schemaVersion: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

class UserServiceMock {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

  // Get current user ID (mock)
  getCurrentUserId() {
    return 'demo-user-123';
  }

  // Check if profile data is cached and still valid
  isCacheValid(userId) {
    const timestamp = this.cacheTimestamps.get(userId);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  }

  // Get profile from cache
  getCachedProfile(userId) {
    if (this.isCacheValid(userId)) {
      return this.cache.get(userId);
    }
    return null;
  }

  // Cache profile data
  cacheProfile(userId, profile) {
    this.cache.set(userId, profile);
    this.cacheTimestamps.set(userId, Date.now());
  }

  // Get profile from local storage
  async getLocalProfile(userId) {
    try {
      const stored = await AsyncStorage.getItem(`${PROFILE_STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting local profile:', error);
      return null;
    }
  }

  // Save profile to local storage
  async saveLocalProfile(userId, profile) {
    try {
      await AsyncStorage.setItem(`${PROFILE_STORAGE_KEY}_${userId}`, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving local profile:', error);
    }
  }

  // Get user profile (with caching and offline support)
  async getProfile(userId = null) {
    const currentUserId = userId || this.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No user ID provided');
    }

    // Check cache first
    const cachedProfile = this.getCachedProfile(currentUserId);
    if (cachedProfile) {
      return cachedProfile;
    }

    try {
      // Try to get from local storage
      const localProfile = await this.getLocalProfile(currentUserId);
      if (localProfile) {
        this.cacheProfile(currentUserId, localProfile);
        return localProfile;
      }
      
      // Return default profile if none exists
      const newProfile = { ...defaultProfile, id: currentUserId };
      await this.createProfile(currentUserId, newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error getting profile:', error);
      return { ...defaultProfile, id: currentUserId };
    }
  }

  // Create new profile
  async createProfile(userId, profileData = {}) {
    const profile = {
      ...defaultProfile,
      ...profileData,
      id: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Save to local storage
      this.cacheProfile(userId, profile);
      await this.saveLocalProfile(userId, profile);
      
      return profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(userId, updates) {
    const currentUserId = userId || this.getCurrentUserId();
    if (!currentUserId) {
      throw new Error('No user ID provided');
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    try {
      // Get current profile
      const currentProfile = await this.getProfile(currentUserId);
      const updatedProfile = { ...currentProfile, ...updateData };
      
      // Update cache and local storage
      this.cacheProfile(currentUserId, updatedProfile);
      await this.saveLocalProfile(currentUserId, updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Update display name in Firebase Auth (mock)
  async updateDisplayName(displayName) {
    try {
      // Mock implementation - in real app this would update Firebase Auth
      console.log('Mock: Updating display name to:', displayName);
      return true;
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  }

  // Get user's public plans count (mock)
  async getPublicPlansCount(userId = null) {
    const currentUserId = userId || this.getCurrentUserId();
    if (!currentUserId) return 0;

    try {
      // Mock implementation - return random count for demo
      return Math.floor(Math.random() * 5);
    } catch (error) {
      console.error('Error getting public plans count:', error);
      return 0;
    }
  }

  // Get user's personal plans count (mock)
  async getPersonalPlansCount(userId = null) {
    const currentUserId = userId || this.getCurrentUserId();
    if (!currentUserId) return 0;

    try {
      // Mock implementation - return random count for demo
      return Math.floor(Math.random() * 10) + 5;
    } catch (error) {
      console.error('Error getting personal plans count:', error);
      return 0;
    }
  }

  // Update profile stats
  async updateProfileStats(userId = null) {
    const currentUserId = userId || this.getCurrentUserId();
    if (!currentUserId) return;

    try {
      const [publicCount, personalCount] = await Promise.all([
        this.getPublicPlansCount(currentUserId),
        this.getPersonalPlansCount(currentUserId)
      ]);

      await this.updateProfile(currentUserId, {
        'stats.publicPlans': publicCount,
        'stats.personalPlans': personalCount
      });
    } catch (error) {
      console.error('Error updating profile stats:', error);
    }
  }

  // Validate profile data
  validateProfile(profile) {
    const errors = [];

    if (profile.displayName && profile.displayName.length > 50) {
      errors.push('Display name must be 50 characters or less');
    }

    if (profile.bio && profile.bio.length > 500) {
      errors.push('Bio must be 500 characters or less');
    }

    // Validate social links
    const socialFields = ['twitter', 'linkedin', 'github', 'instagram'];
    socialFields.forEach(field => {
      if (profile.social?.[field] && !this.isValidUrl(profile.social[field])) {
        errors.push(`${field} must be a valid URL`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Clear cache
  clearCache(userId = null) {
    if (userId) {
      this.cache.delete(userId);
      this.cacheTimestamps.delete(userId);
    } else {
      this.cache.clear();
      this.cacheTimestamps.clear();
    }
  }

  // Get public profile (for sharing)
  async getPublicProfile(userId) {
    try {
      const profile = await this.getProfile(userId);
      
      // Return only public data
      return {
        id: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.visibility.bio ? profile.bio : '',
        stats: profile.visibility.stats ? {
          publicPlans: profile.stats.publicPlans,
          badges: profile.stats.badges
        } : {},
        social: profile.social,
        visibility: profile.visibility
      };
    } catch (error) {
      console.error('Error getting public profile:', error);
      throw error;
    }
  }
}

export default new UserServiceMock();
