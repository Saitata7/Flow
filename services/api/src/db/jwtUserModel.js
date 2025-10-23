// db/jwtUserModel.js
// Simplified JWT User Model that works with existing database schema
// Uses existing columns and stores JWT-specific data in auth_metadata

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

class JWTUserModel {
  static tableName = 'users';

  static async create(data) {
    const [user] = await db(this.tableName).insert(data).returning('*');
    return user;
  }

  static async findById(id) {
    return db(this.tableName).where({ id, deleted_at: null }).first();
  }

  static async findByEmail(email) {
    return db(this.tableName).where({ email, deleted_at: null }).first();
  }

  static async findByUsername(username) {
    // For now, we'll store username in auth_metadata
    const users = await db(this.tableName).where({ deleted_at: null }).select('*');
    return users.find(user => {
      try {
        const metadata = JSON.parse(user.auth_metadata || '{}');
        return metadata.username === username;
      } catch {
        return false;
      }
    });
  }

  static async update(id, data) {
    const [user] = await db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return user;
  }

  static async delete(id) {
    return db(this.tableName).where({ id }).del();
  }

  static async softDelete(id) {
    return db(this.tableName)
      .where({ id })
      .update({ deleted_at: new Date(), updated_at: new Date() });
  }

  static async findAll() {
    return db(this.tableName).select('*');
  }

