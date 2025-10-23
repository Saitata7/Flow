// scripts/add-jwt-columns.js
// Add JWT authentication columns to users table on GCP

const knex = require('knex');

// GCP Cloud SQL configuration
const knexConfig = {
  client: 'pg',
  connection: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: 5432,
    ssl: false,
  },
  pool: {
    min: 2,
    max: 10,
  },
};

const db = knex(knexConfig);

async function addJWTColumns() {
  try {
    console.log('🔧 Adding JWT authentication columns to users table...');
    
    // Check if columns already exist
    const tableInfo = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    
    const existingColumns = tableInfo.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns);
    
    // Add columns that don't exist
    if (!existingColumns.includes('password_hash')) {
      await db.schema.alterTable('users', function(table) {
        table.string('password_hash').nullable();
      });
      console.log('✅ Added password_hash column');
    }
    
    if (!existingColumns.includes('email_verification_token')) {
      await db.schema.alterTable('users', function(table) {
        table.string('email_verification_token').nullable();
      });
      console.log('✅ Added email_verification_token column');
    }
    
    if (!existingColumns.includes('email_verification_expires')) {
      await db.schema.alterTable('users', function(table) {
        table.timestamp('email_verification_expires').nullable();
      });
      console.log('✅ Added email_verification_expires column');
    }
    
    if (!existingColumns.includes('password_reset_token')) {
      await db.schema.alterTable('users', function(table) {
        table.string('password_reset_token').nullable();
      });
      console.log('✅ Added password_reset_token column');
    }
    
    if (!existingColumns.includes('password_reset_expires')) {
      await db.schema.alterTable('users', function(table) {
        table.timestamp('password_reset_expires').nullable();
      });
      console.log('✅ Added password_reset_expires column');
    }
    
    if (!existingColumns.includes('role')) {
      await db.schema.alterTable('users', function(table) {
        table.string('role').defaultTo('user');
      });
      console.log('✅ Added role column');
    }
    
    if (!existingColumns.includes('status')) {
      await db.schema.alterTable('users', function(table) {
        table.string('status').defaultTo('active');
      });
      console.log('✅ Added status column');
    }
    
    if (!existingColumns.includes('last_login_at')) {
      await db.schema.alterTable('users', function(table) {
        table.timestamp('last_login_at').nullable();
      });
      console.log('✅ Added last_login_at column');
    }
    
    // Add indexes
    try {
      await db.raw('CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token)');
      console.log('✅ Added email_verification_token index');
    } catch (error) {
      console.log('⚠️ Index already exists or error:', error.message);
    }
    
    try {
      await db.raw('CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token)');
      console.log('✅ Added password_reset_token index');
    } catch (error) {
      console.log('⚠️ Index already exists or error:', error.message);
    }
    
    try {
      await db.raw('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');
      console.log('✅ Added status index');
    } catch (error) {
      console.log('⚠️ Index already exists or error:', error.message);
    }
    
    console.log('🎉 JWT authentication columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding JWT columns:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run the migration
addJWTColumns()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
