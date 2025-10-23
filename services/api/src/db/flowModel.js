// db/flowModel.js
// Simple Flow model for JWT-only mode
const db = require('./config').db;

class FlowModel {
  static tableName = 'flows';
  static settingsTableName = 'user_settings';

  // Settings management methods
  static async getUserSettings(userId) {
    try {
      const settings = await db(this.settingsTableName).where({ user_id: userId }).first();
      return settings ? settings.settings_data : null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  static async updateUserSettings(userId, settingsData) {
    try {
      const existingSettings = await db(this.settingsTableName).where({ user_id: userId }).first();
      
      if (existingSettings) {
        await db(this.settingsTableName)
          .where({ user_id: userId })
          .update({ 
            settings_data: settingsData,
            updated_at: new Date()
          });
      } else {
        await db(this.settingsTableName).insert({
          user_id: userId,
          settings_data: settingsData,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Basic flow methods
  static async create(data) {
    const [flow] = await db(this.tableName).insert(data).returning('*');
    return flow;
  }

  static async findById(id) {
    return db(this.tableName).where({ id, deleted_at: null }).first();
  }

  static async findByUserId(userId) {
    return db(this.tableName).where({ owner_id: userId, deleted_at: null });
  }

  static async update(id, data) {
    const [flow] = await db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return flow;
  }

  static async delete(id) {
    return db(this.tableName).where({ id }).update({ deleted_at: new Date() });
  }
}

module.exports = { FlowModel };
