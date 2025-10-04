/**
 * Safe Schema Refactor - Handles Existing Objects
 * 
 * This migration safely refactors the database schema by checking for existing
 * objects before creating them, avoiding conflicts with existing indexes and constraints.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function(knex) {
  console.log('🔧 Starting safe schema refactor...');

  try {
    // 1. Create users table if it doesn't exist
    const usersTableExists = await knex.schema.hasTable('users');
    
    if (!usersTableExists) {
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

      console.log('✅ Users table created');
    } else {
      console.log('✅ Users table already exists');
    }

    // 2. Create placeholder users for existing flows
    const existingFlows = await knex('flows')
      .select('owner_id')
      .whereNotNull('owner_id')
      .groupBy('owner_id');

    console.log(`📊 Found ${existingFlows.length} unique owner_ids in flows table`);

    for (const flow of existingFlows) {
      const ownerId = flow.owner_id;
      
      // Check if user already exists
      const existingUser = await knex('users')
        .where('id', ownerId)
        .first();
      
      if (!existingUser) {
        // Create placeholder user
        await knex('users').insert({
          id: ownerId,
          firebase_uid: `placeholder_${ownerId}`,
          email: `user_${ownerId}@placeholder.com`,
          display_name: `User ${ownerId.substring(0, 8)}`,
          email_verified: false,
          auth_provider: 'placeholder',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`✅ Created placeholder user for ${ownerId}`);
      }
    }

    // 3. Add foreign key constraint to flows table if it doesn't exist
    const flowsConstraintExists = await knex.raw(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'flows_owner_id_foreign' 
      AND table_name = 'flows'
    `);

    if (flowsConstraintExists.rows.length === 0) {
      await knex.schema.alterTable('flows', function(table) {
        table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
      });
      console.log('✅ Foreign key constraint added to flows table');
    } else {
      console.log('✅ Foreign key constraint already exists on flows table');
    }

    // 4. Create emotions table if it doesn't exist
    const emotionsTableExists = await knex.schema.hasTable('emotions');
    
    if (!emotionsTableExists) {
      console.log('📝 Creating emotions table...');
      
      await knex.schema.createTable('emotions', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('name', 50).notNullable();
        table.string('emoji', 10);
        table.string('category', 30);
        table.integer('intensity_score').checkBetween([1, 5]);
        table.boolean('is_active').defaultTo(true);
        table.integer('usage_count').defaultTo(0);
        table.uuid('created_by');
        table.integer('schema_version').defaultTo(1);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');

        table.index(['category', 'is_active']);
        table.index(['created_by', 'deleted_at']);
        table.unique(['name', 'created_by'], { 
          indexName: 'unique_emotion_per_user',
          where: 'deleted_at IS NULL'
        });
      });

      console.log('✅ Emotions table created');
    } else {
      console.log('✅ Emotions table already exists');
    }

    // 5. Create notes table if it doesn't exist
    const notesTableExists = await knex.schema.hasTable('notes');
    
    if (!notesTableExists) {
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

        table.index(['flow_entry_id', 'deleted_at']);
        table.index(['created_by', 'deleted_at']);
        table.index(['type', 'deleted_at']);
        table.index(['created_at', 'deleted_at']);
      });

      console.log('✅ Notes table created');
    } else {
      console.log('✅ Notes table already exists');
    }

    // 6. Create flow_entry_emotions table if it doesn't exist
    const flowEntryEmotionsTableExists = await knex.schema.hasTable('flow_entry_emotions');
    
    if (!flowEntryEmotionsTableExists) {
      console.log('📝 Creating flow_entry_emotions table...');
      
      await knex.schema.createTable('flow_entry_emotions', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('flow_entry_id').notNullable();
        table.uuid('emotion_id').notNullable();
        table.integer('intensity').checkBetween([1, 5]).defaultTo(3);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        
        table.foreign('flow_entry_id').references('id').inTable('flow_entries').onDelete('CASCADE');
        table.foreign('emotion_id').references('id').inTable('emotions').onDelete('CASCADE');
        
        table.unique(['flow_entry_id', 'emotion_id']);
        table.index(['flow_entry_id']);
        table.index(['emotion_id']);
      });

      console.log('✅ Flow entry emotions table created');
    } else {
      console.log('✅ Flow entry emotions table already exists');
    }

    // 7. Create sync_queue table if it doesn't exist
    const syncQueueTableExists = await knex.schema.hasTable('sync_queue');
    
    if (!syncQueueTableExists) {
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

        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

        table.index(['user_id', 'status']);
        table.index(['entity_type', 'entity_id', 'status']);
        table.index(['scheduled_at', 'status']);
        table.index(['status', 'retry_count']);
      });

      console.log('✅ Sync queue table created');
    } else {
      console.log('✅ Sync queue table already exists');
    }

    // 8. Create notification_templates table if it doesn't exist
    const notificationTemplatesTableExists = await knex.schema.hasTable('notification_templates');
    
    if (!notificationTemplatesTableExists) {
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

        table.index(['category', 'is_active']);
        table.unique(['name', 'category']);
      });

      console.log('✅ Notification templates table created');
    } else {
      console.log('✅ Notification templates table already exists');
    }

    // 9. Create user_notifications table if it doesn't exist
    const userNotificationsTableExists = await knex.schema.hasTable('user_notifications');
    
    if (!userNotificationsTableExists) {
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

        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('template_id').references('id').inTable('notification_templates').onDelete('SET NULL');

        table.index(['user_id', 'status', 'deleted_at']);
        table.index(['type', 'status', 'deleted_at']);
        table.index(['scheduled_at', 'status']);
        table.index(['read_at', 'deleted_at']);
      });

      console.log('✅ User notifications table created');
    } else {
      console.log('✅ User notifications table already exists');
    }

    // 10. Create notification_schedules table if it doesn't exist
    const notificationSchedulesTableExists = await knex.schema.hasTable('notification_schedules');
    
    if (!notificationSchedulesTableExists) {
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

        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('flow_id').references('id').inTable('flows').onDelete('CASCADE');

        table.index(['user_id', 'enabled', 'is_active', 'deleted_at']);
        table.index(['flow_id', 'enabled', 'is_active', 'deleted_at']);
        table.index(['time_of_day', 'type', 'enabled', 'is_active']);
        table.index(['frequency', 'days_of_week', 'enabled', 'is_active']);
        table.index(['start_date', 'end_date', 'enabled', 'is_active']);
        table.index(['last_triggered_at', 'trigger_count']);

        table.unique(['user_id', 'flow_id', 'time_of_day', 'type'], {
          indexName: 'unique_notification_schedule',
          where: 'deleted_at IS NULL AND enabled = true'
        });

        table.check('priority >= 1 AND priority <= 3', ['notification_priority_range']);
        table.check('end_date IS NULL OR end_date >= start_date', ['notification_date_range']);
        table.check('trigger_count >= 0', ['notification_trigger_count_positive']);
      });

      console.log('✅ Notification schedules table created');
    } else {
      console.log('✅ Notification schedules table already exists');
    }

    // 11. Add missing foreign key constraints safely
    console.log('🔗 Adding missing foreign key constraints...');

    // Add constraints to notes table
    const notesConstraintsExist = await knex.raw(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name LIKE '%notes%' 
      AND table_name = 'notes'
    `);

    if (notesConstraintsExist.rows.length === 0) {
      try {
        await knex.schema.alterTable('notes', function(table) {
          table.foreign('flow_entry_id').references('id').inTable('flow_entries').onDelete('CASCADE');
          table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
          table.foreign('edited_by').references('id').inTable('users').onDelete('SET NULL');
        });
        console.log('✅ Foreign key constraints added to notes table');
      } catch (error) {
        console.log('⚠️ Some foreign key constraints already exist on notes table');
      }
    }

    // Add constraints to emotions table
    const emotionsConstraintsExist = await knex.raw(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name LIKE '%emotions%' 
      AND table_name = 'emotions'
    `);

    if (emotionsConstraintsExist.rows.length === 0) {
      try {
        await knex.schema.alterTable('emotions', function(table) {
          table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
        });
        console.log('✅ Foreign key constraints added to emotions table');
      } catch (error) {
        console.log('⚠️ Some foreign key constraints already exist on emotions table');
      }
    }

    // 12. Add unique constraint to flows table if it doesn't exist
    const flowsUniqueConstraintExists = await knex.raw(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'unique_flow_name_per_user' 
      AND table_name = 'flows'
    `);

    if (flowsUniqueConstraintExists.rows.length === 0) {
      try {
        await knex.schema.alterTable('flows', function(table) {
          table.unique(['title', 'owner_id'], { 
            indexName: 'unique_flow_name_per_user',
            where: 'deleted_at IS NULL'
          });
        });
        console.log('✅ Unique constraint added to flows table');
      } catch (error) {
        console.log('⚠️ Unique constraint already exists on flows table');
      }
    }

    // 13. Remove emotion and note columns from flow_entries if they exist
    const flowEntriesColumns = await knex.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'flow_entries' 
      AND column_name IN ('emotion', 'note')
    `);

    if (flowEntriesColumns.rows.length > 0) {
      console.log('🧹 Removing emotion and note columns from flow_entries...');
      
      for (const column of flowEntriesColumns.rows) {
        try {
          await knex.schema.alterTable('flow_entries', function(table) {
            table.dropColumn(column.column_name);
          });
          console.log(`✅ Removed ${column.column_name} column from flow_entries`);
        } catch (error) {
          console.log(`⚠️ Could not remove ${column.column_name} column: ${error.message}`);
        }
      }
    }

    console.log('✅ Safe schema refactor completed successfully!');

  } catch (error) {
    console.error('❌ Safe schema refactor failed:', error);
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🔄 Rolling back safe schema refactor...');

  try {
    // Drop tables in reverse order
    await knex.schema.dropTableIfExists('notification_schedules');
    await knex.schema.dropTableIfExists('user_notifications');
    await knex.schema.dropTableIfExists('notification_templates');
    await knex.schema.dropTableIfExists('sync_queue');
    await knex.schema.dropTableIfExists('flow_entry_emotions');
    await knex.schema.dropTableIfExists('notes');
    await knex.schema.dropTableIfExists('emotions');
    
    // Don't drop users table as it might contain important data
    console.log('⚠️ Keeping users table for data preservation');

    console.log('✅ Safe schema refactor rollback completed');

  } catch (error) {
    console.error('❌ Failed to rollback safe schema refactor:', error);
    throw error;
  }
};
