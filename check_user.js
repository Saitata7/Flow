#!/usr/bin/env node

// Simple script to check user data in the database
const { Pool } = require('pg');

const pool = new Pool({
  host: '10.58.145.227',
  port: 5432,
  database: 'flow_db',
  user: 'flow_user',
  password: 'FlowSecure2024!',
  ssl: false
});

async function checkUser(email) {
  try {
    console.log(`🔍 Checking user: ${email}`);
    
    // Check if user exists
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Display Name: ${user.display_name}`);
    console.log(`   Created: ${user.created_at}`);
    
    // Check flows for this user
    const flowsQuery = 'SELECT * FROM flows WHERE user_id = $1 ORDER BY created_at DESC';
    const flowsResult = await pool.query(flowsQuery, [user.id]);
    
    console.log(`\n📊 Flows found: ${flowsResult.rows.length}`);
    
    if (flowsResult.rows.length > 0) {
      flowsResult.rows.forEach((flow, index) => {
        console.log(`\n   Flow ${index + 1}:`);
        console.log(`     ID: ${flow.id}`);
        console.log(`     Title: ${flow.title}`);
        console.log(`     Description: ${flow.description}`);
        console.log(`     Created: ${flow.created_at}`);
        console.log(`     Status: ${flow.status ? 'Has status data' : 'No status data'}`);
      });
    } else {
      console.log('   No flows found for this user');
    }
    
    // Check flow entries
    const entriesQuery = 'SELECT COUNT(*) as count FROM flow_entries WHERE user_id = $1';
    const entriesResult = await pool.query(entriesQuery, [user.id]);
    console.log(`\n📝 Flow entries: ${entriesResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the check
const email = process.argv[2] || 'saitata7@gmail.com';
checkUser(email);
