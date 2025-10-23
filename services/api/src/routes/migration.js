// routes/migration.js
// Temporary migration routes for creating jwt_users table

const knex = require('knex');

// Knex configuration for Cloud Run
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

const migrationRoutes = async (fastify) => {
  // Create jwt_users table endpoint
  fastify.post('/create-jwt-users-table', async (request, reply) => {
    try {
      console.log('🔧 Creating jwt_users table...');
      
      // Check if table already exists
      const tableExists = await db.schema.hasTable('jwt_users');
      if (tableExists) {
        return reply.send({
          success: true,
          message: 'jwt_users table already exists',
          tableExists: true
        });
      }
      
      // Create the table
      await db.schema.createTable('jwt_users', function(table) {
        table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable();
        table.string('password_hash').notNullable();
        table.string('username', 50);
        table.string('first_name', 50);
        table.string('last_name', 50);
        table.string('phone_number', 20);
        table.date('date_of_birth');
        table.string('gender', 20);
        table.string('email_verification_token', 100);
        table.timestamp('email_verification_expires');
        table.string('password_reset_token', 100);
        table.timestamp('password_reset_expires');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());

        // Foreign key constraint
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

        // Indexes
        table.index('user_id');
        table.index('username');
        table.index('email_verification_token');
        table.index('password_reset_token');
      });
      
      console.log('✅ jwt_users table created successfully');
      
      return reply.send({
        success: true,
        message: 'jwt_users table created successfully',
        tableExists: false
      });
      
    } catch (error) {
      console.error('❌ Error creating jwt_users table:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
        message: 'Failed to create jwt_users table'
      });
    }
  });

  // Check if jwt_users table exists
  fastify.get('/check-jwt-users-table', async (request, reply) => {
    try {
      const tableExists = await db.schema.hasTable('jwt_users');
      return reply.send({
        success: true,
        tableExists,
        message: tableExists ? 'jwt_users table exists' : 'jwt_users table does not exist'
      });
    } catch (error) {
      console.error('❌ Error checking jwt_users table:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
        message: 'Failed to check jwt_users table'
      });
    }
  });
};

module.exports = migrationRoutes;
