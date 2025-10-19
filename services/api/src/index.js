// Load environment variables first
require('dotenv').config();

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const { RedisClient } = require('./redis/client');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { authMiddleware } = require('./middleware/auth');
const { testConnection, closePool } = require('./db/config');
const authRoutes = require('./routes/auth');
// const flowsRoutes = require('./routes/flows');
// const flowEntriesRoutes = require('./routes/flowEntries');
// const plansRoutes = require('./routes/plans');
// const profilesRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
// const statsRoutes = require('./routes/stats');
// const notificationRoutes = require('./routes/notifications');
// const userRoutes = require('./routes/user');
const schedulerService = require('./services/schedulerService');

// Get server configuration from environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Redis client
const redis = new RedisClient();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: NODE_ENV === 'production' ? 'info' : 'debug',
  },
  disableRequestLogging: false,
  ajv: {
    customOptions: {
      strictTypes: false,
      allowUnionTypes: true
    }
  }
});

// Register plugins
const registerPlugins = async () => {
  // Security middleware
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  // CORS
  await fastify.register(cors, {
    origin: NODE_ENV === 'production' 
      ? ['https://flow.app', 'https://app.flow.com']
      : true,
    credentials: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100, // requests per windowMs
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: 'Rate limit exceeded',
      message: `Too many requests from ${request.ip}`,
      retryAfter: Math.round(context.timeWindow / 1000),
    }),
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Flow API',
        description: 'Flow v1 API - Backend for Flow habit tracking application',
        version: '1.0.0',
        contact: {
          name: 'Flow Team',
          email: 'api@flow.app',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'https://flow-api-891963913698.us-central1.run.app',
          description: 'Production GCP API',
        },
        {
          url: 'http://localhost:4000',
          description: 'Local Development',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'flows', description: 'Flow management endpoints' },
        { name: 'entries', description: 'Flow entry endpoints' },
        { name: 'plans', description: 'Plan management endpoints' },
        { name: 'profiles', description: 'User profile endpoints' },
        { name: 'settings', description: 'User settings endpoints' },
        { name: 'user', description: 'User management endpoints' },
        { name: 'stats', description: 'Statistics and analytics endpoints' },
        { name: 'activities', description: 'Activity stats and analytics endpoints' },
      ],
    },
    exposeRoute: true,
    allowUnionTypes: true,
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: (request, reply, next) => {
        next();
      },
      preHandler: (request, reply, next) => {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
};

// Register middleware
const registerMiddleware = async () => {
  // Error handling
  fastify.setErrorHandler(errorHandler);

  // Request logging
  await fastify.register(requestLogger);

  // Authentication (optional for some routes) - DISABLED FOR DEBUGGING
  // await fastify.register(authMiddleware);
};

