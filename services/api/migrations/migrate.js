const knex = require('knex');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Knex configuration for migrations
const knexConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'flow',
    user: process.env.DB_USER || 'flow_user',
    password: process.env.DB_PASSWORD || 'flow_password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  migrations: {
    directory: path.join(__dirname),
    tableName: 'knex_migrations',
  },
};

const db = knex(knexConfig);

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Check if migrations table exists, if not create it
    const hasTable = await db.schema.hasTable('knex_migrations');
    if (!hasTable) {
      console.log('📋 Creating migrations table...');
      await db.migrate.latest();
    } else {
      console.log('📋 Running pending migrations...');
      await db.migrate.latest();
    }
    
    console.log('✅ Database migrations completed successfully!');
    
    // Show current migration status
    const migrations = await db.migrate.list();
    console.log('📊 Migration status:');
    console.log('   Completed:', migrations[0].length);
    console.log('   Pending:', migrations[1].length);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

async function rollbackMigrations() {
  try {
    console.log('🔄 Rolling back last migration...');
    await db.migrate.rollback();
    console.log('✅ Rollback completed successfully!');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

async function resetMigrations() {
  try {
    console.log('🔄 Resetting all migrations...');
    await db.migrate.rollback(null, true);
    console.log('✅ All migrations reset successfully!');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'latest':
    runMigrations();
    break;
  case 'rollback':
    rollbackMigrations();
    break;
  case 'reset':
    resetMigrations();
    break;
  default:
    console.log('Usage: node migrate.js [up|rollback|reset]');
    console.log('  up/latest  - Run pending migrations');
    console.log('  rollback   - Rollback last migration');
    console.log('  reset      - Reset all migrations');
    process.exit(1);
}
