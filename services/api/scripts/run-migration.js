#!/usr/bin/env node

/**
 * Run Database Migration Script
 * This script adds the missing profile columns to the users table
 */

const knex = require('knex');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Knex configuration for Cloud Run
const knexConfig = {
  client: 'pg',
  connection: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432,
    ssl: false, // Disable SSL for Cloud SQL socket connections
  },
  pool: {
    min: 1,
    max: 5,
  },
};

const db = knex(knexConfig);

async function addProfileColumns() {
  try {
    console.log('🔄 Adding profile columns to users table...');
    
    // Check if columns already exist
    const hasFirstName = await db.schema.hasColumn('users', 'first_name');
    const hasLastName = await db.schema.hasColumn('users', 'last_name');
    
    if (hasFirstName && hasLastName) {
      console.log('✅ Profile columns already exist, skipping migration');
      return;
    }
    
    // Add missing columns
    await db.schema.alterTable('users', function(table) {
      if (!hasFirstName) {
        table.string('first_name', 50);
        console.log('📝 Added first_name column');
      }
      if (!hasLastName) {
        table.string('last_name', 50);
        console.log('📝 Added last_name column');
      }
      
      // Add other profile columns that might be missing
      table.string('phone_number', 20);
      table.date('date_of_birth');
      table.string('gender', 20);
      table.string('race', 30);
      table.string('ethnicity', 50);
      table.string('disability', 30);
      table.string('preferred_language', 10).defaultTo('en');
      table.string('country', 100);
      table.string('timezone', 50);
      table.json('health_goals').defaultTo('[]');
      table.string('fitness_level', 20);
      table.text('medical_conditions');
      table.string('profile_visibility', 20).defaultTo('private');
      table.json('data_sharing').defaultTo('{"analytics": true, "research": false, "marketing": false}');
      table.timestamp('profile_updated_at');
    });
    
    console.log('✅ Profile columns added successfully!');
    
    // Add indexes for better performance
    await db.schema.alterTable('users', function(table) {
      table.index(['first_name', 'last_name']);
      table.index(['date_of_birth']);
      table.index(['gender']);
      table.index(['profile_visibility']);
    });
    
    console.log('✅ Indexes added successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run the migration
addProfileColumns()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
