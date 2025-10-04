/**
 * Fix Users Table Creation and Data Migration
 * 
 * This migration fixes the issue where flows table exists with owner_id references
 * but users table doesn't exist yet. It creates the users table first and then
 * handles the foreign key constraints properly.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function(knex) {
  console.log('🔧 Fixing users table creation and data migration...');

  try {
    // 1. Check if users table exists
    const usersTableExists = await knex.schema.hasTable('users');
    
    if (!usersTableExists) {
      console.log('📝 Creating users table...');
      
      // Create users table
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

    // 2. Get existing flows with owner_id values
    const existingFlows = await knex('flows')
      .select('owner_id')
      .whereNotNull('owner_id')
      .groupBy('owner_id');

    console.log(`📊 Found ${existingFlows.length} unique owner_ids in flows table`);

    // 3. Create placeholder users for existing owner_ids
    const placeholderUsers = [];
    
    for (const flow of existingFlows) {
      const ownerId = flow.owner_id;
      
      // Check if user already exists
      const existingUser = await knex('users')
        .where('id', ownerId)
        .first();
      
      if (!existingUser) {
        // Create placeholder user
        placeholderUsers.push({
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
      }
    }

    // 4. Insert placeholder users
    if (placeholderUsers.length > 0) {
      await knex('users').insert(placeholderUsers);
      console.log(`✅ Created ${placeholderUsers.length} placeholder users`);
    }

    // 5. Now add foreign key constraint to flows table
    console.log('🔗 Adding foreign key constraint to flows table...');
    
    // Check if constraint already exists
    const constraintExists = await knex.raw(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'flows_owner_id_foreign' 
      AND table_name = 'flows'
    `);

    if (constraintExists.rows.length === 0) {
      await knex.schema.alterTable('flows', function(table) {
        table.foreign('owner_id').references('id').inTable('users').onDelete('CASCADE');
      });
      console.log('✅ Foreign key constraint added to flows table');
    } else {
      console.log('✅ Foreign key constraint already exists');
    }

    // 6. Create other missing tables if they don't exist
    const tablesToCreate = [
      'emotions',
      'notes', 
      'flow_entry_emotions',
      'notification_templates',
      'user_notifications',
      'sync_queue'
    ];

    for (const tableName of tablesToCreate) {
      const tableExists = await knex.schema.hasTable(tableName);
      
      if (!tableExists) {
        console.log(`📝 Creating ${tableName} table...`);
        
        switch (tableName) {
          case 'emotions':
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
            break;

          case 'notes':
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
            break;

          case 'flow_entry_emotions':
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
            break;

          case 'notification_templates':
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
            break;

          case 'user_notifications':
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
            break;

          case 'sync_queue':
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
            break;
        }
        
        console.log(`✅ ${tableName} table created`);
      } else {
        console.log(`✅ ${tableName} table already exists`);
      }
    }

    // 7. Add foreign key constraints to notes table
    const notesConstraintsExist = await knex.raw(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name LIKE '%notes%' 
      AND table_name = 'notes'
    `);

    if (notesConstraintsExist.rows.length === 0) {
      await knex.schema.alterTable('notes', function(table) {
        table.foreign('flow_entry_id').references('id').inTable('flow_entries').onDelete('CASCADE');
        table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('edited_by').references('id').inTable('users').onDelete('SET NULL');
      });
      console.log('✅ Foreign key constraints added to notes table');
    }

    // 8. Add foreign key constraints to emotions table
    const emotionsConstraintsExist = await knex.raw(`
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name LIKE '%emotions%' 
      AND table_name = 'emotions'
    `);

    if (emotionsConstraintsExist.rows.length === 0) {
      await knex.schema.alterTable('emotions', function(table) {
        table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
      });
      console.log('✅ Foreign key constraints added to emotions table');
    }

    console.log('✅ Users table creation and data migration completed successfully!');

  } catch (error) {
    console.error('❌ Failed to fix users table creation:', error);
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🔄 Rolling back users table fix...');

  try {
    // Drop foreign key constraints first
    await knex.schema.alterTable('flows', function(table) {
      table.dropForeign(['owner_id']);
    });

    await knex.schema.alterTable('notes', function(table) {
      table.dropForeign(['flow_entry_id']);
      table.dropForeign(['created_by']);
      table.dropForeign(['edited_by']);
    });

    await knex.schema.alterTable('emotions', function(table) {
      table.dropForeign(['created_by']);
    });

    // Drop tables in reverse order
    await knex.schema.dropTableIfExists('sync_queue');
    await knex.schema.dropTableIfExists('user_notifications');
    await knex.schema.dropTableIfExists('notification_templates');
    await knex.schema.dropTableIfExists('flow_entry_emotions');
    await knex.schema.dropTableIfExists('notes');
    await knex.schema.dropTableIfExists('emotions');
    await knex.schema.dropTableIfExists('users');

    console.log('✅ Users table fix rollback completed');

  } catch (error) {
    console.error('❌ Failed to rollback users table fix:', error);
    throw error;
  }
};
