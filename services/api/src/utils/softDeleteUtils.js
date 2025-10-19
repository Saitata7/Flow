/**
 * Soft Delete Utility Functions
 * Provides consistent soft delete functionality across all models
 */

const { db } = require('./models');

class SoftDeleteUtils {
  /**
   * Soft delete a record by setting deleted_at timestamp
   * @param {string} tableName - Name of the table
   * @param {string|object} identifier - ID or where clause object
   * @param {string} idColumn - Name of the ID column (default: 'id')
   * @returns {Promise<number>} Number of affected rows
   */
  static async softDelete(tableName, identifier, idColumn = 'id') {
    const whereClause = typeof identifier === 'string' 
      ? { [idColumn]: identifier }
      : identifier;

    return db(tableName)
      .where(whereClause)
      .update({ 
        deleted_at: new Date(), 
        updated_at: new Date() 
      });
  }

  /**
   * Restore a soft-deleted record by clearing deleted_at timestamp
   * @param {string} tableName - Name of the table
   * @param {string|object} identifier - ID or where clause object
   * @param {string} idColumn - Name of the ID column (default: 'id')
   * @returns {Promise<number>} Number of affected rows
   */
  static async restore(tableName, identifier, idColumn = 'id') {
    const whereClause = typeof identifier === 'string' 
      ? { [idColumn]: identifier }
      : identifier;

    return db(tableName)
      .where(whereClause)
      .update({ 
        deleted_at: null, 
        updated_at: new Date() 
      });
  }

  /**
   * Hard delete a record (permanent deletion)
   * @param {string} tableName - Name of the table
   * @param {string|object} identifier - ID or where clause object
   * @param {string} idColumn - Name of the ID column (default: 'id')
   * @returns {Promise<number>} Number of affected rows
   */
  static async hardDelete(tableName, identifier, idColumn = 'id') {
    const whereClause = typeof identifier === 'string' 
      ? { [idColumn]: identifier }
      : identifier;

    return db(tableName)
      .where(whereClause)
      .del();
  }

  /**
   * Get all records including soft-deleted ones
   * @param {string} tableName - Name of the table
   * @param {object} whereClause - Optional where conditions
   * @returns {Promise<Array>} All records
   */
  static async findAllWithDeleted(tableName, whereClause = {}) {
    return db(tableName)
      .where(whereClause)
      .orderBy('created_at', 'desc');
  }

  /**
   * Get only soft-deleted records
   * @param {string} tableName - Name of the table
   * @param {object} whereClause - Optional where conditions
   * @returns {Promise<Array>} Soft-deleted records
   */
  static async findDeletedOnly(tableName, whereClause = {}) {
    return db(tableName)
      .where({ ...whereClause, deleted_at: { $ne: null } })
      .orderBy('deleted_at', 'desc');
  }

  /**
   * Check if a record is soft-deleted
   * @param {string} tableName - Name of the table
   * @param {string|object} identifier - ID or where clause object
   * @param {string} idColumn - Name of the ID column (default: 'id')
   * @returns {Promise<boolean>} True if soft-deleted
   */
  static async isDeleted(tableName, identifier, idColumn = 'id') {
    const whereClause = typeof identifier === 'string' 
      ? { [idColumn]: identifier }
      : identifier;

    const record = await db(tableName)
      .where(whereClause)
      .first();

    return record && record.deleted_at !== null;
  }

  /**
   * Cleanup old soft-deleted records (older than specified days)
   * @param {string} tableName - Name of the table
   * @param {number} daysOld - Number of days old (default: 30)
   * @returns {Promise<number>} Number of records permanently deleted
   */
  static async cleanupOldDeleted(tableName, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return db(tableName)
      .where('deleted_at', '<', cutoffDate)
      .del();
  }
}

module.exports = SoftDeleteUtils;
