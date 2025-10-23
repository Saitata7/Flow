#!/usr/bin/env node
/**
 * Delete and Recreate User Script
 * Safely removes existing user and creates a new one
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

async function deleteAndRecreateUser(email, newPassword) {
  try {
    console.log(`🔍 Processing user: ${email}`);
    
    // Find user in users table
    const user = await db('users').where({ email }).first();
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    
    // Delete from jwt_users first (foreign key constraint)
    await db('jwt_users').where({ user_id: user.id }).del();
    console.log(`✅ Deleted JWT user record`);
    
    // Delete from users table
    await db('users').where({ id: user.id }).del();
    console.log(`✅ Deleted user record`);
    
    // Create new user with fresh data
    console.log(`🔧 Creating new user...`);
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const newUserData = {
      email: email,
      email_verified: false,
      display_name: 'Sai Tata',
      status: 'active',
      schema_version: 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const [newUser] = await db('users').insert(newUserData).returning('*');
    console.log(`✅ New user created: ${newUser.email} (ID: ${newUser.id})`);
    
    // Create JWT user record
    const jwtUserData = {
      user_id: newUser.id,
      password_hash: hashedPassword,
      username: 'saitata',
      first_name: 'Sai',
      last_name: 'Tata',
      phone_number: '',
      date_of_birth: '1990-01-01',
      gender: 'male',
      email_verification_token: null,
      email_verification_expires: null,
      password_reset_token: null,
      password_reset_expires: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db('jwt_users').insert(jwtUserData);
    console.log(`✅ JWT user record created`);
    
    console.log(`🎉 User successfully recreated with password: ${newPassword}`);
    
  } catch (error) {
    console.error(`❌ Error processing user ${email}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting User Recreation Script');
    console.log('=====================================');
    
    // Recreate the user with new password
    await deleteAndRecreateUser('saitata7@gmail.com', 'NewPassword123!');
    
    console.log('=====================================');
    console.log('✅ User Recreation Script Completed');
    
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

module.exports = { deleteAndRecreateUser };
