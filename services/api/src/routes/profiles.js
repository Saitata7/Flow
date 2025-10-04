const profilesRoutes = async fastify => {
  // Placeholder for profiles routes
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Profiles routes - coming soon',
      data: [],
    });
  });
};

module.exports = profilesRoutes;
