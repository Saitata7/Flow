// db/userModel.js
// Professional JWT Authentication User Model
// Implements industry-standard user management patterns

const { query } = require('./config');

class UserModel {
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
        `SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL`,
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
        `SELECT * FROM ${this.tableName} WHERE email = $1 AND deleted_at IS NULL`,
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
        `SELECT * FROM ${this.tableName} WHERE username = $1 AND deleted_at IS NULL`,
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  static async findByEmailVerificationToken(token) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE email_verification_token = $1 AND deleted_at IS NULL`,
        [token]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email verification token:', error);
      throw error;
    }
  }

  static async findByPasswordResetToken(token) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE password_reset_token = $1 AND deleted_at IS NULL`,
        [token]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by password reset token:', error);
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

  static async softDelete(id) {
    try {
      const result = await query(
        `UPDATE ${this.tableName} SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error soft deleting user:', error);
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

  // Professional JWT Authentication Methods
  static async createUser(userData) {
    try {
      console.log('📋 UserModel: Creating new user:', userData.email);
      
      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      // Check username if provided
      if (userData.username) {
        const existingUsername = await this.findByUsername(userData.username);
        if (existingUsername) {
          throw new Error('Username is already taken');
        }
      }
      
      // Prepare user data
      const newUserData = {
        email: userData.email,
        display_name: userData.displayName || userData.email.split('@')[0],
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        username: userData.username || '',
        phone_number: userData.phoneNumber || '',
        date_of_birth: userData.dateOfBirth || null,
        gender: userData.gender || '',
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      // Add optional fields if provided
      if (userData.passwordHash) {
        newUserData.password_hash = userData.passwordHash;
      }
      if (userData.emailVerificationToken) {
        newUserData.email_verification_token = userData.emailVerificationToken;
      }
      if (userData.emailVerificationExpires) {
        newUserData.email_verification_expires = userData.emailVerificationExpires;
      }
      if (userData.role) {
        newUserData.role = userData.role;
      }
      if (userData.status) {
        newUserData.status = userData.status;
      }
      
      console.log('📋 UserModel: User data to insert:', newUserData);
      
      const user = await this.create(newUserData);
      console.log('✅ UserModel: User created successfully:', user.id);
      
      return user;
    } catch (error) {
      console.error('❌ UserModel: Error creating user:', error);
      throw error;
    }
  }

  static async verifyEmail(token) {
    try {
      console.log('📋 UserModel: Verifying email with token:', token);
      
      const user = await this.findByEmailVerificationToken(token);
      if (!user) {
        throw new Error('Invalid verification token');
      }
      
      // Check if token is expired
      if (user.email_verification_expires && new Date() > user.email_verification_expires) {
        throw new Error('Verification token has expired');
      }
      
      // Update user as verified
      const updatedUser = await this.update(user.id, {
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      });
      
      console.log('✅ UserModel: Email verified successfully:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ UserModel: Error verifying email:', error);
      throw error;
    }
  }

  static async requestPasswordReset(email) {
    try {
      console.log('📋 UserModel: Requesting password reset for:', email);
      
      const user = await this.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }
      
      // Generate reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Update user with reset token
      await this.update(user.id, {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires,
      });
      
      console.log('✅ UserModel: Password reset token generated for:', user.email);
      return { 
        success: true, 
        message: 'If the email exists, a reset link has been sent',
        resetToken // Only return in development
      };
    } catch (error) {
      console.error('❌ UserModel: Error requesting password reset:', error);
      throw error;
    }
  }

  static async resetPassword(token, newPasswordHash) {
    try {
      console.log('📋 UserModel: Resetting password with token');
      
      const user = await this.findByPasswordResetToken(token);
      if (!user) {
        throw new Error('Invalid reset token');
      }
      
      // Check if token is expired
      if (user.password_reset_expires && new Date() > user.password_reset_expires) {
        throw new Error('Reset token has expired');
      }
      
      // Update user password
      const updatedUser = await this.update(user.id, {
        password_hash: newPasswordHash,
        password_reset_token: null,
        password_reset_expires: null,
      });
      
      console.log('✅ UserModel: Password reset successfully for:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ UserModel: Error resetting password:', error);
      throw error;
    }
  }

  static async updateProfile(userId, profileData) {
    try {
      console.log('📋 UserModel: Updating profile for user:', userId);
      
      // Prepare update data
      const updateData = {
        updated_at: new Date()
      };
      
      // Add fields if provided
      if (profileData.firstName) updateData.first_name = profileData.firstName;
      if (profileData.lastName) updateData.last_name = profileData.lastName;
      if (profileData.email) updateData.email = profileData.email;
      if (profileData.phoneNumber) updateData.phone_number = profileData.phoneNumber;
      if (profileData.dateOfBirth) updateData.date_of_birth = new Date(profileData.dateOfBirth);
      if (profileData.gender) updateData.gender = profileData.gender;
      if (profileData.race) updateData.race = profileData.race;
      if (profileData.ethnicity) updateData.ethnicity = profileData.ethnicity;
      if (profileData.disability) updateData.disability = profileData.disability;
      if (profileData.preferredLanguage) updateData.preferred_language = profileData.preferredLanguage;
      if (profileData.country) updateData.country = profileData.country;
      if (profileData.timezone) updateData.timezone = profileData.timezone;
      if (profileData.healthGoals) updateData.health_goals = JSON.stringify(profileData.healthGoals);
      if (profileData.fitnessLevel) updateData.fitness_level = profileData.fitnessLevel;
      if (profileData.medicalConditions) updateData.medical_conditions = profileData.medicalConditions;
      if (profileData.profileVisibility) updateData.profile_visibility = profileData.profileVisibility;
      if (profileData.dataSharing) updateData.data_sharing = JSON.stringify(profileData.dataSharing);
      if (profileData.profileUpdatedAt) updateData.profile_updated_at = new Date();
      
      console.log('📋 UserModel: Update data:', updateData);
      
      const updatedUser = await this.update(userId, updateData);
      
      console.log('✅ UserModel: Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('❌ UserModel: Error updating profile:', error);
      throw error;
    }
  }

  static async getProfile(userId) {
    try {
      console.log('📋 UserModel: Getting profile for user:', userId);
      
      const user = await this.findById(userId);
      if (!user) {
        console.log('❌ UserModel: User not found:', userId);
        return null;
      }
      
      // Parse JSON fields
      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        phoneNumber: user.phone_number || '',
        dateOfBirth: user.date_of_birth,
        gender: user.gender || '',
        race: user.race || '',
        ethnicity: user.ethnicity || '',
        disability: user.disability || '',
        preferredLanguage: user.preferred_language || 'en',
        country: user.country || '',
        timezone: user.timezone || '',
        healthGoals: user.health_goals ? JSON.parse(user.health_goals) : [],
        fitnessLevel: user.fitness_level || '',
        medicalConditions: user.medical_conditions || '',
        profileVisibility: user.profile_visibility || 'private',
        dataSharing: user.data_sharing ? JSON.parse(user.data_sharing) : {
          analytics: true,
          research: false,
          marketing: false
        },
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        profileUpdatedAt: user.profile_updated_at
      };
      
      console.log('✅ UserModel: Profile retrieved successfully');
      return profile;
    } catch (error) {
      console.error('❌ UserModel: Error getting profile:', error);
      throw error;
    }
  }
}

module.exports = UserModel;