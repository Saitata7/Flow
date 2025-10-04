// routes/settings.js
// Settings and privacy management routes
// Handles user settings, privacy preferences, and cross-device sync

const {
  getUserSettings,
  updateUserSettings,
  updateSetting,
  updatePrivacySetting,
  resetSettings,
  resetPrivacySettings,
  syncSettings,
  exportSettings,
  importSettings,
  completePrivacySetup,
  getPrivacySummary,
  getDataSharingLevel,
  hasCompletedPrivacySetup,
} = require('../controllers/settings.controller');

const { requireAuth } = require('../middleware/auth');

const settingsRoutes = async fastify => {
  // Get user settings
  fastify.get(
    '/',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get user settings',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getUserSettings
  );

  // Update user settings
  fastify.put(
    '/',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Update user settings',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          additionalProperties: true,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateUserSettings
  );

  // Update specific setting
  fastify.put(
    '/:key',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Update a specific setting',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
          required: ['key'],
        },
        body: {
          type: 'object',
          properties: {
            value: { type: ['string', 'number', 'boolean', 'object'] },
          },
          required: ['value'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateSetting
  );

  // Update privacy setting
  fastify.put(
    '/privacy/:key',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Update a privacy setting',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
          required: ['key'],
        },
        body: {
          type: 'object',
          properties: {
            value: { type: ['string', 'number', 'boolean', 'object'] },
          },
          required: ['value'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updatePrivacySetting
  );

  // Reset settings
  fastify.delete(
    '/',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Reset settings to defaults',
        tags: ['settings'],
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
    resetSettings
  );

  // Reset privacy settings
  fastify.delete(
    '/privacy',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Reset privacy settings',
        tags: ['settings'],
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
    resetPrivacySettings
  );

  // Sync settings
  fastify.post(
    '/sync',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Sync settings with backend',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    syncSettings
  );

  // Export settings
  fastify.get(
    '/export',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Export settings for backup',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    exportSettings
  );

  // Import settings
  fastify.post(
    '/import',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Import settings from backup',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            settings: {
              type: 'object',
              additionalProperties: true,
            },
            privacySettings: {
              type: 'object',
              additionalProperties: true,
            },
            exportDate: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
          },
          required: ['settings'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    importSettings
  );

  // Complete privacy setup
  fastify.post(
    '/privacy/setup',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Complete privacy setup with user choices',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            allowCloudSync: { type: 'boolean', default: true },
            allowAnalytics: { type: 'boolean', default: true },
            allowCrashReports: { type: 'boolean', default: true },
            allowUsageStats: { type: 'boolean', default: true },
            allowPersonalizedAds: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    completePrivacySetup
  );

  // Get privacy summary
  fastify.get(
    '/privacy/summary',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get privacy summary',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getPrivacySummary
  );

  // Get data sharing level
  fastify.get(
    '/privacy/data-sharing-level',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get data sharing level',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  level: { type: 'string', enum: ['minimal', 'limited', 'moderate', 'full'] },
                },
              },
            },
          },
        },
      },
    },
    getDataSharingLevel
  );

  // Check if privacy setup is completed
  fastify.get(
    '/privacy/setup-status',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Check if privacy setup is completed',
        tags: ['settings'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  completed: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    hasCompletedPrivacySetup
  );
};

module.exports = settingsRoutes;
