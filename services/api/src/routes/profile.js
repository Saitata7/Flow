// routes/profile.js
// Enhanced profile management routes
// Handles comprehensive user profile data including demographics and privacy settings

const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth');

const profileRoutes = async (fastify, options) => {
  // Apply authentication middleware to all profile routes
  fastify.addHook('preHandler', requireAuth);

  /**
   * @swagger
   * /v1/profile:
   *   get:
   *     summary: Get user profile
   *     description: Retrieve comprehensive user profile information including demographics and privacy settings
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     email:
   *                       type: string
   *                     firstName:
   *                       type: string
   *                     lastName:
   *                       type: string
   *                     phoneNumber:
   *                       type: string
   *                     dateOfBirth:
   *                       type: string
   *                       format: date
   *                     gender:
   *                       type: string
   *                       enum: [male, female, non-binary, transgender, prefer-not-to-say, other]
   *                     race:
   *                       type: string
   *                       enum: [american-indian, asian, black, hispanic, native-hawaiian, white, multiracial, prefer-not-to-say, other]
   *                     disability:
   *                       type: string
   *                       enum: [none, visual, hearing, mobility, cognitive, mental-health, chronic-illness, prefer-not-to-say, other]
   *                     preferredLanguage:
   *                       type: string
   *                     country:
   *                       type: string
   *                     timezone:
   *                       type: string
   *                     healthGoals:
   *                       type: array
   *                       items:
   *                         type: string
   *                     fitnessLevel:
   *                       type: string
   *                       enum: [beginner, intermediate, advanced, expert]
   *                     medicalConditions:
   *                       type: string
   *                     profileVisibility:
   *                       type: string
   *                       enum: [public, friends, private]
   *                     dataSharing:
   *                       type: object
   *                       properties:
   *                         analytics:
   *                           type: boolean
   *                         research:
   *                           type: boolean
   *                         marketing:
   *                           type: boolean
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  fastify.get('/', profileController.getUserProfile);

  /**
   * @swagger
   * /v1/profile:
   *   put:
   *     summary: Update user profile
   *     description: Update comprehensive user profile information including demographics and privacy settings
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - email
   *               - dateOfBirth
   *               - gender
   *             properties:
   *               firstName:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               lastName:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               email:
   *                 type: string
   *                 format: email
   *               phoneNumber:
   *                 type: string
   *               dateOfBirth:
   *                 type: string
   *                 format: date
   *               gender:
   *                 type: string
   *                 enum: [male, female, non-binary, transgender, prefer-not-to-say, other]
   *               race:
   *                 type: string
   *                 enum: [american-indian, asian, black, hispanic, native-hawaiian, white, multiracial, prefer-not-to-say, other]
   *               ethnicity:
   *                 type: string
   *               disability:
   *                 type: string
   *                 enum: [none, visual, hearing, mobility, cognitive, mental-health, chronic-illness, prefer-not-to-say, other]
   *               preferredLanguage:
   *                 type: string
   *                 pattern: '^[a-z]{2}(-[A-Z]{2})?$'
   *               country:
   *                 type: string
   *                 maxLength: 100
   *               timezone:
   *                 type: string
   *                 maxLength: 50
   *               healthGoals:
   *                 type: array
   *                 items:
   *                   type: string
   *               fitnessLevel:
   *                 type: string
   *                 enum: [beginner, intermediate, advanced, expert]
   *               medicalConditions:
   *                 type: string
   *               profileVisibility:
   *                 type: string
   *                 enum: [public, friends, private]
   *               dataSharing:
   *                 type: object
   *                 properties:
   *                   analytics:
   *                     type: boolean
   *                   research:
   *                     type: boolean
   *                   marketing:
   *                     type: boolean
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  fastify.put('/', profileController.updateUserProfile);

  /**
   * @swagger
   * /v1/profile:
   *   delete:
   *     summary: Delete user profile
   *     description: Soft delete user profile (marks as deleted but preserves data)
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  fastify.delete('/', profileController.deleteUserProfile);

  /**
   * @swagger
   * /v1/profile/stats:
   *   get:
   *     summary: Get profile statistics
   *     description: Retrieve user profile statistics including flows, achievements, and activity metrics
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile stats retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalFlows:
   *                       type: integer
   *                     completedEntries:
   *                       type: integer
   *                     currentStreak:
   *                       type: integer
   *                     longestStreak:
   *                       type: integer
   *                     achievements:
   *                       type: integer
   *                     badges:
   *                       type: integer
   *                     joinDate:
   *                       type: string
   *                       format: date-time
   *                     lastActive:
   *                       type: string
   *                       format: date-time
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  fastify.get('/stats', profileController.getProfileStats);
};

module.exports = profileRoutes;
