// scripts/add-password-hash-column.js
// Add password_hash column to users table on GCP

const knex = require('knex');
require('dotenv').config({ path: 'env.production' });

// GCP Cloud SQL configuration
const knexConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
  },
  pool: {
    min: 2,
    max: 10,
  },
};

const db = knex(knexConfig);

async function addPasswordHashColumn() {
  try {
    console.log('🔧 Adding password_hash column to users table...');
    console.log(`📋 Connecting to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} as ${process.env.DB_USER}`);
    
    // Check if column already exists
    const tableInfo = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY column_name
    `);
    
    const existingColumns = tableInfo.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns.join(', '));
    
    // Add password_hash column if it doesn't exist
    if (!existingColumns.includes('password_hash')) {
      console.log('➕ Adding password_hash column...');
      await db.schema.alterTable('users', function(table) {
        table.string('password_hash').nullable();
      });
      console.log('✅ Added password_hash column');
    } else {
      console.log('✅ password_hash column already exists');
    }
    
    // Add other JWT-related columns
    const columnsToAdd = {
      'email_verification_token': { type: 'string', nullable: true },
      'email_verification_expires': { type: 'timestamp', nullable: true },
      'password_reset_token': { type: 'string', nullable: true },
      'password_reset_expires': { type: 'timestamp', nullable: true },
      'role': { type: 'string', nullable: false, defaultValue: 'user' },
      'status': { type: 'string', nullable: false, defaultValue: 'active' },
    };
    
    for (const [columnName, columnDef] of Object.entries(columnsToAdd)) {
      if (!existingColumns.includes(columnName)) {
        console.log(`➕ Adding ${columnName} column...`);
        await db.schema.alterTable('users', function(table) {
          if (columnDef.type === 'string') {
            table.string(columnName).nullable();
          } else if (columnDef.type === 'timestamp') {
            table.timestamp(columnName).nullable();
          }
        });
        console.log(`✅ Added ${columnName} column`);
      } else {
        console.log(`✅ ${columnName} column already exists`);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run the migration
addPasswordHashColumn()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

