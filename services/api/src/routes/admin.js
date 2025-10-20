// routes/admin.js
// Temporary admin routes for database maintenance

const fastify = require('fastify');

async function adminRoutes(fastify, options) {
  // Temporary migration endpoint
  fastify.post('/migrate-profile-columns', {
    schema: {
      description: 'Add missing profile columns to users table',
      tags: ['admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      console.log('🔄 Running profile columns migration...');
      
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
          min: 1,
          max: 5,
        },
      };
      
      const db = knex(knexConfig);
      
      try {
        // Check if columns already exist
        const hasFirstName = await db.schema.hasColumn('users', 'first_name');
        const hasLastName = await db.schema.hasColumn('users', 'last_name');
        
        if (hasFirstName && hasLastName) {
          console.log('✅ Profile columns already exist');
          await db.destroy();
          return reply.send({
            success: true,
            message: 'Profile columns already exist'
          });
        }
        
        console.log('📝 Adding first_name and last_name columns...');
        
        // Add only the essential columns first
        await db.schema.alterTable('users', function(table) {
          if (!hasFirstName) {
            table.string('first_name', 50);
            console.log('📝 Added first_name column');
          }
          if (!hasLastName) {
            table.string('last_name', 50);
            console.log('📝 Added last_name column');
          }
        });
        
        console.log('✅ Essential profile columns added successfully!');
        
        await db.destroy();
        
        return reply.send({
          success: true,
          message: 'Essential profile columns (first_name, last_name) added successfully'
        });
        
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        await db.destroy();
        throw dbError;
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return reply.status(500).send({
        success: false,
        message: 'Migration failed: ' + error.message
      });
    }
  });
}

module.exports = adminRoutes;
