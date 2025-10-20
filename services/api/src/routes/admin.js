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
        
        // Add missing columns
        await db.schema.alterTable('users', function(table) {
          if (!hasFirstName) {
            table.string('first_name', 50);
            console.log('📝 Added first_name column');
          }
          if (!hasLastName) {
            table.string('last_name', 50);
            console.log('📝 Added last_name column');
          }
          
          // Add other profile columns
          table.string('phone_number', 20);
          table.date('date_of_birth');
          table.string('gender', 20);
          table.string('race', 30);
          table.string('ethnicity', 50);
          table.string('disability', 30);
          table.string('preferred_language', 10).defaultTo('en');
          table.string('country', 100);
          table.string('timezone', 50);
          table.json('health_goals').defaultTo('[]');
          table.string('fitness_level', 20);
          table.text('medical_conditions');
          table.string('profile_visibility', 20).defaultTo('private');
          table.json('data_sharing').defaultTo('{"analytics": true, "research": false, "marketing": false}');
          table.timestamp('profile_updated_at');
        });
        
        console.log('✅ Profile columns added successfully!');
        
        await db.destroy();
        
        return reply.send({
          success: true,
          message: 'Profile columns added successfully'
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
