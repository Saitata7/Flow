// controllers/user.controller.js
// User management controller
// Handles user account operations including CRUD operations

const { UserModel } = require('../db/models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../middleware/errorHandler');
const { verifyJWTToken } = require('../middleware/auth');

/**
 * Get current user information
 * GET /v1/user
 */
const getUserInfo = async (request, reply) => {
  try {
    // Use the authenticated user from the middleware
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = request.user;

    // Get user from database
    const userData = await UserModel.findById(user.id);
    
    if (!userData) {
      throw new NotFoundError('User not found');
    }

    return reply.send({
      success: true,
      data: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || userData.name?.split(' ')[0] || '',
        lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
        username: userData.username || userData.email.split('@')[0],
        emailVerified: userData.emailVerified,
        provider: userData.provider,
        picture: userData.picture,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastLoginAt: userData.lastLoginAt,
      },
      message: 'User information retrieved successfully',
    });
  } catch (error) {
    console.error('Get user info error:', error);
    
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      throw error;
    }
    
    throw new Error('Failed to retrieve user information');
  }
};

/**
 * Update current user information
 * PUT /v1/user
 */
const updateUserInfo = async (request, reply) => {
  try {
    // Use the authenticated user from the middleware
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = request.user;

    const updateData = request.body;
    
    // Validate input data
    if (updateData.email && !updateData.email.includes('@')) {
      throw new BadRequestError('Invalid email format');
    }
    
    if (updateData.firstName && (updateData.firstName.length < 1 || updateData.firstName.length > 50)) {
      throw new BadRequestError('First name must be between 1 and 50 characters');
    }
    
    if (updateData.lastName && (updateData.lastName.length < 1 || updateData.lastName.length > 50)) {
      throw new BadRequestError('Last name must be between 1 and 50 characters');
    }
    
    if (updateData.username && (updateData.username.length < 3 || updateData.username.length > 25)) {
      throw new BadRequestError('Username must be between 3 and 25 characters');
    }

    // Update user in database
    const updatedUser = await UserModel.update(user.id, {
      ...updateData,
      updatedAt: new Date(),
    });
    
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return reply.send({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || updatedUser.name?.split(' ')[0] || '',
        lastName: updatedUser.lastName || updatedUser.name?.split(' ').slice(1).join(' ') || '',
        username: updatedUser.username || updatedUser.email.split('@')[0],
        emailVerified: updatedUser.emailVerified,
        provider: updatedUser.provider,
        picture: updatedUser.picture,
        updatedAt: updatedUser.updatedAt,
      },
      message: 'User information updated successfully',
    });
  } catch (error) {
    console.error('Update user info error:', error);
    
    if (error instanceof UnauthorizedError || error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    
    throw new Error('Failed to update user information');
  }
};

/**
 * Delete current user account
 * DELETE /v1/user
 */
const deleteUserAccount = async (request, reply) => {
  try {
    // Use the authenticated user from the middleware
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = request.user;

    // Soft delete user account
    const deletedUser = await UserModel.softDelete(user.id);
    
    if (!deletedUser) {
      throw new NotFoundError('User not found');
    }

    return reply.send({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    console.error('Delete user account error:', error);
    
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      throw error;
    }
    
    throw new Error('Failed to delete user account');
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  deleteUserAccount,
};
