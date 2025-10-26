// routes/sessionAuth.js
// Session-based Authentication Routes
// Simple, secure, and reliable for early app versions (v0.1-v1.2)

const { 
  validatePassword, 
  validateEmail, 
  hashPassword, 
  comparePassword,
  generateSessionToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  authenticateSession,
  requireEmailVerification,
  userRateLimit,
  createSession,
  deleteSession
} = require('../middleware/sessionAuth');

const { UnauthorizedError, BadRequestError, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const UserModel = require('../db/minimalJWTUserModel');

const sessionAuthRoutes = async fastify => {
  /**
   * @swagger
   * /v1/auth/register:
   *   post:
   *     summary: User registration
   *     description: Register a new user with email and password
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, firstName, lastName, username, dateOfBirth, gender]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
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
   *               dateOfBirth:
   *                 type: string
   *                 format: date
   *               gender:
   *                 type: string
   *                 enum: [male, female, other, prefer_not_to_say]
   *               phoneNumber:
   *                 type: string
   *     responses:
   *       201:
   *         description: Registration successful
   *       400:
   *         description: Validation error
   *       409:
   *         description: User already exists
   */
  fastify.post('/register', {
    schema: {
      description: 'User registration with email and password',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'username', 'dateOfBirth', 'gender'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1, maxLength: 50 },
          lastName: { type: 'string', minLength: 1, maxLength: 50 },
          username: { type: 'string', minLength: 3, maxLength: 25 },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
          phoneNumber: { type: 'string' }
        }
      }
    },
    preHandler: [userRateLimit(5, 300000)] // 5 requests per 5 minutes
  }, async (request, reply) => {
    try {
      const { email, password, firstName, lastName, username, dateOfBirth, gender, phoneNumber } = request.body;
      
      console.log('📋 AuthController: User registration attempt:', email);
      
      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new ValidationError(emailValidation.error);
      }
      
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,25}$/;
      if (!usernameRegex.test(username)) {
        throw new ValidationError('Username must be 3-25 characters long and contain only letters, numbers, and underscores');
      }
      
      // Validate age (must be 18+)
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        throw new ValidationError('You must be at least 18 years old to register');
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Generate email verification token
      const emailVerificationToken = generateEmailVerificationToken();
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Create user
      const userData = {
        email,
        passwordHash,
        firstName,
        lastName,
        username,
        dateOfBirth: birthDate,
        gender,
        phoneNumber,
        emailVerificationToken,
        emailVerificationExpires
      };
      
      const user = await UserModel.createUser(userData);
      
      // Create session
      const redis = fastify.redis;
      const sessionToken = await createSession(redis, user.id, user);
      
      console.log('✅ AuthController: User registered successfully:', user.email);
      
      // TODO: Send verification email
      console.log('📧 Email verification token:', emailVerificationToken);
      
      return reply.status(201).send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            emailVerified: user.email_verified,
            createdAt: user.created_at
          },
          session: {
            sessionToken,
            expiresIn: 604800 // 7 days in seconds
          }
        },
        message: 'Registration successful. Please check your email to verify your account.'
      });
      
    } catch (error) {
      console.error('❌ AuthController: Registration error:', error);
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Validation failed'
        });
      }
      
      if (error.message.includes('already exists') || error.message.includes('already taken')) {
        return reply.status(409).send({
          success: false,
          error: error.message,
          message: 'User already exists'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Registration failed'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/login:
   *   post:
   *     summary: User login
   *     description: Authenticate user with email and password
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   *       400:
   *         description: Validation error
   */
  fastify.post('/login', {
    schema: {
      description: 'User login with email and password',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    },
    preHandler: [userRateLimit(10, 300000)] // 10 requests per 5 minutes
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      console.log('📋 AuthController: User login attempt:', email);
      
      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new ValidationError(emailValidation.error);
      }
      
      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }
      
      // For session-based auth, check if user has password set
      // Try to get password hash - if not exists, check for basic authentication
      let passwordHash = null;
      try {
        passwordHash = await UserModel.getPasswordHash(user);
      } catch (error) {
        console.log('⚠️ Password hash check failed:', error.message);
      }
      
      // If user doesn't have password, throw error
      if (!passwordHash) {
        throw new UnauthorizedError('Account not set up for password login. Please register an account.');
      }
      
      // Check password
      const isPasswordValid = await comparePassword(password, passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }
      
      // Check if user is active
      if (user.status && user.status !== 'active') {
        throw new UnauthorizedError('Account is not active');
      }
      
      // Create session
      const redis = fastify.redis;
      const sessionToken = await createSession(redis, user.id, user);
      
      // Update last login
      try {
        await UserModel.update(user.id, { last_login_at: new Date() });
      } catch (error) {
        console.log('⚠️ Skipping last_login_at update (column may not exist)');
      }
      
      console.log('✅ AuthController: User logged in successfully:', user.email);
      
      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            emailVerified: user.email_verified
          },
          session: {
            sessionToken,
            expiresIn: 604800 // 7 days in seconds
          }
        },
        message: 'Login successful'
      });
      
    } catch (error) {
      console.error('❌ AuthController: Login error:', error);
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Validation failed'
        });
      }
      
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({
          success: false,
          error: error.message,
          message: 'Authentication failed'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Login failed'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/verify-email:
   *   post:
   *     summary: Verify email address
   *     description: Verify user email with token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token]
   *             properties:
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       400:
   *         description: Invalid or expired token
   */
  fastify.post('/verify-email', {
    schema: {
      description: 'Verify email address with token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { token } = request.body;
      
      console.log('📋 AuthController: Email verification attempt');
      
      const user = await UserModel.verifyEmail(token);
      
      console.log('✅ AuthController: Email verified successfully:', user.email);
      
      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            emailVerified: user.email_verified
          }
        },
        message: 'Email verified successfully'
      });
      
    } catch (error) {
      console.error('❌ AuthController: Email verification error:', error);
      
      return reply.status(400).send({
        success: false,
        error: error.message,
        message: 'Email verification failed'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     description: Send password reset email
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Reset email sent (if user exists)
   *       400:
   *         description: Validation error
   */
  fastify.post('/forgot-password', {
    schema: {
      description: 'Request password reset',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    },
    preHandler: [userRateLimit(3, 300000)] // 3 requests per 5 minutes
  }, async (request, reply) => {
    try {
      const { email } = request.body;
      
      console.log('📋 AuthController: Password reset request:', email);
      
      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new ValidationError(emailValidation.error);
      }
      
      const result = await UserModel.requestPasswordReset(email);
      
      console.log('✅ AuthController: Password reset token generated');
      
      // TODO: Send reset email via email service
      if (result.resetToken) {
        console.log('📧 Password reset token:', result.resetToken);
      }
      
      return reply.send({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      console.error('❌ AuthController: Password reset error:', error);
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Validation failed'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Password reset request failed'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/reset-password:
   *   post:
   *     summary: Reset password
   *     description: Reset password with token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token, password]
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       400:
   *         description: Invalid token or validation error
   */
  fastify.post('/reset-password', {
    schema: {
      description: 'Reset password with token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { token, password } = request.body;
      
      console.log('📋 AuthController: Password reset attempt');
      
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }
      
      // Hash new password
      const passwordHash = await hashPassword(password);
      
      // Reset password
      const user = await UserModel.resetPassword(token, passwordHash);
      
      console.log('✅ AuthController: Password reset successfully:', user.email);
      
      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email
          }
        },
        message: 'Password reset successfully'
      });
      
    } catch (error) {
      console.error('❌ AuthController: Password reset error:', error);
      
      if (error instanceof ValidationError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Validation failed'
        });
      }
      
      return reply.status(400).send({
        success: false,
        error: error.message,
        message: 'Password reset failed'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/logout:
   *   post:
   *     summary: User logout
   *     description: Logout user and invalidate session
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *       401:
   *         description: Unauthorized
   */
  fastify.post('/logout', {
    preHandler: [authenticateSession]
  }, async (request, reply) => {
    try {
      console.log('📋 AuthController: User logout:', request.user.email);
      
      // Delete session from Redis
      const redis = fastify.redis;
      if (request.user.sessionToken) {
        await deleteSession(redis, request.user.sessionToken);
      }
      
      console.log('✅ AuthController: User logged out successfully');
      
      return reply.send({
        success: true,
        message: 'Logout successful'
      });
      
    } catch (error) {
      console.error('❌ AuthController: Logout error:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Logout failed'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/session:
   *   get:
   *     summary: Get current session
   *     description: Get information about the current session
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Session information
   *       401:
   *         description: Unauthorized
   */
  fastify.get('/session', {
    preHandler: [authenticateSession]
  }, async (request, reply) => {
    try {
      return reply.send({
        success: true,
        data: {
          user: {
            id: request.user.id,
            email: request.user.email,
            firstName: request.user.firstName,
            lastName: request.user.lastName,
            username: request.user.username,
            emailVerified: request.user.emailVerified
          }
        }
      });
    } catch (error) {
      console.error('❌ Get session error:', error);
      
      return reply.status(401).send({
        success: false,
        error: 'Invalid session',
        message: 'Failed to get session information'
      });
    }
  });
};

module.exports = sessionAuthRoutes;

