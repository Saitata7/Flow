const plansRoutes = async fastify => {
  // Placeholder for plans routes
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Plans routes - coming soon',
      data: [],
    });
  });
};

module.exports = plansRoutes;
