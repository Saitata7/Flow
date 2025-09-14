/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_profiles', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username', 50).unique().notNullable();
    table.string('display_name', 100).notNullable();
    table.text('avatar_url');
    table.text('bio');
    table.json('stats'); // { totalFlows, totalEntries, currentStreak, longestStreak, joinDate }
    table.json('achievements'); // Array of achievement IDs
    table.json('badges'); // Array of badge IDs
    table.json('links'); // Array of { platform, url }
    table.json('profile_theme'); // { color, banner }
    table.json('visibility'); // { bio, stats, plans }
    table.uuid('user_id').unique().notNullable(); // References auth user ID
    table.integer('schema_version').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index(['user_id', 'deleted_at']);
    table.index(['username', 'deleted_at']);
    table.index(['display_name', 'deleted_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_profiles');
};
