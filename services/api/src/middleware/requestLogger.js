const requestLogger = async fastify => {
  // Request logging middleware
  fastify.addHook('onRequest', async (request, reply) => {
    const startTime = Date.now();
    request.startTime = startTime;

    // Log request details
    fastify.log.info(
      {
        method: request.method,
        url: request.url,
        headers: {
          'user-agent': request.headers['user-agent'],
          'content-type': request.headers['content-type'],
          authorization: request.headers.authorization ? '[REDACTED]' : undefined,
        },
        query: request.query,
        body: request.body,
        user: request.user?.id || 'anonymous',
        ip: request.ip,
        requestId: request.id,
      },
      'Incoming request'
    );
  });

  // Response logging middleware
  fastify.addHook('onSend', async (request, reply, payload) => {
    const duration = Date.now() - request.startTime;

    // Log response details
    fastify.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        user: request.user?.id || 'anonymous',
        ip: request.ip,
        requestId: request.id,
        responseSize: payload ? Buffer.byteLength(payload) : 0,
      },
      'Request completed'
    );
  });

  // Error logging middleware
  fastify.addHook('onError', async (request, reply, error) => {
    const duration = Date.now() - request.startTime;

    fastify.log.error(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode || 500,
        duration: `${duration}ms`,
        user: request.user?.id || 'anonymous',
        ip: request.ip,
        requestId: request.id,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      'Request error'
    );
  });
};

module.exports = { requestLogger };