  // JWT Authentication Methods
  static async createUser(userData) {
    try {
      console.log('📋 JWTUserModel: Creating new user:', userData.email);
      
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
      
      // Store JWT-specific data in auth_metadata
      const authMetadata = {
        provider: 'jwt',
        password_hash: userData.passwordHash,
        username: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        dateOfBirth: userData.dateOfBirth || null,
        gender: userData.gender || '',
        emailVerificationToken: userData.emailVerificationToken,
        emailVerificationExpires: userData.emailVerificationExpires,
        created_via: 'jwt_registration'
      };
      
      // Create user with existing schema
      const newUserData = {
        firebase_uid: `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
        email: userData.email,
        display_name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : userData.email.split('@')[0],
        email_verified: false,
        auth_provider: 'jwt',
        auth_metadata: JSON.stringify(authMetadata),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      console.log('📋 JWTUserModel: User data to insert:', newUserData);
      
      const [user] = await db(this.tableName).insert(newUserData).returning('*');
      console.log('✅ JWTUserModel: User created successfully:', user.id);
      
      return user;
    } catch (error) {
      console.error('❌ JWTUserModel: Error creating user:', error);
      throw error;
    }
  }

  static async verifyEmail(token) {
    try {
      console.log('📋 JWTUserModel: Verifying email with token:', token);
      
      // Find user by email verification token in auth_metadata
      const users = await db(this.tableName).where({ deleted_at: null }).select('*');
      const user = users.find(u => {
        try {
          const metadata = JSON.parse(u.auth_metadata || '{}');
          return metadata.emailVerificationToken === token;
        } catch {
          return false;
        }
      });
      
      if (!user) {
        throw new Error('Invalid verification token');
      }
      
      // Check if token is expired
      try {
        const metadata = JSON.parse(user.auth_metadata || '{}');
        if (metadata.emailVerificationExpires && new Date() > new Date(metadata.emailVerificationExpires)) {
          throw new Error('Verification token has expired');
        }
      } catch (error) {
        throw new Error('Invalid verification token');
      }
      
      // Update user as verified
      const updatedMetadata = JSON.parse(user.auth_metadata || '{}');
      updatedMetadata.emailVerificationToken = null;
      updatedMetadata.emailVerificationExpires = null;
      
      const [updatedUser] = await db(this.tableName)
        .where({ id: user.id })
        .update({
          email_verified: true,
          auth_metadata: JSON.stringify(updatedMetadata),
          updated_at: new Date()
        })
        .returning('*');
      
      console.log('✅ JWTUserModel: Email verified successfully:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ JWTUserModel: Error verifying email:', error);
      throw error;
    }
  }

  static async requestPasswordReset(email) {
    try {
      console.log('📋 JWTUserModel: Requesting password reset for:', email);
      
      const user = await this.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return { success: true, message: 'If the email exists, a reset link has been sent' };
      }
      
      // Generate reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Update auth_metadata with reset token
      const metadata = JSON.parse(user.auth_metadata || '{}');
      metadata.passwordResetToken = resetToken;
      metadata.passwordResetExpires = resetExpires.toISOString();
      
      await db(this.tableName)
        .where({ id: user.id })
        .update({
          auth_metadata: JSON.stringify(metadata),
          updated_at: new Date()
        });
      
      console.log('✅ JWTUserModel: Password reset token generated for:', user.email);
      return { 
        success: true, 
        message: 'If the email exists, a reset link has been sent',
        resetToken // Only return in development
      };
    } catch (error) {
      console.error('❌ JWTUserModel: Error requesting password reset:', error);
      throw error;
    }
  }

  static async resetPassword(token, newPasswordHash) {
    try {
      console.log('📋 JWTUserModel: Resetting password with token');
      
      // Find user by password reset token in auth_metadata
      const users = await db(this.tableName).where({ deleted_at: null }).select('*');
      const user = users.find(u => {
        try {
          const metadata = JSON.parse(u.auth_metadata || '{}');
          return metadata.passwordResetToken === token;
        } catch {
          return false;
        }
      });
      
      if (!user) {
        throw new Error('Invalid reset token');
      }
      
      // Check if token is expired
      try {
        const metadata = JSON.parse(user.auth_metadata || '{}');
        if (metadata.passwordResetExpires && new Date() > new Date(metadata.passwordResetExpires)) {
          throw new Error('Reset token has expired');
        }
      } catch (error) {
        throw new Error('Invalid reset token');
      }
      
      // Update user password in auth_metadata
      const metadata = JSON.parse(user.auth_metadata || '{}');
      metadata.password_hash = newPasswordHash;
      metadata.passwordResetToken = null;
      metadata.passwordResetExpires = null;
      
      const [updatedUser] = await db(this.tableName)
        .where({ id: user.id })
        .update({
          auth_metadata: JSON.stringify(metadata),
          updated_at: new Date()
        })
        .returning('*');
      
      console.log('✅ JWTUserModel: Password reset successfully for:', updatedUser.email);
      return updatedUser;
    } catch (error) {
      console.error('❌ JWTUserModel: Error resetting password:', error);
      throw error;
    }
  }

  static async updateProfile(userId, profileData) {
    try {
      console.log('📋 JWTUserModel: Updating profile for user:', userId);
      
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
      }
      
      // Update auth_metadata with profile data
      const metadata = JSON.parse(user.auth_metadata || '{}');
      
      if (profileData.firstName) metadata.firstName = profileData.firstName;
      if (profileData.lastName) metadata.lastName = profileData.lastName;
      if (profileData.username) metadata.username = profileData.username;
      if (profileData.phoneNumber) metadata.phoneNumber = profileData.phoneNumber;
      if (profileData.dateOfBirth) metadata.dateOfBirth = profileData.dateOfBirth;
      if (profileData.gender) metadata.gender = profileData.gender;
      
      updateData.auth_metadata = JSON.stringify(metadata);
      
      console.log('📋 JWTUserModel: Update data:', updateData);
      
      const [updatedUser] = await db(this.tableName)
        .where({ id: userId })
        .update(updateData)
        .returning('*');
      
      console.log('✅ JWTUserModel: Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('❌ JWTUserModel: Error updating profile:', error);
      throw error;
    }
  }

  static async getProfile(userId) {
    try {
      console.log('📋 JWTUserModel: Getting profile for user:', userId);
      
      const user = await db(this.tableName)
        .where({ id: userId, deleted_at: null })
        .first();
      
      if (!user) {
        console.log('❌ JWTUserModel: User not found:', userId);
        return null;
      }
      
      // Parse auth_metadata
      const metadata = JSON.parse(user.auth_metadata || '{}');
      
      // Build profile from user data and metadata
      const profile = {
        id: user.id,
        email: user.email,
        firstName: metadata.firstName || '',
        lastName: metadata.lastName || '',
        username: metadata.username || '',
        phoneNumber: metadata.phoneNumber || '',
        dateOfBirth: metadata.dateOfBirth || null,
        gender: metadata.gender || '',
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        displayName: user.display_name,
        photoUrl: user.photo_url,
        status: user.status
      };
      
      console.log('✅ JWTUserModel: Profile retrieved successfully');
      return profile;
    } catch (error) {
      console.error('❌ JWTUserModel: Error getting profile:', error);
      throw error;
    }
  }

  // Helper method to get password hash from auth_metadata
  static getPasswordHash(user) {
    try {
      const metadata = JSON.parse(user.auth_metadata || '{}');
      return metadata.password_hash;
    } catch {
      return null;
    }
  }

  // Helper method to check if user is JWT user
  static isJWTUser(user) {
    return user.auth_provider === 'jwt';
  }
}

module.exports = JWTUserModel;
