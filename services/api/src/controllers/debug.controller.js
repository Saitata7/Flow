// Debug controller for verification and diagnostics
const { FlowModel } = require('../db/models');
const { query } = require('../db/config');

class DebugController {
  // Debug status endpoint
  static async getStatus(request, reply) {
    try {
      const status = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {},
        models: {},
        database: {}
      };

      // Check FlowModel
      try {
        status.models.flowModel = {
          loaded: typeof FlowModel === 'function',
          createMethod: typeof FlowModel.create === 'function',
          findByUserIdMethod: typeof FlowModel.findByUserId === 'function',
          tableName: FlowModel.tableName || 'unknown'
        };
      } catch (error) {
        status.models.flowModel = {
          error: error.message,
          loaded: false
        };
      }

      // Check database connection
      try {
        const dbTest = await query('SELECT NOW() as current_time');
        status.database = {
          connected: true,
          currentTime: dbTest.rows[0]?.current_time,
          queryFunction: typeof query === 'function'
        };
      } catch (error) {
        status.database = {
          connected: false,
          error: error.message
        };
      }

      // Check Redis
      try {
        const redisPing = await request.server.redis.ping();
        status.services.redis = {
          connected: redisPing,
          fallbackMode: request.server.redis.fallbackMode || false,
          status: redisPing ? 'healthy' : 'skipped'
        };
      } catch (error) {
        status.services.redis = {
          connected: false,
          error: error.message,
          fallbackMode: true
        };
      }

      // Check flows table
      try {
        const flowsCount = await query('SELECT COUNT(*) as count FROM flows');
        status.database.flowsTable = {
          exists: true,
          count: flowsCount.rows[0]?.count || 0
        };
      } catch (error) {
        status.database.flowsTable = {
          exists: false,
          error: error.message
        };
      }

      // Check users table
      try {
        const usersCount = await query('SELECT COUNT(*) as count FROM users');
        status.database.usersTable = {
          exists: true,
          count: usersCount.rows[0]?.count || 0
        };
      } catch (error) {
        status.database.usersTable = {
          exists: false,
          error: error.message
        };
      }

      return reply.send({
        success: true,
        data: status,
        message: 'Debug status retrieved successfully'
      });

    } catch (error) {
      request.log.error({ error: error.message }, 'Debug status check failed');
      return reply.status(500).send({
        success: false,
        error: 'Debug status check failed',
        message: error.message
      });
    }
  }

  // Test FlowModel.create method
  static async testFlowCreation(request, reply) {
    try {
      const testFlow = {
        title: 'Debug Test Flow',
        description: 'Test flow created by debug endpoint',
        tracking_type: 'binary',
        storage_preference: 'local',
        owner_id: 'debug-test-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const createdFlow = await FlowModel.create(testFlow);
      
      return reply.send({
        success: true,
        data: {
          flowCreated: true,
          flowId: createdFlow.id,
          flowTitle: createdFlow.title,
          method: 'FlowModel.create'
        },
        message: 'Flow creation test successful'
      });

    } catch (error) {
      request.log.error({ error: error.message }, 'Flow creation test failed');
      return reply.status(500).send({
        success: false,
        error: 'Flow creation test failed',
        message: error.message,
        details: {
          method: 'FlowModel.create',
          errorType: error.constructor.name
        }
      });
    }
  }
}

module.exports = DebugController;
