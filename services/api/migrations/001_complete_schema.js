/**
 * Complete Database Schema - Fresh Installation
 * 
 * This migration creates the complete normalized database schema from scratch.
 * It's designed for fresh database installations and includes all tables,
 * relationships, constraints, and indexes.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function(knex) {
  console.log('🏗️ Creating complete database schema...');

  try {
    // 1. Create users table
    console.log('📝 Creating users table...');
    await knex.schema.createTable('users', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('firebase_uid', 128).unique().notNullable();
      table.string('email', 255).unique().notNullable();
      table.string('display_name', 100);
      table.string('photo_url', 500);
      table.boolean('email_verified').defaultTo(false);
      table.string('auth_provider', 50).defaultTo('firebase');
      table.json('auth_metadata');
      table.timestamp('last_login_at');
      table.timestamp('last_active_at');
      table.enum('status', ['active', 'suspended', 'deleted']).defaultTo('active');
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Indexes
      table.index(['firebase_uid', 'deleted_at']);
      table.index(['email', 'deleted_at']);
      table.index(['status', 'deleted_at']);
      table.index(['last_active_at']);
    });

    // 2. Create plans table
    console.log('📝 Creating plans table...');
    await knex.schema.createTable('plans', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title', 100).notNullable();
      table.string('category', 50);
      table.enum('plan_kind', ['Challenge', 'Template', 'CoachPlan']).notNullable();
      table.enum('type', ['Public', 'Private', 'Group']).notNullable();
      table.enum('visibility', ['private', 'friends', 'public']).defaultTo('private');
      table.json('participants');
      table.date('start_date');
      table.date('end_date');
      table.enum('status', ['draft', 'active', 'archived']).defaultTo('draft');
      table.json('rules');
      table.json('tags');
      table.uuid('owner_id').notNullable();
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');

      // Indexes
      table.index(['owner_id', 'deleted_at']);
      table.index(['visibility', 'status', 'deleted_at']);
      table.index(['plan_kind', 'deleted_at']);
      table.index(['type', 'status', 'deleted_at']);
      table.index(['start_date', 'end_date', 'deleted_at']);
    });

    // 3. Create flows table
    console.log('📝 Creating flows table...');
    await knex.schema.createTable('flows', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title', 100).notNullable();
      table.text('description');
      table.enum('tracking_type', ['Binary', 'Quantitative', 'Time-based']).notNullable();
      table.enum('frequency', ['Daily', 'Weekly', 'Monthly']).notNullable();
      table.boolean('every_day').defaultTo(false);
      table.json('days_of_week');
      table.timestamp('reminder_time');
      table.enum('reminder_level', ['1', '2', '3']);
      table.boolean('cheat_mode').defaultTo(false);
      table.uuid('plan_id');
      table.json('goal');
      table.enum('progress_mode', ['sum', 'average', 'latest']).defaultTo('sum');
      table.json('tags');
      table.boolean('archived').defaultTo(false);
      table.enum('visibility', ['private', 'friends', 'public']).defaultTo('private');
      table.uuid('owner_id').notNullable();
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('plan_id').references('id').inTable('plans').onDelete('SET NULL');

      // Unique constraint
      table.unique(['title', 'owner_id'], { 
        indexName: 'unique_flow_name_per_user',
        where: 'deleted_at IS NULL'
      });

      // Indexes
      table.index(['owner_id', 'archived', 'deleted_at']);
      table.index(['tracking_type', 'frequency', 'deleted_at']);
      table.index(['plan_id', 'deleted_at']);
    });

    // 4. Create flow_entries table
    console.log('📝 Creating flow_entries table...');
    await knex.schema.createTable('flow_entries', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('flow_id').notNullable();
      table.date('date').notNullable();
      table.enum('symbol', ['+', '-', '*', '/']).notNullable();
      table.integer('mood_score');
      table.json('quantitative');
      table.json('timebased');
      table.enum('device', ['mobile', 'web', 'api']).defaultTo('api');
      table.json('geo');
      table.integer('streak_count').defaultTo(0);
      table.boolean('edited').defaultTo(false);
      table.uuid('edited_by');
      table.timestamp('edited_at');
      table.timestamp('timestamp').defaultTo(knex.fn.now());
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('flow_id').references('id').inTable('flows').onDelete('CASCADE');
      table.foreign('edited_by').references('id').inTable('users').onDelete('SET NULL');

      // Unique constraint
      table.unique(['flow_id', 'date'], { 
        indexName: 'unique_flow_date',
        where: 'deleted_at IS NULL'
      });

      // Indexes
      table.index(['flow_id', 'date', 'deleted_at']);
      table.index(['flow_id', 'symbol', 'deleted_at']);
      table.index(['date', 'deleted_at']);
      table.index(['mood_score', 'deleted_at']);
      table.index(['device', 'deleted_at']);
      table.index(['edited', 'edited_at', 'deleted_at']);
    });

    // 5. Create emotions table
    console.log('📝 Creating emotions table...');
    await knex.schema.createTable('emotions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 50).notNullable();
      table.string('emoji', 10);
      table.string('category', 30);
      table.integer('intensity_score');
      table.boolean('is_active').defaultTo(true);
      table.integer('usage_count').defaultTo(0);
      table.uuid('created_by');
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');

      // Indexes
      table.index(['category', 'is_active']);
      table.index(['created_by', 'deleted_at']);
      table.unique(['name', 'created_by'], { 
        indexName: 'unique_emotion_per_user',
        where: 'deleted_at IS NULL'
      });
    });

    // 6. Create flow_entry_emotions junction table
    console.log('📝 Creating flow_entry_emotions table...');
    await knex.schema.createTable('flow_entry_emotions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('flow_entry_id').notNullable();
      table.uuid('emotion_id').notNullable();
      table.integer('intensity').defaultTo(3);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Foreign key constraints
      table.foreign('flow_entry_id').references('id').inTable('flow_entries').onDelete('CASCADE');
      table.foreign('emotion_id').references('id').inTable('emotions').onDelete('CASCADE');

      // Unique constraint
      table.unique(['flow_entry_id', 'emotion_id']);

      // Indexes
      table.index(['flow_entry_id']);
      table.index(['emotion_id']);
    });

    // 7. Create notes table
    console.log('📝 Creating notes table...');
    await knex.schema.createTable('notes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('flow_entry_id').notNullable();
      table.text('content').notNullable();
      table.enum('type', ['general', 'reflection', 'goal', 'obstacle', 'celebration']).defaultTo('general');
      table.boolean('is_private').defaultTo(true);
      table.json('tags');
      table.integer('word_count').defaultTo(0);
      table.uuid('created_by').notNullable();
      table.uuid('edited_by');
      table.timestamp('edited_at');
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('flow_entry_id').references('id').inTable('flow_entries').onDelete('CASCADE');
      table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('edited_by').references('id').inTable('users').onDelete('SET NULL');

      // Indexes
      table.index(['flow_entry_id', 'deleted_at']);
      table.index(['created_by', 'deleted_at']);
      table.index(['type', 'deleted_at']);
      table.index(['created_at', 'deleted_at']);
    });

    // 8. Create plan_participants table
    console.log('📝 Creating plan_participants table...');
    await knex.schema.createTable('plan_participants', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('plan_id').notNullable();
      table.uuid('user_id').notNullable();
      table.timestamp('joined_at').defaultTo(knex.fn.now());
      table.timestamp('left_at');
      table.enum('status', ['active', 'left', 'removed']).defaultTo('active');

      // Foreign key constraints
      table.foreign('plan_id').references('id').inTable('plans').onDelete('CASCADE');
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      // Unique constraint
      table.unique(['plan_id', 'user_id'], { 
        indexName: 'unique_plan_user',
        where: 'status = \'active\''
      });

      // Indexes
      table.index(['plan_id', 'status']);
      table.index(['user_id', 'status']);
      table.index(['plan_id', 'status', 'joined_at']);
      table.index(['user_id', 'status', 'joined_at']);
    });

    // 9. Create user_profiles table
    console.log('📝 Creating user_profiles table...');
    await knex.schema.createTable('user_profiles', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('username', 50).unique().notNullable();
      table.string('display_name', 100).notNullable();
      table.text('avatar_url');
      table.text('bio');
      table.json('stats');
      table.json('achievements');
      table.json('badges');
      table.json('links');
      table.json('profile_theme');
      table.json('visibility');
      table.uuid('user_id').unique().notNullable();
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      // Indexes
      table.index(['user_id', 'deleted_at']);
      table.index(['username', 'deleted_at']);
      table.index(['display_name', 'deleted_at']);
      table.index(['created_at', 'deleted_at']);
    });

    // 10. Create user_settings table
    console.log('📝 Creating user_settings table...');
    await knex.schema.createTable('user_settings', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable();
      table.json('settings').defaultTo('{}');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      // Unique constraint
      table.unique(['user_id'], { 
        indexName: 'unique_user_settings',
        where: 'deleted_at IS NULL'
      });

      // Indexes
      table.index(['user_id']);
      table.index(['deleted_at']);
    });

    // 11. Create sync_queue table
    console.log('📝 Creating sync_queue table...');
    await knex.schema.createTable('sync_queue', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable();
      table.string('entity_type', 50).notNullable();
      table.uuid('entity_id').notNullable();
      table.enum('operation', ['create', 'update', 'delete']).notNullable();
      table.json('entity_data');
      table.enum('status', ['pending', 'in_progress', 'completed', 'failed']).defaultTo('pending');
      table.integer('retry_count').defaultTo(0);
      table.timestamp('last_retry_at');
      table.text('error_message');
      table.timestamp('scheduled_at').defaultTo(knex.fn.now());
      table.timestamp('processed_at');
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

      // Indexes
      table.index(['user_id', 'status']);
      table.index(['entity_type', 'entity_id', 'status']);
      table.index(['scheduled_at', 'status']);
      table.index(['status', 'retry_count']);
    });

    // 12. Create notification_templates table
    console.log('📝 Creating notification_templates table...');
    await knex.schema.createTable('notification_templates', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 100).notNullable();
      table.string('category', 50).notNullable();
      table.string('title_template', 200).notNullable();
      table.text('body_template').notNullable();
      table.json('variables');
      table.boolean('is_active').defaultTo(true);
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Unique constraint
      table.unique(['name', 'category']);

      // Indexes
      table.index(['category', 'is_active']);
    });

    // 13. Create notification_schedules table
    console.log('📝 Creating notification_schedules table...');
    await knex.schema.createTable('notification_schedules', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable();
      table.uuid('flow_id');
      table.time('time_of_day').notNullable();
      table.enum('type', ['reminder', 'quiet', 'sound']).notNullable();
      table.boolean('enabled').defaultTo(true);
      table.string('timezone', 100).defaultTo('UTC');
      table.json('metadata').defaultTo('{}');
      table.integer('priority').defaultTo(1);
      table.string('title', 200);
      table.text('message');
      table.enum('frequency', ['daily', 'weekly', 'monthly']).defaultTo('daily');
      table.json('days_of_week');
      table.date('start_date');
      table.date('end_date');
      table.timestamp('last_triggered_at');
      table.integer('trigger_count').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('flow_id').references('id').inTable('flows').onDelete('CASCADE');

      // Unique constraint
      table.unique(['user_id', 'flow_id', 'time_of_day', 'type'], {
        indexName: 'unique_notification_schedule',
        where: 'deleted_at IS NULL AND enabled = true'
      });

      // Check constraints will be added later via raw SQL

      // Indexes
      table.index(['user_id', 'enabled', 'is_active', 'deleted_at']);
      table.index(['flow_id', 'enabled', 'is_active', 'deleted_at']);
      table.index(['time_of_day', 'type', 'enabled', 'is_active']);
      table.index(['frequency', 'enabled', 'is_active']);
      table.index(['start_date', 'end_date', 'enabled', 'is_active']);
      table.index(['last_triggered_at', 'trigger_count']);
    });

    // 14. Create user_notifications table
    console.log('📝 Creating user_notifications table...');
    await knex.schema.createTable('user_notifications', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable();
      table.uuid('template_id');
      table.string('title', 200).notNullable();
      table.text('body').notNullable();
      table.enum('type', ['reminder', 'achievement', 'report', 'social', 'system']).notNullable();
      table.enum('status', ['pending', 'sent', 'delivered', 'failed', 'read']).defaultTo('pending');
      table.json('data');
      table.timestamp('scheduled_at');
      table.timestamp('sent_at');
      table.timestamp('delivered_at');
      table.timestamp('read_at');
      table.integer('schema_version').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('template_id').references('id').inTable('notification_templates').onDelete('SET NULL');

      // Indexes
      table.index(['user_id', 'status', 'deleted_at']);
      table.index(['type', 'status', 'deleted_at']);
      table.index(['scheduled_at', 'status']);
      table.index(['read_at', 'deleted_at']);
    });

    // 15. Insert default data
    console.log('📊 Inserting default data...');

    // Default emotions
    const defaultEmotions = [
      { name: 'Happy', emoji: '😊', category: 'positive', intensity_score: 4, created_by: null },
      { name: 'Excited', emoji: '🤩', category: 'positive', intensity_score: 5, created_by: null },
      { name: 'Proud', emoji: '😌', category: 'positive', intensity_score: 4, created_by: null },
      { name: 'Grateful', emoji: '🙏', category: 'positive', intensity_score: 4, created_by: null },
      { name: 'Content', emoji: '😌', category: 'positive', intensity_score: 3, created_by: null },
      { name: 'Neutral', emoji: '😐', category: 'neutral', intensity_score: 3, created_by: null },
      { name: 'Tired', emoji: '😴', category: 'negative', intensity_score: 2, created_by: null },
      { name: 'Frustrated', emoji: '😤', category: 'negative', intensity_score: 2, created_by: null },
      { name: 'Stressed', emoji: '😰', category: 'negative', intensity_score: 2, created_by: null },
      { name: 'Disappointed', emoji: '😞', category: 'negative', intensity_score: 2, created_by: null },
      { name: 'Overwhelmed', emoji: '😵', category: 'negative', intensity_score: 1, created_by: null }
    ];

    await knex('emotions').insert(defaultEmotions);
    console.log(`✅ Inserted ${defaultEmotions.length} default emotions`);

    // Default notification templates
    const defaultTemplates = [
      {
        name: 'daily_reminder',
        category: 'reminder',
        title_template: 'Time for your {flow_title}!',
        body_template: 'Don\'t forget to track your {flow_title} today. You\'re on a {streak_count} day streak!',
        variables: JSON.stringify(['flow_title', 'streak_count']),
        is_active: true
      },
      {
        name: 'streak_achievement',
        category: 'achievement',
        title_template: '🎉 {streak_count} day streak!',
        body_template: 'Congratulations! You\'ve maintained your {flow_title} for {streak_count} days in a row.',
        variables: JSON.stringify(['flow_title', 'streak_count']),
        is_active: true
      },
      {
        name: 'weekly_report',
        category: 'report',
        title_template: 'Your weekly Flow report',
        body_template: 'You completed {completed_count} out of {total_count} flows this week. Great job!',
        variables: JSON.stringify(['completed_count', 'total_count']),
        is_active: true
      }
    ];

    await knex('notification_templates').insert(defaultTemplates);
    console.log(`✅ Inserted ${defaultTemplates.length} default notification templates`);

    // 16. Create database views
    console.log('👁️ Creating database views...');

    // Active notification schedules view
    await knex.raw(`
      CREATE OR REPLACE VIEW active_notification_schedules AS
      SELECT 
        ns.*,
        u.display_name as user_name,
        u.email as user_email,
        f.title as flow_title,
        f.tracking_type as flow_tracking_type,
        CASE 
          WHEN ns.flow_id IS NULL THEN 'global'
          ELSE 'flow_specific'
        END as schedule_scope,
        CASE 
          WHEN ns.end_date IS NULL THEN true
          ELSE ns.end_date >= CURRENT_DATE
        END as is_within_date_range
      FROM notification_schedules ns
      LEFT JOIN users u ON ns.user_id = u.id
      LEFT JOIN flows f ON ns.flow_id = f.id
      WHERE ns.deleted_at IS NULL 
        AND ns.enabled = true 
        AND ns.is_active = true
        AND (ns.start_date IS NULL OR ns.start_date <= CURRENT_DATE)
        AND (ns.end_date IS NULL OR ns.end_date >= CURRENT_DATE);
    `);

    // User flow statistics view
    await knex.raw(`
      CREATE OR REPLACE VIEW user_flow_stats AS
      SELECT 
        u.id as user_id,
        u.display_name,
        COUNT(DISTINCT f.id) as total_flows,
        COUNT(DISTINCT fe.id) as total_entries,
        COUNT(DISTINCT CASE WHEN fe.symbol = '+' THEN fe.id END) as completed_entries,
        COUNT(DISTINCT CASE WHEN fe.symbol = '-' THEN fe.id END) as missed_entries,
        MAX(fe.streak_count) as longest_streak,
        AVG(fe.mood_score) as avg_mood_score,
        COUNT(DISTINCT n.id) as total_notes
      FROM users u
      LEFT JOIN flows f ON u.id = f.owner_id AND f.deleted_at IS NULL
      LEFT JOIN flow_entries fe ON f.id = fe.flow_id AND fe.deleted_at IS NULL
      LEFT JOIN notes n ON fe.id = n.flow_entry_id AND n.deleted_at IS NULL
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.display_name;
    `);

    // Flow performance metrics view
    await knex.raw(`
      CREATE OR REPLACE VIEW flow_performance_metrics AS
      SELECT 
        f.id as flow_id,
        f.title,
        f.owner_id,
        COUNT(fe.id) as total_entries,
        COUNT(CASE WHEN fe.symbol = '+' THEN 1 END) as completed_count,
        COUNT(CASE WHEN fe.symbol = '-' THEN 1 END) as missed_count,
        ROUND(
          COUNT(CASE WHEN fe.symbol = '+' THEN 1 END)::numeric / 
          NULLIF(COUNT(fe.id), 0) * 100, 2
        ) as completion_rate,
        MAX(fe.streak_count) as current_streak,
        AVG(fe.mood_score) as avg_mood_score,
        COUNT(DISTINCT n.id) as total_notes
      FROM flows f
      LEFT JOIN flow_entries fe ON f.id = fe.flow_id AND fe.deleted_at IS NULL
      LEFT JOIN notes n ON fe.id = n.flow_entry_id AND n.deleted_at IS NULL
      WHERE f.deleted_at IS NULL
      GROUP BY f.id, f.title, f.owner_id;
    `);

    console.log('✅ Created database views');

    // 17. Create database functions
    console.log('⚙️ Creating database functions...');

    // Function to update updated_at timestamp
    await knex.raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Function to calculate flow streak
    await knex.raw(`
      CREATE OR REPLACE FUNCTION calculate_flow_streak(flow_uuid UUID)
      RETURNS INTEGER AS $$
      DECLARE
        current_streak INTEGER := 0;
        entry_date DATE;
        entry_symbol VARCHAR(10);
        current_date DATE := CURRENT_DATE;
      BEGIN
        SELECT date, symbol INTO entry_date, entry_symbol
        FROM flow_entries 
        WHERE flow_id = flow_uuid 
          AND deleted_at IS NULL 
          AND date <= current_date
        ORDER BY date DESC 
        LIMIT 1;
        
        IF entry_date IS NULL OR entry_symbol != '+' THEN
          RETURN 0;
        END IF;
        
        current_streak := 1;
        
        FOR entry_date IN 
          SELECT date FROM flow_entries 
          WHERE flow_id = flow_uuid 
            AND deleted_at IS NULL 
            AND date < entry_date
            AND symbol = '+'
          ORDER BY date DESC
        LOOP
          IF entry_date = current_date - INTERVAL '1 day' * current_streak THEN
            current_streak := current_streak + 1;
          ELSE
            EXIT;
          END IF;
        END LOOP;
        
        RETURN current_streak;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Created database functions');

    // 18. Create triggers for automatic timestamp updates
    console.log('⏰ Creating timestamp update triggers...');

    const tablesWithUpdatedAt = [
      'users', 'flows', 'flow_entries', 'emotions', 'notes', 'plans', 
      'user_profiles', 'user_settings', 'notification_templates', 
      'user_notifications', 'notification_schedules', 'sync_queue'
    ];

    for (const tableName of tablesWithUpdatedAt) {
      await knex.raw(`
        CREATE TRIGGER update_${tableName}_updated_at 
        BEFORE UPDATE ON ${tableName} 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    console.log('✅ Created timestamp update triggers');

    console.log('🎉 Complete database schema created successfully!');
    console.log('📋 Summary:');
    console.log('   - 14 tables created with proper relationships');
    console.log('   - Foreign key constraints and unique constraints');
    console.log('   - Performance indexes for all tables');
    console.log('   - 3 database views for common queries');
    console.log('   - Database functions for streak calculation');
    console.log('   - Automatic timestamp update triggers');
    console.log('   - Default emotions and notification templates');

  } catch (error) {
    console.error('❌ Failed to create complete database schema:', error);
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🔄 Rolling back complete database schema...');

  try {
    // Drop views
    await knex.raw(`DROP VIEW IF EXISTS flow_performance_metrics;`);
    await knex.raw(`DROP VIEW IF EXISTS user_flow_stats;`);
    await knex.raw(`DROP VIEW IF EXISTS active_notification_schedules;`);

    // Drop functions
    await knex.raw(`DROP FUNCTION IF EXISTS calculate_flow_streak(UUID);`);
    await knex.raw(`DROP FUNCTION IF EXISTS update_updated_at_column();`);

    // Drop triggers
    const tablesWithUpdatedAt = [
      'users', 'flows', 'flow_entries', 'emotions', 'notes', 'plans', 
      'user_profiles', 'user_settings', 'notification_templates', 
      'user_notifications', 'notification_schedules', 'sync_queue'
    ];

    for (const tableName of tablesWithUpdatedAt) {
      await knex.raw(`DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};`);
    }

    // Drop tables in reverse order to handle foreign key constraints
    await knex.schema.dropTableIfExists('user_notifications');
    await knex.schema.dropTableIfExists('notification_schedules');
    await knex.schema.dropTableIfExists('notification_templates');
    await knex.schema.dropTableIfExists('sync_queue');
    await knex.schema.dropTableIfExists('user_settings');
    await knex.schema.dropTableIfExists('user_profiles');
    await knex.schema.dropTableIfExists('plan_participants');
    await knex.schema.dropTableIfExists('notes');
    await knex.schema.dropTableIfExists('flow_entry_emotions');
    await knex.schema.dropTableIfExists('emotions');
    await knex.schema.dropTableIfExists('flow_entries');
    await knex.schema.dropTableIfExists('plans');
    await knex.schema.dropTableIfExists('flows');
    await knex.schema.dropTableIfExists('users');

    console.log('✅ Complete database schema rollback completed');

  } catch (error) {
    console.error('❌ Failed to rollback complete database schema:', error);
    throw error;
  }
};
