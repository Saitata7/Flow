// routes/notifications.js
// Notification management routes

const { notificationService } = require('../services/notificationService');

const notificationRoutes = async (fastify, options) => {
  // Get user notifications
  fastify.get(
    '/',
    {
      schema: {
        description: 'Get user notifications',
        tags: ['notifications'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    type: { type: 'string' },
                    read: { type: 'boolean' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User authentication required',
          });
        }

        const notifications = await notificationService.getUserNotifications(userId);

        return {
          success: true,
          data: notifications,
        };
      } catch (error) {
        fastify.log.error('Error getting notifications:', error);
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to get notifications',
        });
      }
    }
  );

  // Mark notification as read
  fastify.patch(
    '/:id/read',
    {
      schema: {
        description: 'Mark notification as read',
        tags: ['notifications'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User authentication required',
          });
        }

        const { id } = request.params;
        await notificationService.markAsRead(userId, id);

        return {
          success: true,
          message: 'Notification marked as read',
        };
      } catch (error) {
        fastify.log.error('Error marking notification as read:', error);
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to mark notification as read',
        });
      }
    }
  );

  // Mark all notifications as read
  fastify.patch(
    '/read-all',
    {
      schema: {
        description: 'Mark all notifications as read',
        tags: ['notifications'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            success: false,
            error: 'Unauthorized',
            message: 'User authentication required',
          });
        }

        await notificationService.markAllAsRead(userId);

        return {
          success: true,
          message: 'All notifications marked as read',
        };
      } catch (error) {
        fastify.log.error('Error marking all notifications as read:', error);
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to mark all notifications as read',
        });
      }
    }
  );
};

module.exports = notificationRoutes;
