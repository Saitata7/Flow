/**
 * Migration: Create Redis fallback cache tables
 * Creates tables to support database fallback when Redis is unavailable
 */

exports.up = async function(knex) {
  // Create cache store table for basic key-value operations
  await knex.schema.createTable('cache_store', table => {
    table.string('key').primary();
    table.text('value').notNullable();
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Index for expiration cleanup
    table.index('expires_at');
  });

  // Create cache sorted set table for leaderboard operations
  await knex.schema.createTable('cache_sorted_set', table => {
    table.string('key').notNullable();
    table.string('member').notNullable();
    table.decimal('score', 15, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Composite primary key
    table.primary(['key', 'member']);
    
    // Index for sorted queries
    table.index(['key', 'score']);
  });

  // Create cache hash table for hash operations
  await knex.schema.createTable('cache_hash', table => {
    table.string('key').notNullable();
    table.string('field').notNullable();
    table.text('value').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Composite primary key
    table.primary(['key', 'field']);
    
    // Index for key lookups
    table.index('key');
  });

  // Create cache list table for list operations
  await knex.schema.createTable('cache_list', table => {
    table.increments('id').primary();
    table.string('key').notNullable();
    table.text('value').notNullable();
    table.integer('position').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Index for key and position queries
    table.index(['key', 'position']);
  });

  // Create function to clean up expired cache entries
  await knex.raw(`
    CREATE OR REPLACE FUNCTION cleanup_expired_cache()
    RETURNS void AS $$
    BEGIN
      DELETE FROM cache_store WHERE expires_at IS NOT NULL AND expires_at < NOW();
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger to update updated_at timestamp
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_cache_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Add triggers for updated_at
  await knex.raw(`
    CREATE TRIGGER update_cache_store_timestamp
      BEFORE UPDATE ON cache_store
      FOR EACH ROW
      EXECUTE FUNCTION update_cache_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER update_cache_sorted_set_timestamp
      BEFORE UPDATE ON cache_sorted_set
      FOR EACH ROW
      EXECUTE FUNCTION update_cache_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER update_cache_hash_timestamp
      BEFORE UPDATE ON cache_hash
      FOR EACH ROW
      EXECUTE FUNCTION update_cache_timestamp();
  `);
};

exports.down = async function(knex) {
  // Drop triggers
  await knex.raw('DROP TRIGGER IF EXISTS update_cache_store_timestamp ON cache_store;');
  await knex.raw('DROP TRIGGER IF EXISTS update_cache_sorted_set_timestamp ON cache_sorted_set;');
  await knex.raw('DROP TRIGGER IF EXISTS update_cache_hash_timestamp ON cache_hash;');
  
  // Drop functions
  await knex.raw('DROP FUNCTION IF EXISTS update_cache_timestamp();');
  await knex.raw('DROP FUNCTION IF EXISTS cleanup_expired_cache();');
  
  // Drop tables
  await knex.schema.dropTableIfExists('cache_list');
  await knex.schema.dropTableIfExists('cache_hash');
  await knex.schema.dropTableIfExists('cache_sorted_set');
  await knex.schema.dropTableIfExists('cache_store');
};
