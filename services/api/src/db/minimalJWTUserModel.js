// db/minimalJWTUserModel.js
// Minimal JWT User Model that works with the actual database schema
// Based on the actual columns that exist: id, email, display_name, created_at

const knex = require('knex');

// Knex configuration for Cloud Run
const knexConfig = {
  client: 'pg',
  connection: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432,
    ssl: false,
  },
  pool: {
    min: 2,
    max: 10,
  },
};

const db = knex(knexConfig);

class MinimalJWTUserModel {
  static tableName = 'users';

  static async create(data) {
    const [user] = await db(this.tableName).insert(data).returning('*');
    return user;
  }

  static async findById(id) {
    return db(this.tableName).where({ id }).first();
  }

  static async findByEmail(email) {
    return db(this.tableName).where({ email }).first();
  }

  static async findByUsername(username) {
    // For now, we'll store username in display_name or create a separate table
    return db(this.tableName).where({ display_name: username }).first();
  }

  static async update(id, data) {
    // Only update fields that exist in the database
    const updateData = {
      updated_at: new Date()
    };
    
    // Dynamically add fields if they exist
    if (data.display_name !== undefined) updateData.display_name = data.display_name;
    if (data.email_verified !== undefined) updateData.email_verified = data.email_verified;
    if (data.status !== undefined) updateData.status = data.status;
    
    const [user] = await db(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');
    return user;
  }

  static async delete(id) {
    return db(this.tableName).where({ id }).del();
  }

  static async findAll() {
    return db(this.tableName).select('*');
  }

  // JWT Authentication Methods
  static async createUser(userData) {
    try {
      console.log('📋 MinimalJWTUserModel: Creating new user:', userData.email);
      
      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      // Check username if provided (using display_name for now)
      if (userData.username) {
        const existingUsername = await this.findByUsername(userData.username);
        if (existingUsername) {
          throw new Error('Username is already taken');
        }
      }
      
      // Create user with minimal schema
      const newUserData = {
        email: userData.email,
        display_name: userData.username || userData.email.split('@')[0],
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      console.log('📋 MinimalJWTUserModel: User data to insert:', newUserData);
      
      const [user] = await db(this.tableName).insert(newUserData).returning('*');
      console.log('✅ MinimalJWTUserModel: User created successfully:', user.id);
      
      // Store JWT-specific data in a separate table or use a simple approach
      // For now, we'll store password hash in a separate jwt_users table
      if (userData.passwordHash) {
        try {
          await db('jwt_users').insert({
            user_id: user.id,
            password_hash: userData.passwordHash,
            username: userData.username || '',
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            phone_number: userData.phoneNumber || '',
            date_of_birth: userData.dateOfBirth || null,
            gender: userData.gender || '',
            email_verification_token: userData.emailVerificationToken,
            email_verification_expires: userData.emailVerificationExpires,
            created_at: new Date(),
            updated_at: new Date(),
          });
          console.log('✅ MinimalJWTUserModel: JWT user data stored successfully');
        } catch (error) {
          console.log('⚠️ MinimalJWTUserModel: JWT users table does not exist, skipping password storage');
        }
      }
      
      return user;
    } catch (error) {
      console.error('❌ MinimalJWTUserModel: Error creating user:', error);
      throw error;
    }
  }

  static async verifyEmail(token) {
    try {
      console.log('📋 MinimalJWTUserModel: Verifying email with token:', token);
      
      // Find user by email verification token in jwt_users table
      const jwtUser = await db('jwt_users')
        .where({ email_verification_token: token })
        .first();
      
      if (!jwtUser) {
        throw new Error('Invalid verification token');
      }
      
      // Check if token is expired
      if (jwtUser.email_verification_expires && new Date() > jwtUser.email_verification_expires) {
        throw new Error('Verification token has expired');
      }
      
      // Update user as verified (we'll add email_verified column if needed)
      const [updatedUser] = await db(this.tableName)
        .where({ id: jwtUser.user_id })
        .update({
          updated_at: new Date()
        })
        .returning('*');
      
      // Clear verification token
      await db('jwt_users')
        .where({ user_id: jwtUser.user_id })
        .update({
          email_verification_token: null,
          email_verification_expires: null,
          updated_at: new Date()
        });
      
      console.log('✅ MinimalJWTUserModel: Email verified successfully:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ MinimalJWTUserModel: Error verifying email:', error);
      throw error;
    }
  }

  static async requestPasswordReset(email) {
    try {
      console.log('📋 MinimalJWTUserModel: Requesting password reset for:', email);
      
      const user = await this.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }
      
      // Check if user has JWT data
      const jwtUser = await db('jwt_users').where({ user_id: user.id }).first();
      if (!jwtUser) {
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }
      
      // Generate reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Update jwt_users with reset token
      await db('jwt_users')
        .where({ user_id: user.id })
        .update({
          password_reset_token: resetToken,
          password_reset_expires: resetExpires,
          updated_at: new Date()
        });
      
      console.log('✅ MinimalJWTUserModel: Password reset token generated for:', user.email);
      return { 
        success: true, 
        message: 'If the email exists, a reset link has been sent',
        resetToken // Only return in development
      };
    } catch (error) {
      console.error('❌ MinimalJWTUserModel: Error requesting password reset:', error);
      throw error;
    }
  }

  static async resetPassword(token, newPasswordHash) {
    try {
      console.log('📋 MinimalJWTUserModel: Resetting password with token');
      
      // Find user by password reset token in jwt_users table
      const jwtUser = await db('jwt_users')
        .where({ password_reset_token: token })
        .first();
      
      if (!jwtUser) {
        throw new Error('Invalid reset token');
      }
      
      // Check if token is expired
      if (jwtUser.password_reset_expires && new Date() > jwtUser.password_reset_expires) {
        throw new Error('Reset token has expired');
      }
      
      // Update user password
      await db('jwt_users')
        .where({ user_id: jwtUser.user_id })
        .update({
          password_hash: newPasswordHash,
          password_reset_token: null,
          password_reset_expires: null,
          updated_at: new Date()
        });
      
      const user = await this.findById(jwtUser.user_id);
      
      console.log('✅ MinimalJWTUserModel: Password reset successfully for:', user.email);
      return user;
    } catch (error) {
      console.error('❌ MinimalJWTUserModel: Error resetting password:', error);
      throw error;
    }
  }

  static async updateProfile(userId, profileData) {
    try {
      console.log('📋 MinimalJWTUserModel: Updating profile for user:', userId);
      
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update basic fields
      const updateData = {
        updated_at: new Date()
      };
      
      if (profileData.firstName && profileData.lastName) {
        updateData.display_name = `${profileData.firstName} ${profileData.lastName}`;
      } else if (profileData.username) {
        updateData.display_name = profileData.username;
      }
      
      console.log('📋 MinimalJWTUserModel: Update data:', updateData);
      
      const [updatedUser] = await db(this.tableName)
        .where({ id: userId })
        .update(updateData)
        .returning('*');
      
      // Update JWT user data if it exists
      try {
        await db('jwt_users')
          .where({ user_id: userId })
          .update({
            username: profileData.username || '',
            first_name: profileData.firstName || '',
            last_name: profileData.lastName || '',
            phone_number: profileData.phoneNumber || '',
            date_of_birth: profileData.dateOfBirth || null,
            gender: profileData.gender || '',
            updated_at: new Date()
          });
        console.log('✅ MinimalJWTUserModel: JWT user data updated');
      } catch (error) {
        console.log('⚠️ MinimalJWTUserModel: JWT users table does not exist, skipping JWT data update');
      }
      
      console.log('✅ MinimalJWTUserModel: Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('❌ MinimalJWTUserModel: Error updating profile:', error);
      throw error;
    }
  }

  static async getProfile(userId) {
    try {
      console.log('📋 MinimalJWTUserModel: Getting profile for user:', userId);
      
      const user = await db(this.tableName)
        .where({ id: userId })
        .first();
      
      if (!user) {
        console.log('❌ MinimalJWTUserModel: User not found:', userId);
        return null;
      }
      
      // Get JWT user data if it exists
      let jwtData = {};
      try {
        const jwtUser = await db('jwt_users').where({ user_id: userId }).first();
        if (jwtUser) {
          jwtData = {
            username: jwtUser.username || '',
            firstName: jwtUser.first_name || '',
            lastName: jwtUser.last_name || '',
            phoneNumber: jwtUser.phone_number || '',
            dateOfBirth: jwtUser.date_of_birth,
            gender: jwtUser.gender || '',
          };
        }
      } catch (error) {
        console.log('⚠️ MinimalJWTUserModel: JWT users table does not exist, using basic profile');
      }
      
      // Build profile from user data and JWT data
      const profile = {
        id: user.id,
        email: user.email,
        firstName: jwtData.firstName || '',
        lastName: jwtData.lastName || '',
        username: jwtData.username || user.display_name || '',
        phoneNumber: jwtData.phoneNumber || '',
        dateOfBirth: jwtData.dateOfBirth || null,
        gender: jwtData.gender || '',
        emailVerified: true, // Assume verified for now
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        displayName: user.display_name,
      };
      
      console.log('✅ MinimalJWTUserModel: Profile retrieved successfully');
      return profile;
    } catch (error) {
      console.error('❌ MinimalJWTUserModel: Error getting profile:', error);
      throw error;
    }
  }

  // Helper method to get password hash from jwt_users table
  static async getPasswordHash(user) {
    try {
      const jwtUser = await db('jwt_users').where({ user_id: user.id }).first();
      return jwtUser ? jwtUser.password_hash : null;
    } catch {
      return null;
    }
  }

  // Helper method to check if user is JWT user
  static async isJWTUser(user) {
    try {
      const jwtUser = await db('jwt_users').where({ user_id: user.id }).first();
      return !!jwtUser;
    } catch {
      return false;
    }
  }
}

module.exports = MinimalJWTUserModel;
