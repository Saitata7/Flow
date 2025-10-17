// migrations/002_extend_user_profile.js
// Migration to extend user table with comprehensive profile information
// Adds demographic, health, and privacy fields to support enhanced profile system

const knex = require('knex');

async function extendUserProfile() {
  try {
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
    
  } catch (error) {
    console.error('❌ Error during user profile extension migration:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  extendUserProfile()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = extendUserProfile;
