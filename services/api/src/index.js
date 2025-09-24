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
const { flowsRoutes } = require('./routes/flows');
const { flowEntriesRoutes } = require('./routes/flowEntries');
const { plansRoutes } = require('./routes/plans');
const { profilesRoutes } = require('./routes/profiles');
const { settingsRoutes } = require('./routes/settings');
const { statsRoutes } = require('./routes/stats');
const { notificationRoutes } = require('./routes/notifications');
const schedulerService = require('./services/schedulerService');

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
          url: NODE_ENV === 'production' 
            ? 'https://api.flow.app/v1'
            : `http://localhost:${PORT}/v1`,
          description: NODE_ENV === 'production' ? 'Production' : 'Development',
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
        { name: 'flows', description: 'Flow management endpoints' },
        { name: 'entries', description: 'Flow entry endpoints' },
        { name: 'plans', description: 'Plan management endpoints' },
        { name: 'profiles', description: 'User profile endpoints' },
        { name: 'settings', description: 'User settings endpoints' },
        { name: 'stats', description: 'Statistics and analytics endpoints' },
      ],
    },
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

  // Authentication (optional for some routes)
  await fastify.register(authMiddleware);
};

// Register routes
const registerRoutes = async () => {
  // Health check
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            redis: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const redisStatus = await redis.ping() ? 'connected' : 'disconnected';
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      redis: redisStatus,
    };
  });

  // API routes with versioning
  await fastify.register(async (fastify) => {
    // Add Redis to request context
    fastify.decorate('redis', redis);

    // Register domain routes
    await fastify.register(flowsRoutes, { prefix: '/flows' });
    await fastify.register(flowEntriesRoutes, { prefix: '/entries' });
    await fastify.register(plansRoutes, { prefix: '/plans' });
    await fastify.register(profilesRoutes, { prefix: '/profiles' });
    await fastify.register(settingsRoutes, { prefix: '/settings' });
    await fastify.register(statsRoutes, { prefix: '/stats' });
    await fastify.register(notificationRoutes, { prefix: '/notifications' });
  }, { prefix: '/v1' });

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
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      fastify.log.error('Database connection failed');
      process.exit(1);
    }

    // Connect to Redis
    await redis.connect();
    fastify.log.info('Connected to Redis');

    // Initialize scheduler service
    await schedulerService.initialize();
    fastify.log.info('Scheduler service initialized');

    // Register everything
    await registerPlugins();
    await registerMiddleware();
    await registerRoutes();

    // Start server
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
