// db/minimalJWTUserModel.js
// Minimal JWT User Model that works with the actual database schema
// Based on the actual columns that exist: id, email, display_name, created_at

const { query } = require('./config');

class MinimalJWTUserModel {
  static tableName = 'users';

  static async create(data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      
      const queryText = `
        INSERT INTO ${this.tableName} (${columns.join(', ')}) 
        VALUES (${placeholders}) 
        RETURNING *
      `;
      
      const result = await query(queryText, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE email = $1`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE display_name = $1`,
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
      
      const queryText = `
        UPDATE ${this.tableName} 
        SET ${setClause}, updated_at = NOW() 
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await query(queryText, [id, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const result = await query(`SELECT * FROM ${this.tableName}`);
      return result.rows;
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
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
        firebase_uid: `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique firebase_uid for JWT users
      };
      
      // Add password hash if provided
      if (userData.passwordHash) {
        newUserData.password_hash = userData.passwordHash;
      }
      
      // Add other fields if provided
      if (userData.firstName) {
        newUserData.first_name = userData.firstName;
      }
      if (userData.lastName) {
        newUserData.last_name = userData.lastName;
      }
      if (userData.phoneNumber) {
        newUserData.phone_number = userData.phoneNumber;
      }
      if (userData.dateOfBirth) {
        newUserData.date_of_birth = userData.dateOfBirth;
      }
      if (userData.gender) {
        newUserData.gender = userData.gender;
      }
      if (userData.emailVerificationToken) {
        newUserData.email_verification_token = userData.emailVerificationToken;
      }
      if (userData.emailVerificationExpires) {
        newUserData.email_verification_expires = userData.emailVerificationExpires;
      }
      
      console.log('📋 MinimalJWTUserModel: User data to insert:', newUserData);
      
      const user = await this.create(newUserData);
      console.log('✅ MinimalJWTUserModel: User created successfully:', user.id);
      
      // Also try to store in jwt_users table if it exists (for backwards compatibility)
      if (userData.passwordHash) {
        try {
          await query(`
            INSERT INTO jwt_users (
              user_id, password_hash, username, first_name, last_name, 
              phone_number, date_of_birth, gender, email_verification_token, 
              email_verification_expires, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          `, [
            user.id,
            userData.passwordHash,
            userData.username || '',
            userData.firstName || '',
            userData.lastName || '',
            userData.phoneNumber || '',
            userData.dateOfBirth || null,
            userData.gender || '',
            userData.emailVerificationToken,
            userData.emailVerificationExpires
          ]);
          console.log('✅ MinimalJWTUserModel: JWT user data also stored in jwt_users table');
        } catch (error) {
          console.log('⚠️ MinimalJWTUserModel: jwt_users table does not exist (password stored in users table)');
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
      const result = await query(
        `SELECT * FROM jwt_users WHERE email_verification_token = $1`,
        [token]
      );
      
      const jwtUser = result.rows[0];
      if (!jwtUser) {
        throw new Error('Invalid verification token');
      }
      
      // Check if token is expired
      if (jwtUser.email_verification_expires && new Date() > jwtUser.email_verification_expires) {
        throw new Error('Verification token has expired');
      }
      
      // Update user as verified
      const updatedUser = await this.update(jwtUser.user_id, {
        updated_at: new Date()
      });
      
      // Clear verification token
      await query(`
        UPDATE jwt_users 
        SET email_verification_token = NULL, 
            email_verification_expires = NULL, 
            updated_at = NOW() 
        WHERE user_id = $1
      `, [jwtUser.user_id]);
      
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
      const jwtResult = await query(
        `SELECT * FROM jwt_users WHERE user_id = $1`,
        [user.id]
      );
      
      const jwtUser = jwtResult.rows[0];
      if (!jwtUser) {
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }
      
      // Generate reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Update jwt_users with reset token
      await query(`
        UPDATE jwt_users 
        SET password_reset_token = $1, 
            password_reset_expires = $2, 
            updated_at = NOW() 
        WHERE user_id = $3
      `, [resetToken, resetExpires, user.id]);
      
      console.log('✅ MinimalJWTUserModel: Password reset token generated for:', user.email);
      return { 
        success: true, 
        message: 'If the email exists, a reset link has been sent',
        resetToken // Always return resetToken for email service
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
      const result = await query(
        `SELECT * FROM jwt_users WHERE password_reset_token = $1`,
        [token]
      );
      
      const jwtUser = result.rows[0];
      if (!jwtUser) {
        throw new Error('Invalid reset token');
      }
      
      // Check if token is expired
      if (jwtUser.password_reset_expires && new Date() > jwtUser.password_reset_expires) {
        throw new Error('Reset token has expired');
      }
      
      // Update user password
      await query(`
        UPDATE jwt_users 
        SET password_hash = $1, 
            password_reset_token = NULL, 
            password_reset_expires = NULL, 
            updated_at = NOW() 
        WHERE user_id = $2
      `, [newPasswordHash, jwtUser.user_id]);
      
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
      
      const updatedUser = await this.update(userId, updateData);
      
      // Update JWT user data if it exists
      try {
        await query(`
          UPDATE jwt_users 
          SET username = $1, 
              first_name = $2, 
              last_name = $3, 
              phone_number = $4, 
              date_of_birth = $5, 
              gender = $6, 
              updated_at = NOW() 
          WHERE user_id = $7
        `, [
          profileData.username || '',
          profileData.firstName || '',
          profileData.lastName || '',
          profileData.phoneNumber || '',
          profileData.dateOfBirth || null,
          profileData.gender || '',
          userId
        ]);
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
      
      const user = await this.findById(userId);
      if (!user) {
        console.log('❌ MinimalJWTUserModel: User not found:', userId);
        return null;
      }
      
      // Get JWT user data if it exists
      let jwtData = {};
      try {
        const jwtResult = await query(
          `SELECT * FROM jwt_users WHERE user_id = $1`,
          [userId]
        );
        
        const jwtUser = jwtResult.rows[0];
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
      // Try jwt_users table first (if it exists)
      const result = await query(
        `SELECT password_hash FROM jwt_users WHERE user_id = $1`,
        [user.id]
      );
      if (result.rows[0]?.password_hash) {
        return result.rows[0].password_hash;
      }
      
      // Fallback to users table
      const userResult = await query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [user.id]
      );
      return userResult.rows[0]?.password_hash || null;
    } catch (error) {
      console.warn('⚠️ Error getting password hash:', error.message);
      return null;
    }
  }

  // Helper method to check if user is JWT user
  static async isJWTUser(user) {
    try {
      const result = await query(
        `SELECT id FROM jwt_users WHERE user_id = $1`,
        [user.id]
      );
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }
}

module.exports = MinimalJWTUserModel;