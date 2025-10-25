// db/flowModel.js
// Simple Flow model for JWT-only mode
const { query } = require('./config');

class FlowModel {
  static tableName = 'flows';
  static settingsTableName = 'user_settings';

  // Settings management methods
  static async getUserSettings(userId) {
    try {
      const result = await query(
        `SELECT settings_data FROM ${this.settingsTableName} WHERE user_id = $1`,
        [userId]
      );
      return result.rows[0]?.settings_data || null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  static async updateUserSettings(userId, settingsData) {
    try {
      const existingSettings = await query(
        `SELECT id FROM ${this.settingsTableName} WHERE user_id = $1`,
        [userId]
      );
      
      if (existingSettings.rows.length > 0) {
        await query(
          `UPDATE ${this.settingsTableName} SET settings_data = $1, updated_at = NOW() WHERE user_id = $2`,
          [JSON.stringify(settingsData), userId]
        );
      } else {
        await query(
          `INSERT INTO ${this.settingsTableName} (user_id, settings_data, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())`,
          [userId, JSON.stringify(settingsData)]
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  // Basic flow methods
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
      console.error('Error creating flow:', error);
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
      console.error('Error finding flow by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const result = await query(
        `SELECT * FROM ${this.tableName} WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding flows by user ID:', error);
      throw error;
    }
  }

  static async findByUserIdWithStatus(userId, options = {}) {
    try {
      const { includeArchived = false, includeDeleted = false } = options;
      
      let whereClause = `WHERE owner_id = $1`;
      const params = [userId];
      
      if (!includeDeleted) {
        whereClause += ` AND deleted_at IS NULL`;
      }
      
      if (!includeArchived) {
        whereClause += ` AND archived = false`;
      }
      
      const result = await query(
        `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC`,
        params
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding flows by user ID with status:', error);
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
      console.error('Error updating flow:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await query(
        `UPDATE ${this.tableName} SET deleted_at = NOW() WHERE id = $1`,
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting flow:', error);
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
      console.error('Error soft deleting flow:', error);
      throw error;
    }
  }
}

module.exports = { FlowModel };
