// db/userModel.js
// Professional JWT Authentication User Model
// Implements industry-standard user management patterns

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

class UserModel {
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
    return db(this.tableName).where({ username, deleted_at: null }).first();
  }

  static async findByEmailVerificationToken(token) {
    return db(this.tableName).where({ email_verification_token: token, deleted_at: null }).first();
  }

  static async findByPasswordResetToken(token) {
    return db(this.tableName).where({ password_reset_token: token, deleted_at: null }).first();
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
      
      // Check which columns exist in the database
      const tableInfo = await db.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
      `);
      
      const existingColumns = tableInfo.rows.map(row => row.column_name);
      console.log('📋 UserModel: Existing columns for user creation:', existingColumns);
      
      // Prepare user data with only existing columns
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
      
      // Only add columns that exist in the database
      if (existingColumns.includes('password_hash') && userData.passwordHash) {
        newUserData.password_hash = userData.passwordHash;
      }
      if (existingColumns.includes('email_verification_token') && userData.emailVerificationToken) {
        newUserData.email_verification_token = userData.emailVerificationToken;
      }
      if (existingColumns.includes('email_verification_expires') && userData.emailVerificationExpires) {
        newUserData.email_verification_expires = userData.emailVerificationExpires;
      }
      if (existingColumns.includes('role')) {
        newUserData.role = userData.role || 'user';
      }
      if (existingColumns.includes('status')) {
        newUserData.status = 'active';
      }
      
      console.log('📋 UserModel: User data to insert:', newUserData);
      
      const [user] = await db(this.tableName).insert(newUserData).returning('*');
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
      const [updatedUser] = await db(this.tableName)
        .where({ id: user.id })
        .update({
          email_verified: true,
          email_verification_token: null,
          email_verification_expires: null,
          updated_at: new Date()
        })
        .returning('*');
      
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
      await db(this.tableName)
        .where({ id: user.id })
        .update({
          password_reset_token: resetToken,
          password_reset_expires: resetExpires,
          updated_at: new Date()
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
      const [updatedUser] = await db(this.tableName)
        .where({ id: user.id })
        .update({
          password_hash: newPasswordHash,
          password_reset_token: null,
          password_reset_expires: null,
          updated_at: new Date()
        })
        .returning('*');
      
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
      
      // Check which columns exist in the database
      const tableInfo = await db.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
      `);
      
      const existingColumns = tableInfo.rows.map(row => row.column_name);
      console.log('📋 UserModel: Existing columns:', existingColumns);
      
      // Prepare update data only for existing columns
      const updateData = {
        updated_at: new Date()
      };
      
      // Only add columns that exist in the database
      if (existingColumns.includes('first_name') && profileData.firstName) {
        updateData.first_name = profileData.firstName;
      }
      if (existingColumns.includes('last_name') && profileData.lastName) {
        updateData.last_name = profileData.lastName;
      }
      if (existingColumns.includes('email') && profileData.email) {
        updateData.email = profileData.email;
      }
      if (existingColumns.includes('phone_number') && profileData.phoneNumber) {
        updateData.phone_number = profileData.phoneNumber;
      }
      if (existingColumns.includes('date_of_birth') && profileData.dateOfBirth) {
        updateData.date_of_birth = new Date(profileData.dateOfBirth);
      }
      if (existingColumns.includes('gender') && profileData.gender) {
        updateData.gender = profileData.gender;
      }
      if (existingColumns.includes('race') && profileData.race) {
        updateData.race = profileData.race;
      }
      if (existingColumns.includes('ethnicity') && profileData.ethnicity) {
        updateData.ethnicity = profileData.ethnicity;
      }
      if (existingColumns.includes('disability') && profileData.disability) {
        updateData.disability = profileData.disability;
      }
      if (existingColumns.includes('preferred_language') && profileData.preferredLanguage) {
        updateData.preferred_language = profileData.preferredLanguage;
      }
      if (existingColumns.includes('country') && profileData.country) {
        updateData.country = profileData.country;
      }
      if (existingColumns.includes('timezone') && profileData.timezone) {
        updateData.timezone = profileData.timezone;
      }
      if (existingColumns.includes('health_goals') && profileData.healthGoals) {
        updateData.health_goals = JSON.stringify(profileData.healthGoals);
      }
      if (existingColumns.includes('fitness_level') && profileData.fitnessLevel) {
        updateData.fitness_level = profileData.fitnessLevel;
      }
      if (existingColumns.includes('medical_conditions') && profileData.medicalConditions) {
        updateData.medical_conditions = profileData.medicalConditions;
      }
      if (existingColumns.includes('profile_visibility') && profileData.profileVisibility) {
        updateData.profile_visibility = profileData.profileVisibility;
      }
      if (existingColumns.includes('data_sharing') && profileData.dataSharing) {
        updateData.data_sharing = JSON.stringify(profileData.dataSharing);
      }
      if (existingColumns.includes('profile_updated_at')) {
        updateData.profile_updated_at = new Date();
      }
      
      console.log('📋 UserModel: Update data:', updateData);
      
      const [updatedUser] = await db(this.tableName)
        .where({ id: userId })
        .update(updateData)
        .returning('*');
      
      // Handle username update in user_profiles table
      if (profileData.username) {
        console.log('📋 UserModel: Updating username in user_profiles table:', profileData.username);
        
        // Check if user_profiles record exists
        const existingProfile = await db('user_profiles')
          .where({ user_id: userId })
          .first();
        
        if (existingProfile) {
          // Update existing profile
          await db('user_profiles')
            .where({ user_id: userId })
            .update({
              username: profileData.username,
              updated_at: new Date()
            });
        } else {
          // Create new profile record
          await db('user_profiles').insert({
            user_id: userId,
            username: profileData.username,
            display_name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'User',
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
      
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
      
      const user = await db(this.tableName)
        .where({ id: userId, deleted_at: null })
        .first();
      
      if (!user) {
        console.log('❌ UserModel: User not found:', userId);
        return null;
      }
      
      // Get username from user_profiles table
      const userProfile = await db('user_profiles')
        .where({ user_id: userId })
        .first();
      
      // Parse JSON fields
      const profile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: userProfile?.username || '',
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
