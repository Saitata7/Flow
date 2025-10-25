// migrations/002_extend_user_profile.js
// Migration to extend user table with comprehensive profile information
// Adds demographic, health, and privacy fields to support enhanced profile system

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🚀 Starting user profile extension migration...');
  
  // Add new columns to users table
  console.log('📝 Adding extended profile columns to users table...');
  
  await knex.schema.alterTable('users', function(table) {
    // Basic profile information
    table.string('first_name', 50);
    table.string('last_name', 50);
    table.string('phone_number', 20);
    
    // Personal information
    table.date('date_of_birth');
    table.string('gender', 20);
    
    // Optional demographics
    table.string('race', 30);
    table.string('ethnicity', 50);
    table.string('disability', 30);
    table.string('preferred_language', 10).defaultTo('en');
    
    // Location & timezone
    table.string('country', 100);
    table.string('timezone', 50);
    
    // Health & wellness (for future features)
    table.json('health_goals').defaultTo('[]');
    table.string('fitness_level', 20);
    table.text('medical_conditions');
    
    // Privacy settings
    table.string('profile_visibility', 20).defaultTo('private');
    table.json('data_sharing').defaultTo('{"analytics": true, "research": false, "marketing": false}');
    
    // Timestamps
    table.timestamp('profile_updated_at');
  });
  
  console.log('✅ Extended profile columns added to users table');
  
  // Add indexes for better performance
  console.log('📝 Adding indexes for extended profile fields...');
  
  await knex.schema.alterTable('users', function(table) {
    table.index(['first_name', 'last_name']);
    table.index(['date_of_birth']);
    table.index(['gender']);
    table.index(['race']);
    table.index(['country']);
    table.index(['profile_visibility']);
    table.index(['profile_updated_at']);
  });
  
  console.log('✅ Indexes added for extended profile fields');
  
  // Update existing users with default values
  console.log('📝 Updating existing users with default profile values...');
  
  const existingUsers = await knex('users').select('id');
  console.log(`Found ${existingUsers.length} existing users to update`);
  
  for (const user of existingUsers) {
    await knex('users')
      .where('id', user.id)
      .update({
        profile_visibility: 'private',
        data_sharing: JSON.stringify({
          analytics: true,
          research: false,
          marketing: false
        }),
        profile_updated_at: new Date()
      });
  }
  
  console.log('✅ Existing users updated with default profile values');
  console.log('🎉 User profile extension migration completed successfully!');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🔄 Rolling back user profile extension migration...');
  
  await knex.schema.alterTable('users', function(table) {
    table.dropColumn('first_name');
    table.dropColumn('last_name');
    table.dropColumn('phone_number');
    table.dropColumn('date_of_birth');
    table.dropColumn('gender');
    table.dropColumn('race');
    table.dropColumn('ethnicity');
    table.dropColumn('disability');
    table.dropColumn('preferred_language');
    table.dropColumn('country');
    table.dropColumn('timezone');
    table.dropColumn('health_goals');
    table.dropColumn('fitness_level');
    table.dropColumn('medical_conditions');
    table.dropColumn('profile_visibility');
    table.dropColumn('data_sharing');
    table.dropColumn('profile_updated_at');
  });
  
  console.log('✅ User profile extension migration rollback completed');
};
