// Unit tests for settings endpoints
const request = require('supertest');

// Mock the database and auth modules
jest.mock('../../src/db/models');
jest.mock('../../src/middleware/auth');

const { UserModel } = require('../../src/db/models');
const { requireAuth } = require('../../src/middleware/auth');

describe('Settings Endpoints', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Create a test app instance
    const fastify = require('fastify')({ logger: false });
    
    // Register settings routes
    const settingsRoutes = require('../../src/routes/settings');
    await fastify.register(settingsRoutes, { prefix: '/user/settings' });
    
    await fastify.ready();
    app = fastify;
    server = fastify.server;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication middleware
    requireAuth.mockImplementation(async (request, reply) => {
      request.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        provider: 'jwt',
        picture: null,
      };
    });
  });

  describe('GET /user/settings', () => {
    it('should get user settings', async () => {
      const mockSettings = {
        syncEnabled: true,
        autoSync: true,
        syncFrequency: 'realtime',
        syncOnWifiOnly: false,
        dataSharing: {
          analytics: true,
          crashReports: true,
          usageStats: true,
          personalizedAds: false,
        },
        theme: 'system',
        language: 'en',
        notifications: {
          reminders: true,
          achievements: true,
          streaks: true,
          weeklyReports: true,
        },
        defaultReminderTime: '09:00',
        defaultReminderLevel: '1',
        showCompletedFlows: true,
        showArchivedFlows: false,
        backupEnabled: true,
        backupFrequency: 'daily',
        lastBackupTime: null,
      };

      const { getUserSettings } = require('../../src/controllers/settings.controller');
      getUserSettings.mockResolvedValue(mockSettings);

      const response = await request(server)
        .get('/user/settings')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.syncEnabled).toBe(true);
      expect(response.body.data.theme).toBe('system');
      expect(response.body.data.language).toBe('en');
    });

    it('should return 404 for non-existent settings', async () => {
      const { getUserSettings } = require('../../src/controllers/settings.controller');
      getUserSettings.mockResolvedValue(null);

      const response = await request(server)
        .get('/user/settings')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /user/settings', () => {
    it('should update user settings', async () => {
      const updateData = {
        theme: 'dark',
        language: 'es',
        notifications: {
          reminders: false,
          achievements: true,
          streaks: true,
          weeklyReports: false,
        },
        dataSharing: {
          analytics: false,
          crashReports: true,
          usageStats: false,
          personalizedAds: false,
        },
      };

      const mockUpdatedSettings = {
        ...updateData,
        syncEnabled: true,
        autoSync: true,
        syncFrequency: 'realtime',
        syncOnWifiOnly: false,
        defaultReminderTime: '09:00',
        defaultReminderLevel: '1',
        showCompletedFlows: true,
        showArchivedFlows: false,
        backupEnabled: true,
        backupFrequency: 'daily',
        lastBackupTime: null,
        updatedAt: new Date(),
      };

      const { updateUserSettings } = require('../../src/controllers/settings.controller');
      updateUserSettings.mockResolvedValue(mockUpdatedSettings);

      const response = await request(server)
        .put('/user/settings')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.theme).toBe('dark');
      expect(response.body.data.language).toBe('es');
      expect(response.body.data.notifications.reminders).toBe(false);
    });

    it('should return 400 for invalid theme', async () => {
      const updateData = {
        theme: 'invalid-theme',
      };

      const response = await request(server)
        .put('/user/settings')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid language code', async () => {
      const updateData = {
        language: 'invalid-lang',
      };

      const response = await request(server)
        .put('/user/settings')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /user/settings/:key', () => {
    it('should update specific setting', async () => {
      const updateData = {
        value: 'dark',
      };

      const mockUpdatedSettings = {
        theme: 'dark',
        updatedAt: new Date(),
      };

      const { updateSetting } = require('../../src/controllers/settings.controller');
      updateSetting.mockResolvedValue(mockUpdatedSettings);

      const response = await request(server)
        .put('/user/settings/theme')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.theme).toBe('dark');
    });

    it('should return 400 for missing value', async () => {
      const response = await request(server)
        .put('/user/settings/theme')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /user/settings/privacy/:key', () => {
    it('should update privacy setting', async () => {
      const updateData = {
        value: false,
      };

      const mockUpdatedSettings = {
        dataSharing: {
          analytics: false,
          crashReports: true,
          usageStats: true,
          personalizedAds: false,
        },
        updatedAt: new Date(),
      };

      const { updatePrivacySetting } = require('../../src/controllers/settings.controller');
      updatePrivacySetting.mockResolvedValue(mockUpdatedSettings);

      const response = await request(server)
        .put('/user/settings/privacy/analytics')
        .set('Authorization', 'Bearer test-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.dataSharing.analytics).toBe(false);
    });
  });

  describe('DELETE /user/settings', () => {
    it('should reset settings to defaults', async () => {
      const { resetSettings } = require('../../src/controllers/settings.controller');
      resetSettings.mockResolvedValue(true);

      const response = await request(server)
        .delete('/user/settings')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Settings reset to defaults');
    });
  });

  describe('DELETE /user/settings/privacy', () => {
    it('should reset privacy settings', async () => {
      const { resetPrivacySettings } = require('../../src/controllers/settings.controller');
      resetPrivacySettings.mockResolvedValue(true);

      const response = await request(server)
        .delete('/user/settings/privacy')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Privacy settings reset to defaults');
    });
  });

  describe('POST /user/settings/sync', () => {
    it('should sync settings with backend', async () => {
      const mockSyncedSettings = {
        syncEnabled: true,
        autoSync: true,
        syncFrequency: 'realtime',
        lastSyncTime: new Date(),
      };

      const { syncSettings } = require('../../src/controllers/settings.controller');
      syncSettings.mockResolvedValue(mockSyncedSettings);

      const response = await request(server)
        .post('/user/settings/sync')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.syncEnabled).toBe(true);
    });
  });

  describe('GET /user/settings/export', () => {
    it('should export settings for backup', async () => {
      const mockExportedSettings = {
        settings: {
          theme: 'dark',
          language: 'en',
          notifications: {
            reminders: true,
            achievements: true,
            streaks: true,
            weeklyReports: true,
          },
        },
        privacySettings: {
          dataSharing: {
            analytics: true,
            crashReports: true,
            usageStats: true,
            personalizedAds: false,
          },
        },
        exportDate: new Date(),
        version: '1.0.0',
      };

      const { exportSettings } = require('../../src/controllers/settings.controller');
      exportSettings.mockResolvedValue(mockExportedSettings);

      const response = await request(server)
        .get('/user/settings/export')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.theme).toBe('dark');
      expect(response.body.data.privacySettings.dataSharing.analytics).toBe(true);
    });
  });

  describe('POST /user/settings/import', () => {
    it('should import settings from backup', async () => {
      const importData = {
        settings: {
          theme: 'dark',
          language: 'en',
          notifications: {
            reminders: true,
            achievements: true,
            streaks: true,
            weeklyReports: true,
          },
        },
        privacySettings: {
          dataSharing: {
            analytics: true,
            crashReports: true,
            usageStats: true,
            personalizedAds: false,
          },
        },
        exportDate: new Date(),
        version: '1.0.0',
      };

      const mockImportedSettings = {
        ...importData,
        importedAt: new Date(),
      };

      const { importSettings } = require('../../src/controllers/settings.controller');
      importSettings.mockResolvedValue(mockImportedSettings);

      const response = await request(server)
        .post('/user/settings/import')
        .set('Authorization', 'Bearer test-token')
        .send(importData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.theme).toBe('dark');
    });

    it('should return 400 for missing settings', async () => {
      const response = await request(server)
        .post('/user/settings/import')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
