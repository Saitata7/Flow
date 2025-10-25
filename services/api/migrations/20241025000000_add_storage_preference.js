/**
 * Add storage_preference column to flows table
 * 
 * This migration adds the storage_preference column to the flows table
 * to support local vs cloud storage preferences.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function(knex) {
  console.log('🏗️ Adding storage_preference column to flows table...');

  try {
    await knex.schema.alterTable('flows', function(table) {
      table.enum('storage_preference', ['local', 'cloud']).defaultTo('cloud').after('visibility');
    });

    console.log('✅ Successfully added storage_preference column to flows table');
  } catch (error) {
    console.error('❌ Error adding storage_preference column:', error);
    throw error;
  }
};

exports.down = async function(knex) {
  console.log('🔄 Removing storage_preference column from flows table...');

  try {
    await knex.schema.alterTable('flows', function(table) {
      table.dropColumn('storage_preference');
    });

    console.log('✅ Successfully removed storage_preference column from flows table');
  } catch (error) {
    console.error('❌ Error removing storage_preference column:', error);
    throw error;
  }
};
