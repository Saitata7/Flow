#!/usr/bin/env node

/**
 * 🗄️ GCP Database Migration Runner
 * Connects to GCP Cloud SQL and runs database migrations
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  host: '34.63.78.153',
  port: 5432,
  database: 'flow',
  user: 'flow_user',
  password: 'FlowPassword123!',
  ssl: { rejectUnauthorized: false }
};

console.log('🗄️ Connecting to GCP Cloud SQL database...');
console.log(`Host: ${config.host}:${config.port}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);

const pool = new Pool(config);

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('Current time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    console.log('📝 Creating tables and schema...');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        display_name VARCHAR(255),
        photo_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        last_active_at TIMESTAMP DEFAULT NOW(),
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        plan_kind VARCHAR(20) NOT NULL CHECK (plan_kind IN ('Challenge', 'Template', 'CoachPlan')),
        type VARCHAR(20) NOT NULL CHECK (type IN ('Public', 'Private', 'Group')),
        visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
        rules JSONB,
        tags JSONB,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create flows table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(100) NOT NULL,
        description TEXT,
        tracking_type VARCHAR(20) NOT NULL CHECK (tracking_type IN ('Binary', 'Quantitative', 'Time-based')),
        frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly')),
        every_day BOOLEAN DEFAULT FALSE,
        days_of_week JSONB,
        reminder_time TIMESTAMP,
        reminder_level VARCHAR(1) CHECK (reminder_level IN ('1', '2', '3')),
        cheat_mode BOOLEAN DEFAULT FALSE,
        plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
        goal JSONB,
        progress_mode VARCHAR(20) DEFAULT 'sum' CHECK (progress_mode IN ('sum', 'average', 'latest')),
        tags JSONB,
        archived BOOLEAN DEFAULT FALSE,
        visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create flow_entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flow_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        symbol VARCHAR(1) NOT NULL CHECK (symbol IN ('+', '-', '*', '/')),
        mood_score INTEGER,
        quantitative JSONB,
        timebased JSONB,
        device VARCHAR(20) DEFAULT 'api' CHECK (device IN ('mobile', 'web', 'api')),
        geo JSONB,
        streak_count INTEGER DEFAULT 0,
        edited BOOLEAN DEFAULT FALSE,
        edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        edited_at TIMESTAMP,
        timestamp TIMESTAMP DEFAULT NOW(),
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create emotions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emotions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        emoji VARCHAR(10),
        category VARCHAR(30),
        intensity_score INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        usage_count INTEGER DEFAULT 0,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create flow_entry_emotions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flow_entry_emotions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flow_entry_id UUID NOT NULL REFERENCES flow_entries(id) ON DELETE CASCADE,
        emotion_id UUID NOT NULL REFERENCES emotions(id) ON DELETE CASCADE,
        intensity INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flow_entry_id UUID NOT NULL REFERENCES flow_entries(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'reflection' CHECK (type IN ('reflection', 'observation', 'goal', 'private')),
        privacy VARCHAR(20) DEFAULT 'private' CHECK (privacy IN ('private', 'friends', 'public')),
        word_count INTEGER DEFAULT 0,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        edited_at TIMESTAMP,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create plan_participants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plan_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        left_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create user_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        stats JSONB,
        achievements JSONB,
        badges JSONB,
        links JSONB,
        profile_theme JSONB,
        visibility JSONB,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create user_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        settings JSONB DEFAULT '{}',
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create sync_queue table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
        payload JSONB,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        scheduled_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create notification_templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        default_data JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create notification_schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
        time_of_day TIME NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('reminder', 'quiet', 'sound')),
        enabled BOOLEAN DEFAULT TRUE,
        timezone VARCHAR(100) DEFAULT 'UTC',
        metadata JSONB DEFAULT '{}',
        priority INTEGER DEFAULT 1,
        title VARCHAR(200),
        message TEXT,
        frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
        days_of_week JSONB,
        start_date DATE,
        end_date DATE,
        last_triggered_at TIMESTAMP,
        trigger_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    // Create user_notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('reminder', 'achievement', 'report', 'social', 'system')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
        data JSONB,
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        schema_version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `);
    
    console.log('✅ All tables created successfully');
    
    // Insert default emotions
    console.log('📊 Inserting default emotions...');
    const emotions = [
      { name: 'Happy', emoji: '😊', category: 'Positive', intensity_score: 5 },
      { name: 'Sad', emoji: '😔', category: 'Negative', intensity_score: 1 },
      { name: 'Angry', emoji: '😠', category: 'Negative', intensity_score: 4 },
      { name: 'Excited', emoji: '🤩', category: 'Positive', intensity_score: 5 },
      { name: 'Calm', emoji: '😌', category: 'Neutral', intensity_score: 3 },
      { name: 'Stressed', emoji: '😩', category: 'Negative', intensity_score: 4 },
      { name: 'Motivated', emoji: '💪', category: 'Positive', intensity_score: 5 },
      { name: 'Tired', emoji: '😴', category: 'Neutral', intensity_score: 2 },
      { name: 'Grateful', emoji: '🙏', category: 'Positive', intensity_score: 5 },
      { name: 'Anxious', emoji: '😟', category: 'Negative', intensity_score: 3 },
      { name: 'Neutral', emoji: '😐', category: 'Neutral', intensity_score: 3 }
    ];
    
    for (const emotion of emotions) {
      await pool.query(`
        INSERT INTO emotions (name, emoji, category, intensity_score, is_active, created_by)
        VALUES ($1, $2, $3, $4, TRUE, NULL)
        ON CONFLICT (name) DO NOTHING
      `, [emotion.name, emotion.emoji, emotion.category, emotion.intensity_score]);
    }
    
    // Insert default notification templates
    console.log('📊 Inserting default notification templates...');
    const templates = [
      { name: 'Daily Reminder', category: 'reminder', title: 'Time to track your flow!', body: 'Don\'t forget to log your progress for {{flowName}} today.' },
      { name: 'Weekly Report', category: 'report', title: 'Your Weekly Flow Summary', body: 'Here\'s how you did this week: {{summary}}' },
      { name: 'Achievement Unlocked', category: 'achievement', title: 'Achievement Unlocked!', body: 'Congratulations! You achieved {{achievementName}}.' }
    ];
    
    for (const template of templates) {
      await pool.query(`
        INSERT INTO notification_templates (name, category, title, body, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (name) DO NOTHING
      `, [template.name, template.category, template.title, template.body]);
    }
    
    console.log('✅ Default data inserted successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function verifyTables() {
  try {
    console.log('🔍 Verifying tables were created...');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('✅ Tables created:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log(`Total tables: ${result.rows.length}`);
    
    // Check default data
    const emotionsCount = await pool.query('SELECT COUNT(*) as count FROM emotions');
    const templatesCount = await pool.query('SELECT COUNT(*) as count FROM notification_templates');
    
    console.log('✅ Default data:');
    console.log(`  - Emotions: ${emotionsCount.rows[0].count}`);
    console.log(`  - Notification templates: ${templatesCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const connected = await testConnection();
    if (!connected) {
      process.exit(1);
    }
    
    await runMigrations();
    await verifyTables();
    
    console.log('🎉 GCP database migration completed successfully!');
    console.log('📊 Database: flow on flow-prod');
    console.log('🔗 Host: 34.63.78.153:5432');
    console.log('👤 User: flow_user');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
