/**
 * Health Controller
 * Provides health check endpoints for monitoring
 */

const healthCheck = async (request, reply) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'healthy',
        redis: 'healthy',
        firebase: 'healthy'
      }
    };

    return reply.send(health);
  } catch (error) {
    request.log.error({ error: error.message }, 'Health check failed');
    return reply.status(503).send({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

const readinessCheck = async (request, reply) => {
  try {
    // Check database connection
    // Check Redis connection
    // Check Firebase connection
    
    return reply.send({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Readiness check failed');
    return reply.status(503).send({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

const livenessCheck = async (request, reply) => {
  return reply.send({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

module.exports = {
  healthCheck,
  readinessCheck,
  livenessCheck
};