// Register routes
const registerRoutes = async () => {
  // Enhanced health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Comprehensive health check endpoint for Cloud Run monitoring',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'object' },
                redis: { type: 'object' },
                scheduler: { type: 'object' },
              },
            },
            metrics: {
              type: 'object',
              properties: {
                memory: { type: 'object' },
                cpu: { type: 'object' },
              },
            },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            errors: { type: 'array' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const startTime = Date.now();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {},
      metrics: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    const errors = [];

    try {
      // Check database health
      const { healthCheck: dbHealthCheck } = require('./db/config');
      health.services.database = await dbHealthCheck();
      if (health.services.database.status !== 'healthy') {
        errors.push('Database connection failed');
      }
    } catch (error) {
      health.services.database = {
        status: 'unhealthy',
        error: error.message,
      };
      errors.push('Database health check failed');
    }

    try {
      // Check Redis health
      const redisPing = await redis.ping();
      health.services.redis = {
        status: redisPing ? 'healthy' : 'unhealthy',
        connected: redisPing,
        fallbackMode: redis.fallbackMode || false,
      };
      if (!redisPing) {
        errors.push('Redis connection failed');
      }
    } catch (error) {
      health.services.redis = {
        status: 'unhealthy',
        error: error.message,
        fallbackMode: true,
      };
      errors.push('Redis health check failed');
    }

    try {
      // Check scheduler service health
      health.services.scheduler = {
        status: schedulerService.isInitialized ? 'healthy' : 'unhealthy',
        initialized: schedulerService.isInitialized,
        activeJobs: schedulerService.getActiveJobsCount ? schedulerService.getActiveJobsCount() : 0,
      };
      if (!schedulerService.isInitialized) {
        errors.push('Scheduler service not initialized');
      }
    } catch (error) {
      health.services.scheduler = {
        status: 'unhealthy',
        error: error.message,
      };
      errors.push('Scheduler health check failed');
    }

    // Determine overall health status
    const isHealthy = errors.length === 0;
    health.status = isHealthy ? 'healthy' : 'unhealthy';

    // Add response time
    health.responseTime = Date.now() - startTime;

    // Return appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    
    if (!isHealthy) {
      health.errors = errors;
    }

    return reply.status(statusCode).send(health);
  });

  // Debug endpoint to check environment variables
  fastify.get('/debug/env', async (request, reply) => {
    return {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_SSL: process.env.DB_SSL,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
  });

  // Debug endpoint to check database schema
  fastify.get('/debug/schema', async (request, reply) => {
    try {
      const { query } = require('./db/config');
      const { rows } = await query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      return reply.json({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        users_table_columns: rows,
        total_columns: rows.length
      });
    } catch (err) {
      return reply.status(500).json({ 
        ok: false, 
        error: err.message, 
        timestamp: new Date().toISOString(),
        stack: err.stack ? err.stack.split('\n').slice(0, 5) : 'No stack trace'
      });
    }
  });

  // Minimal sanity endpoint to verify /v1 prefix routing in production
  fastify.get('/v1/ping', async (request, reply) => {
    return { ok: true, ts: new Date().toISOString() };
  });

  // Debug endpoint to check mobile app connectivity (no auth required)
  fastify.get('/debug/flows', async (request, reply) => {
    const { FlowModel } = require('./db/models');
    try {
      const flows = await FlowModel.findByUserIdWithStatus('550e8400-e29b-41d4-a716-446655440000');
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        totalFlows: flows.length,
        flowsWithStatus: flows.filter(f => f.status && Object.keys(f.status).length > 0).length,
        sampleFlow: flows[0] ? {
          id: flows[0].id,
          title: flows[0].title,
          statusKeys: flows[0].status ? Object.keys(flows[0].status) : [],
          statusCount: flows[0].status ? Object.keys(flows[0].status).length : 0,
          statusSample: flows[0].status ? Object.entries(flows[0].status)[0] : null
        } : null,
        allFlowsStatus: flows.map(f => ({
          id: f.id,
          title: f.title,
          statusCount: f.status ? Object.keys(f.status).length : 0,
          statusKeys: f.status ? Object.keys(f.status) : []
        }))
      };

      return reply.send({
        success: true,
        data: debugInfo,
        message: 'Debug endpoint - mobile app connectivity check'
      });
    } catch (error) {
      console.error('Debug endpoint error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });

  // 🔍 TEMPORARY DIAGNOSTIC ENDPOINT - Remove after debugging
  fastify.get('/_diag/dbinfo', async (request, reply) => {
    try {
      const { query } = require('./db/config');
      const { rows } = await query(`
        SELECT 
          current_user, 
          current_database(), 
          inet_server_addr() AS server_ip,
          CASE 
            WHEN EXISTS (SELECT 1 FROM pg_stat_ssl WHERE pid = pg_backend_pid()) 
            THEN (SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid())
            ELSE false 
          END AS ssl_used,
          version() AS postgres_version
        LIMIT 1
      `);
      
      return reply.json({ 
        ok: true, 
        timestamp: new Date().toISOString(),
        connection_info: rows[0],
        env_check: {
          DB_HOST: process.env.DB_HOST,
          DB_USER: process.env.DB_USER,
          DB_NAME: process.env.DB_NAME,
          PGSSLMODE: process.env.PGSSLMODE || 'not set'
        }
      });
    } catch (err) {
      return reply.status(500).json({ 
        ok: false, 
        error: err.message, 
        timestamp: new Date().toISOString(),
        stack: err.stack ? err.stack.split('\n').slice(0, 5) : 'No stack trace',
        env_check: {
          DB_HOST: process.env.DB_HOST,
          DB_USER: process.env.DB_USER,
          DB_NAME: process.env.DB_NAME,
          PGSSLMODE: process.env.PGSSLMODE || 'not set'
        }
      });
    }
  });

  // API routes with explicit versioned prefixes (avoid nested group issues)
  // Add Redis to request context for all routes
  fastify.decorate('redis', redis);

  try {
    console.log('🔐 Registering auth routes at /v1/auth ...');
    await fastify.register(authRoutes, { prefix: '/v1/auth' });
    console.log('✅ Auth routes registered at /v1/auth');
  } catch (error) {
    console.error('❌ Failed to register auth routes:', error.message);
    console.error('❌ Auth routes error stack:', error.stack);
  }

  try {
    // Lazy import to avoid failures if file missing in image, keep auth working
    const profilesRoutes = require('./routes/profile');
    console.log('👤 Registering profile routes at /v1/profile ...');
    await fastify.register(profilesRoutes, { prefix: '/v1/profile' });
    console.log('✅ Profile routes registered at /v1/profile');
  } catch (error) {
    console.error('❌ Failed to register profile routes:', error.message);
  }

  try {
    const userRoutes = require('./routes/user');
    console.log('👤 Registering user routes at /v1/user ...');
    await fastify.register(userRoutes, { prefix: '/v1/user' });
    console.log('✅ User routes registered at /v1/user');
  } catch (error) {
    console.error('❌ Failed to register user routes:', error.message);
  }

  try {
    console.log('⚙️ Registering settings routes at /v1/user/settings ...');
    await fastify.register(settingsRoutes, { prefix: '/v1/user/settings' });
    console.log('✅ Settings routes registered at /v1/user/settings');
  } catch (error) {
    console.error('❌ Failed to register settings routes:', error.message);
  }

  // Root endpoint
  fastify.get('/', {
    schema: {
      description: 'API root endpoint',
      tags: ['root'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            version: { type: 'string' },
            docs: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return {
      message: 'Flow API v1',
      version: '1.0.0',
      docs: '/docs',
    };
  });

};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    schedulerService.stop();
    await redis.disconnect();
    await closePool();
    await fastify.close();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const start = async () => {
  try {
    // Test database connection (optional for development)
    const dbConnected = await testConnection();
    if (!dbConnected) {
      fastify.log.warn('Database connection failed - running in offline mode');
      // Don't exit, continue without database
    }

    // Connect to Redis (optional for development)
    try {
      await redis.connect();
      fastify.log.info('Connected to Redis');
    } catch (error) {
      fastify.log.warn('Redis connection failed - running without cache');
    }

    // Initialize scheduler service
    await schedulerService.initialize();
    fastify.log.info('Scheduler service initialized');

    // Register everything
    console.log('🔧 Starting route registration...');
    await registerPlugins();
    console.log('✅ Plugins registered');
    await registerMiddleware();
    console.log('✅ Middleware registered');
    console.log('🔧 About to register routes...');
    await registerRoutes();
    console.log('✅ Routes registered');

    // Start server
    console.log(`🚀 Starting server on ${HOST}:${PORT}...`);
    await fastify.listen({ port: PORT, host: HOST });
    
    fastify.log.info(`🚀 Flow API server running on http://${HOST}:${PORT}`);
    fastify.log.info(`📚 API documentation available at http://${HOST}:${PORT}/docs`);
    fastify.log.info(`🔍 Health check available at http://${HOST}:${PORT}/health`);
  } catch (error) {
    fastify.log.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start();
