/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_settings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.json('ui_preferences'); // { theme, accentColor, textSize, highContrast }
    table.json('habit_defaults'); // { type, goalFrequency, repeatTimesPerWeek }
    table.json('reminders'); // { dailyReminders, quietHours, timezone }
    table.json('privacy'); // { profileVisibility, allowFriendRequests, showInLeaderboards }
    table.json('integrations'); // { wearables, externalApps }
    table.enum('backup_frequency', ['daily', 'weekly', 'monthly']).defaultTo('weekly');
    table.integer('data_retention').defaultTo(365); // days
    table.enum('export_format', ['json', 'csv']).defaultTo('json');
    table.boolean('cheat_mode').defaultTo(false);
    table.uuid('user_id').unique().notNullable(); // References auth user ID
    table.integer('schema_version').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index(['user_id', 'deleted_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_settings');
};
