// controllers/profile.controller.js
// Enhanced profile management controller
// Handles comprehensive user profile data including demographics and privacy settings

const { UserModel, UserProfileModel } = require('../db/models');
const { ConflictError, NotFoundError, ForbiddenError, ValidationError } = require('../middleware/errorHandler');
const moment = require('moment');

// Extended profile schema validation
const PROFILE_SCHEMA = {
  // Required fields
  required: ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender'],
  
  // Field validation rules
  validation: {
    firstName: { min: 1, max: 50, pattern: /^[a-zA-Z\s'-]+$/ },
    lastName: { min: 1, max: 50, pattern: /^[a-zA-Z\s'-]+$/ },
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phoneNumber: { pattern: /^[\+]?[1-9][\d]{0,15}$/ },
    dateOfBirth: { type: 'date', minAge: 13, maxAge: 120 },
    gender: { 
      enum: ['male', 'female', 'non-binary', 'transgender', 'prefer-not-to-say', 'other'] 
    },
    race: { 
      enum: ['american-indian', 'asian', 'black', 'hispanic', 'native-hawaiian', 'white', 'multiracial', 'prefer-not-to-say', 'other'] 
    },
    disability: { 
      enum: ['none', 'visual', 'hearing', 'mobility', 'cognitive', 'mental-health', 'chronic-illness', 'prefer-not-to-say', 'other'] 
    },
    preferredLanguage: { pattern: /^[a-z]{2}(-[A-Z]{2})?$/ },
    country: { max: 100 },
    timezone: { max: 50 },
    fitnessLevel: { 
      enum: ['beginner', 'intermediate', 'advanced', 'expert'] 
    },
    profileVisibility: { 
      enum: ['public', 'friends', 'private'] 
    }
  }
};

/**
 * Validate profile data against schema
 */
const validateProfileData = (data) => {
  const errors = [];
  
  // Check required fields
  for (const field of PROFILE_SCHEMA.required) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`${field} is required`);
    }
  }
  
  // Validate field formats
  for (const [field, rules] of Object.entries(PROFILE_SCHEMA.validation)) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      const value = data[field];
      
      // String length validation
      if (rules.min && typeof value === 'string' && value.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters`);
      }
      if (rules.max && typeof value === 'string' && value.length > rules.max) {
        errors.push(`${field} must be no more than ${rules.max} characters`);
      }
      
      // Pattern validation
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      
      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
      
      // Date validation
      if (rules.type === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`${field} must be a valid date`);
        } else {
          const age = moment().diff(moment(date), 'years');
          if (rules.minAge && age < rules.minAge) {
            errors.push(`You must be at least ${rules.minAge} years old`);
          }
          if (rules.maxAge && age > rules.maxAge) {
            errors.push(`Age cannot exceed ${rules.maxAge} years`);
          }
        }
      }
    }
  }
  
  return errors;
};

/**
 * Get user profile
 */
const getUserProfile = async (request, reply) => {
  try {
    const userId = request.user.id;
    
    console.log('📋 ProfileController: Getting profile for user:', userId);
    
    // Get user profile using UserModel
    const profile = await UserModel.getProfile(userId);
    
    if (!profile) {
      throw new NotFoundError('User not found');
    }
    
    console.log('✅ ProfileController: Profile retrieved successfully');
    
    return reply.send({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ ProfileController: Error getting profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (request, reply) => {
  try {
    const userId = request.user.id;
    const profileData = request.body;
    
    console.log('📋 ProfileController: Updating profile for user:', userId);
    console.log('📋 ProfileController: Profile data:', profileData);
    
    // Validate profile data
    const validationErrors = validateProfileData(profileData);
    if (validationErrors.length > 0) {
      throw new ValidationError(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Update user profile using UserModel
    const updatedUser = await UserModel.updateProfile(userId, profileData);
    
    console.log('✅ ProfileController: Profile updated successfully');
    
    return reply.send({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phoneNumber: updatedUser.phone_number,
        dateOfBirth: updatedUser.date_of_birth,
        gender: updatedUser.gender,
        race: updatedUser.race,
        ethnicity: updatedUser.ethnicity,
        disability: updatedUser.disability,
        preferredLanguage: updatedUser.preferred_language,
        country: updatedUser.country,
        timezone: updatedUser.timezone,
        healthGoals: updatedUser.health_goals ? JSON.parse(updatedUser.health_goals) : [],
        fitnessLevel: updatedUser.fitness_level,
        medicalConditions: updatedUser.medical_conditions,
        profileVisibility: updatedUser.profile_visibility,
        dataSharing: updatedUser.data_sharing ? JSON.parse(updatedUser.data_sharing) : {
          analytics: true,
          research: false,
          marketing: false
        },
        updatedAt: updatedUser.updated_at
      },
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('❌ ProfileController: Error updating profile:', error);
    throw error;
  }
};

/**
 * Delete user profile
 */
const deleteUserProfile = async (request, reply) => {
  try {
    const userId = request.user.id;
    
    console.log('📋 ProfileController: Deleting profile for user:', userId);
    
    // Soft delete user profile
    await UserProfileModel.update(userId, { deleted_at: new Date() });
    
    console.log('✅ ProfileController: Profile deleted successfully');
    
    return reply.send({
      success: true,
      message: 'Profile deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ ProfileController: Error deleting profile:', error);
    throw error;
  }
};

/**
 * Get profile statistics
 */
const getProfileStats = async (request, reply) => {
  try {
    const userId = request.user.id;
    
    console.log('📋 ProfileController: Getting profile stats for user:', userId);
    
    // Get user profile with stats
    const profile = await UserProfileModel.findByUserId(userId);
    
    if (!profile) {
      return reply.send({
        success: true,
        data: {
          totalFlows: 0,
          completedEntries: 0,
          currentStreak: 0,
          longestStreak: 0,
          achievements: 0,
          badges: 0,
          joinDate: null,
          lastActive: null
        },
        message: 'No profile stats available'
      });
    }
    
    const stats = profile.stats || {};
    
    console.log('✅ ProfileController: Profile stats retrieved successfully');
    
    return reply.send({
      success: true,
      data: {
        totalFlows: stats.totalFlows || 0,
        completedEntries: stats.completedEntries || 0,
        currentStreak: stats.currentStreak || 0,
        longestStreak: stats.longestStreak || 0,
        achievements: stats.achievements || 0,
        badges: stats.badges || 0,
        joinDate: profile.created_at,
        lastActive: profile.updated_at
      },
      message: 'Profile stats retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ ProfileController: Error getting profile stats:', error);
    throw error;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getProfileStats,
  validateProfileData
};
