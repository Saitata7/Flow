#!/usr/bin/env node

/**
 * Migration script to update user IDs in data.json
 * This fixes the issue where flows were created with random user IDs
 * and need to be migrated to consistent user IDs based on email hash
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Email to user ID mapping
const emailToUserIdMap = {
  'saitata7@gmail.com': 'user-a4bbe3ceefc1814743c7d27447c91289',
  'temp@email.com': 'user-temp-user-id' // Keep temp user for testing
};

// Old user IDs that need to be migrated
const oldUserIds = [
  'user-1760681887434-g4gtt92gn',
  'user-1760685256275-abc123def',
  'user-1760694371051-dkxgb0tov'
];

function migrateUserData() {
  const dataPath = path.join(__dirname, 'data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('❌ data.json not found');
    return;
  }

  console.log('🔄 Starting user data migration...');
  
  // Read the data file
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  let migratedCount = 0;
  
  // Migrate flows
  if (data.flows) {
    data.flows.forEach(flow => {
      if (oldUserIds.includes(flow.ownerId)) {
        console.log(`📝 Migrating flow "${flow.title}" from ${flow.ownerId} to ${emailToUserIdMap['saitata7@gmail.com']}`);
        flow.ownerId = emailToUserIdMap['saitata7@gmail.com'];
        migratedCount++;
      }
    });
  }
  
  // Migrate flow entries
  if (data.flowEntries) {
    data.flowEntries.forEach(entry => {
      if (oldUserIds.includes(entry.ownerId)) {
        console.log(`📝 Migrating flow entry ${entry.id} from ${entry.ownerId} to ${emailToUserIdMap['saitata7@gmail.com']}`);
        entry.ownerId = emailToUserIdMap['saitata7@gmail.com'];
        if (entry.editedBy && oldUserIds.includes(entry.editedBy)) {
          entry.editedBy = emailToUserIdMap['saitata7@gmail.com'];
        }
        migratedCount++;
      }
    });
  }
  
  // Migrate settings
  if (data.settings) {
    Object.keys(data.settings).forEach(userId => {
      if (oldUserIds.includes(userId)) {
        console.log(`📝 Migrating settings from ${userId} to ${emailToUserIdMap['saitata7@gmail.com']}`);
        data.settings[emailToUserIdMap['saitata7@gmail.com']] = data.settings[userId];
        delete data.settings[userId];
        migratedCount++;
      }
    });
  }
  
  // Migrate profiles
  if (data.profiles) {
    Object.keys(data.profiles).forEach(userId => {
      if (oldUserIds.includes(userId)) {
        console.log(`📝 Migrating profile from ${userId} to ${emailToUserIdMap['saitata7@gmail.com']}`);
        data.profiles[emailToUserIdMap['saitata7@gmail.com']] = data.profiles[userId];
        delete data.profiles[userId];
        migratedCount++;
      }
    });
  }
  
  // Write the migrated data back
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  console.log(`✅ Migration completed! Migrated ${migratedCount} records.`);
  console.log(`📊 Summary:`);
  console.log(`   - Flows: ${data.flows ? data.flows.length : 0}`);
  console.log(`   - Flow Entries: ${data.flowEntries ? data.flowEntries.length : 0}`);
  console.log(`   - Settings: ${Object.keys(data.settings || {}).length}`);
  console.log(`   - Profiles: ${Object.keys(data.profiles || {}).length}`);
}

// Run the migration
migrateUserData();
