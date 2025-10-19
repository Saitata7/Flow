/**
 * Migration: Add deleted_at columns to all tables for soft delete functionality
 * This ensures all tables support soft delete operations
 */

exports.up = async function(knex) {
  console.log('🔄 Adding deleted_at columns for soft delete functionality...');

  // List of tables that need deleted_at columns
  const tables = [
    'users',
    'user_profiles', 
    'user_settings',
    'flows',
    'flow_entries',
    'plans',
    'plan_participants',
    'emotions',
    'sync_queue',
    'notifications',
    'user_sessions',
    'api_keys',
    'audit_logs'
  ];

  for (const tableName of tables) {
    try {
      // Check if table exists
      const tableExists = await knex.schema.hasTable(tableName);
      if (!tableExists) {
        console.log(`⚠️  Table ${tableName} does not exist, skipping...`);
        continue;
      }

      // Check if deleted_at column already exists
      const columnExists = await knex.schema.hasColumn(tableName, 'deleted_at');
      if (columnExists) {
        console.log(`✅ Table ${tableName} already has deleted_at column`);
        continue;
      }

      // Add deleted_at column
      await knex.schema.alterTable(tableName, function(table) {
        table.timestamp('deleted_at').nullable();
      });

      console.log(`✅ Added deleted_at column to ${tableName}`);

      // Add index for better performance on soft delete queries
      await knex.schema.alterTable(tableName, function(table) {
        table.index('deleted_at', `${tableName}_deleted_at_idx`);
      });

      console.log(`✅ Added deleted_at index to ${tableName}`);

    } catch (error) {
      console.error(`❌ Error adding deleted_at to ${tableName}:`, error.message);
      // Continue with other tables even if one fails
    }
  }

  console.log('✅ Soft delete migration completed');
};

exports.down = async function(knex) {
  console.log('🔄 Removing deleted_at columns...');

  const tables = [
    'users',
    'user_profiles', 
    'user_settings',
    'flows',
    'flow_entries',
    'plans',
    'plan_participants',
    'emotions',
    'sync_queue',
    'notifications',
    'user_sessions',
    'api_keys',
    'audit_logs'
  ];

  for (const tableName of tables) {
    try {
      const tableExists = await knex.schema.hasTable(tableName);
      if (!tableExists) {
        continue;
      }

      const columnExists = await knex.schema.hasColumn(tableName, 'deleted_at');
      if (!columnExists) {
        continue;
      }

      // Remove index first
      await knex.schema.alterTable(tableName, function(table) {
        table.dropIndex('deleted_at', `${tableName}_deleted_at_idx`);
      });

      // Remove column
      await knex.schema.alterTable(tableName, function(table) {
        table.dropColumn('deleted_at');
      });

      console.log(`✅ Removed deleted_at column from ${tableName}`);

    } catch (error) {
      console.error(`❌ Error removing deleted_at from ${tableName}:`, error.message);
    }
  }

  console.log('✅ Soft delete rollback completed');
};
