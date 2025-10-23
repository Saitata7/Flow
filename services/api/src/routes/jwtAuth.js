// routes/jwtAuth.js
// Professional JWT Authentication Routes
// Implements industry-standard authentication patterns

const { 
  validatePassword, 
  validateEmail, 
  hashPassword, 
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  authenticateToken,
  requireEmailVerification,
  userRateLimit
} = require('../middleware/jwtAuth');

const { UnauthorizedError, BadRequestError, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const UserModel = require('../db/jwtUserModel');

const jwtAuthRoutes = async fastify => {
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
      const age = today.getFullYear() - birthDate.getFullYear();
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
      
      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
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
          tokens: {
            accessToken,
            refreshToken
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
      
      // Check if user is JWT user
      if (!UserModel.isJWTUser(user)) {
        throw new UnauthorizedError('Account not set up for password login. Please use social login or reset your password.');
      }
      
      // Get password hash from auth_metadata
      const passwordHash = UserModel.getPasswordHash(user);
      if (!passwordHash) {
        throw new UnauthorizedError('Account not set up for password login. Please use social login or reset your password.');
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
      
      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Update last login
      await UserModel.update(user.id, { last_login_at: new Date() });
      
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
            emailVerified: user.email_verified,
            lastLoginAt: user.last_login_at
          },
          tokens: {
            accessToken,
            refreshToken
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
      
      // TODO: Send reset email
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
   * /v1/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     description: Get new access token using refresh token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid refresh token
   */
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh access token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { refreshToken } = request.body;
      
      console.log('📋 AuthController: Token refresh attempt');
      
      // Verify refresh token
      const { verifyToken } = require('../middleware/jwtAuth');
      const decoded = verifyToken(refreshToken, 'refresh');
      
      // Get user
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      
      // Generate new access token
      const accessToken = generateAccessToken(user);
      
      console.log('✅ AuthController: Token refreshed successfully:', user.email);
      
      return reply.send({
        success: true,
        data: {
          accessToken
        },
        message: 'Token refreshed successfully'
      });
      
    } catch (error) {
      console.error('❌ AuthController: Token refresh error:', error);
      
      return reply.status(401).send({
        success: false,
        error: 'Invalid refresh token',
        message: 'Token refresh failed'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/logout:
   *   post:
   *     summary: User logout
   *     description: Logout user (client should discard tokens)
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
    preHandler: [authenticateToken]
  }, async (request, reply) => {
    try {
      console.log('📋 AuthController: User logout:', request.user.email);
      
      // In a more sophisticated implementation, you might:
      // 1. Add the token to a blacklist
      // 2. Store logout timestamp
      // 3. Invalidate refresh tokens
      
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
};

module.exports = jwtAuthRoutes;
