// routes/debug.js
// Debug routes to inspect database schema

const DebugController = require('../controllers/debug.controller');

const debugRoutes = async fastify => {
  // Debug status endpoint
  fastify.get('/debug/status', DebugController.getStatus);
  
  // Test FlowModel creation
  fastify.post('/debug/test-flow-creation', DebugController.testFlowCreation);
  // Debug endpoint to check database schema
  fastify.get('/debug/schema', async (request, reply) => {
    try {
      const db = require('../db/config').db;
      
      // Get users table schema
      const tableInfo = await db.raw(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      return reply.send({
        success: true,
        data: {
          users_table_columns: tableInfo.rows
        },
        message: 'Database schema retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Debug schema error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
        message: 'Failed to retrieve schema'
      });
    }
  });

  // Debug endpoint to check existing users
  fastify.get('/debug/users', async (request, reply) => {
    try {
      const db = require('../db/config').db;
      
      const users = await db('users').select('*').limit(5);
      
      return reply.send({
        success: true,
        data: {
          users: users
        },
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Debug users error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
        message: 'Failed to retrieve users'
      });
    }
  });
};

module.exports = debugRoutes;
