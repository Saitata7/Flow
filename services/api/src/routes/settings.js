const settingsRoutes = async (fastify) => {
  // Placeholder for settings routes
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Settings routes - coming soon',
      data: []
    });
  });
};

module.exports = { settingsRoutes };
