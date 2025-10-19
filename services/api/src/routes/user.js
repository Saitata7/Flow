// routes/user.js
// User management routes
// Handles user account operations including CRUD operations

const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');

const userRoutes = async (fastify, options) => {
  // Apply authentication middleware to all user routes
  fastify.addHook('preHandler', requireAuth);

  /**
   * @swagger
   * /v1/user:
   *   get:
   *     summary: Get current user information
   *     description: Retrieve current user account information
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User information retrieved successfully
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
   *                     username:
   *                       type: string
   *                     emailVerified:
   *                       type: boolean
   *                     provider:
   *                       type: string
   *                     picture:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                     lastLoginAt:
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
  fastify.get('/', userController.getUserInfo);

  /**
   * @swagger
   * /v1/user:
   *   put:
   *     summary: Update current user information
   *     description: Update current user account information
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               lastName:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 50
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 25
   *               email:
   *                 type: string
   *                 format: email
   *               picture:
   *                 type: string
   *     responses:
   *       200:
   *         description: User information updated successfully
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
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  fastify.put('/', userController.updateUserInfo);

  /**
   * @swagger
   * /v1/user:
   *   delete:
   *     summary: Delete current user account
   *     description: Soft delete current user account (marks as deleted but preserves data)
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User account deleted successfully
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
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  fastify.delete('/', userController.deleteUserAccount);
};

module.exports = userRoutes;
