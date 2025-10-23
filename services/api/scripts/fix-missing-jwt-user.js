#!/usr/bin/env node
/**
 * Fix Missing JWT User Script
 * Safely adds missing JWT user records without affecting existing data
 */

const knex = require('knex');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || '34.63.78.153',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'flow',
    user: process.env.DB_USER || 'flow_user',
    password: process.env.DB_PASSWORD,
    ssl: false
  }
};

const db = knex(dbConfig);

async function fixMissingJWTUser(email) {
  try {
    console.log(`🔍 Checking user: ${email}`);
    
    // Find user in users table
    const user = await db('users').where({ email }).first();
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    
    // Check if JWT user record exists
    const jwtUser = await db('jwt_users').where({ user_id: user.id }).first();
    if (jwtUser) {
      console.log(`✅ JWT user record already exists for: ${email}`);
      return;
    }
    
    console.log(`⚠️ Missing JWT user record for: ${email}`);
    console.log(`🔧 Creating JWT user record...`);
    
    // Create JWT user record with minimal required data
    const jwtUserData = {
      user_id: user.id,
      password_hash: '', // Will be set when user resets password
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      date_of_birth: user.date_of_birth || null,
      gender: user.gender || '',
      email_verification_token: null,
      email_verification_expires: null,
      password_reset_token: null,
      password_reset_expires: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db('jwt_users').insert(jwtUserData);
    console.log(`✅ JWT user record created successfully for: ${email}`);
    
  } catch (error) {
    console.error(`❌ Error fixing JWT user for ${email}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting JWT User Fix Script');
    console.log('=====================================');
    
    // Fix the specific user
    await fixMissingJWTUser('saitata7@gmail.com');
    
    console.log('=====================================');
    console.log('✅ JWT User Fix Script Completed');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixMissingJWTUser };
