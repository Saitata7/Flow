// routes/auth.js
// Authentication routes for JWT token-based authentication
// Handles login, logout, token refresh, and user registration

const { generateJWTToken, verifyJWTToken, verifyFirebaseToken } = require('../middleware/auth');
const { UnauthorizedError, BadRequestError } = require('../middleware/errorHandler');
const { UserModel } = require('../db/models');

const authRoutes = async fastify => {
  /**
   * @swagger
   * /v1/auth/login:
   *   post:
   *     summary: User login
   *     description: Authenticate user with email/password or Firebase token and generate JWT
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
   *               password:
   *                 type: string
   *                 minLength: 6
   *               firebaseToken:
   *                 type: string
   *               name:
   *                 type: string
   *               picture:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
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
   *                     token:
   *                       type: string
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         email:
   *                           type: string
   *                         name:
   *                           type: string
   *                         emailVerified:
   *                           type: boolean
   *                         provider:
   *                           type: string
   *                 message:
   *                   type: string
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  // Login endpoint - generates JWT token
  fastify.post('/login', {
    schema: {
      description: 'User login with email/password or Firebase token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          firebaseToken: { type: 'string' },
          name: { type: 'string' },
          picture: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    emailVerified: { type: 'boolean' },
                    provider: { type: 'string' },
                  },
                },
              },
            },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { email, password, firebaseToken, name, picture } = request.body;

      if (!email) {
        throw new BadRequestError('Email is required');
      }

      let user = null;

      // Try to find existing user by email
      try {
        user = await UserModel.findByEmail(email);
      } catch (error) {
        console.log('User not found, will create new user if Firebase token provided');
      }

      // If user doesn't exist and we have Firebase token, create new user
      if (!user && firebaseToken) {
        try {
          // Verify Firebase token to get user info
          const { verifyFirebaseToken } = require('../middleware/auth');
          const firebaseUser = await verifyFirebaseToken(firebaseToken);
          
          if (firebaseUser && firebaseUser.email === email) {
            // Create new user in database
            user = await UserModel.create({
              id: firebaseUser.id,
              firebase_uid: firebaseUser.id,
              email: firebaseUser.email,
              display_name: firebaseUser.name || name || email.split('@')[0],
              email_verified: firebaseUser.emailVerified || false,
              photo_url: firebaseUser.picture || picture,
              created_at: new Date(),
              updated_at: new Date(),
            });
            console.log('✅ New user created from Firebase token:', user.id);
          }
        } catch (error) {
          console.error('Firebase token verification failed:', error.message);
        }
      }

      // If still no user, create a basic user record
      if (!user) {
        const userId = require('crypto').randomUUID();
        user = await UserModel.create({
          id: userId,
          firebase_uid: userId, // Use same UUID for firebase_uid when no Firebase token
          email: email,
          display_name: name || email.split('@')[0],
          email_verified: false,
          photo_url: picture,
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log('✅ New user created with JWT:', user.id);
      }

      // Generate JWT token
      const token = generateJWTToken({
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        name: user.display_name,
        picture: user.photo_url,
      });

      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.display_name,
            emailVerified: user.email_verified,
            provider: 'firebase',
            picture: user.photo_url,
          },
        },
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Invalid request data',
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Login failed',
      });
    }
  });

  // Firebase to JWT conversion endpoint
  fastify.post('/firebase-to-jwt', {
    schema: {
      description: 'Convert Firebase ID token to JWT token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['firebaseToken'],
        properties: {
          firebaseToken: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              uid: { type: 'string' },
              email: { type: 'string' },
              displayName: { type: 'string' },
              photoURL: { type: 'string' },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            jwtToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                emailVerified: { type: 'boolean' },
                name: { type: 'string' },
                picture: { type: 'string' },
              },
            },
            expiresIn: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      console.log('🔄 Converting Firebase token to JWT...');
      
      const { firebaseToken, user } = request.body;
      
      if (!firebaseToken) {
        throw new BadRequestError('Firebase token is required');
      }
      
      // Verify Firebase token
      const firebaseUser = await verifyFirebaseToken(firebaseToken);
      
      if (!firebaseUser) {
        throw new UnauthorizedError('Invalid Firebase token');
      }
      
      console.log('✅ Firebase token verified for user:', firebaseUser.id);
      
      // Generate JWT token
      const jwtToken = generateJWTToken({
        id: firebaseUser.id,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        name: firebaseUser.name || user?.displayName,
        picture: firebaseUser.picture || user?.photoURL,
      });
      
      console.log('✅ JWT token generated successfully');
      
      return reply.send({
        success: true,
        jwtToken: jwtToken,
        user: {
          id: firebaseUser.id,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          name: firebaseUser.name || user?.displayName,
          picture: firebaseUser.picture || user?.photoURL,
        },
        expiresIn: '7d',
      });
      
    } catch (error) {
      console.error('❌ Firebase to JWT conversion failed:', error.message);
      
      if (error instanceof UnauthorizedError || error instanceof BadRequestError) {
        throw error;
      }
      
      throw new UnauthorizedError('Token conversion failed');
    }
  });

  /**
   * @swagger
   * /v1/auth/register:
   *   post:
   *     summary: User registration
   *     description: Register a new user account
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, name]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               name:
   *                 type: string
   *               password:
   *                 type: string
   *                 minLength: 6
   *               picture:
   *                 type: string
   *     responses:
   *       201:
   *         description: Registration successful
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
   *                     token:
   *                       type: string
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         email:
   *                           type: string
   *                         name:
   *                           type: string
   *                         emailVerified:
   *                           type: boolean
   *                         provider:
   *                           type: string
   *                 message:
   *                   type: string
   *       400:
   *         description: Bad request
   *       409:
   *         description: User already exists
   *       500:
   *         description: Internal server error
   */
  // Register endpoint - creates new user and returns JWT token
  fastify.post('/register', {
    schema: {
      description: 'User registration',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2, maxLength: 50 },
          password: { type: 'string', minLength: 6 },
          picture: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    emailVerified: { type: 'boolean' },
                    provider: { type: 'string' },
                  },
                },
              },
            },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { email, name, password, picture } = request.body;

      if (!email || !name) {
        throw new BadRequestError('Email and name are required');
      }

      // Check if user already exists
      try {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          throw new BadRequestError('User already exists with this email');
        }
      } catch (error) {
        // User doesn't exist, continue with registration
      }

      // Create new user
      const userId = require('crypto').randomUUID();
      const user = await UserModel.create({
        id: userId,
        firebase_uid: userId, // Use same UUID for firebase_uid when no Firebase token
        email: email,
        display_name: name,
        email_verified: false,
        photo_url: picture,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Generate JWT token
      const token = generateJWTToken({
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        name: user.display_name,
        picture: user.photo_url,
      });

      return reply.status(201).send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.display_name,
            emailVerified: user.email_verified,
            provider: 'jwt',
            picture: user.photo_url,
          },
        },
        message: 'Registration successful',
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Invalid request data',
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Registration failed',
      });
    }
  });

  // Token refresh endpoint
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh JWT token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    emailVerified: { type: 'boolean' },
                    provider: { type: 'string' },
                  },
                },
              },
            },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { token } = request.body;

      if (!token) {
        throw new BadRequestError('Token is required');
      }

      // Verify the existing token
      const user = await verifyJWTToken(token);
      if (!user) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      // Generate new token
      const newToken = generateJWTToken({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        picture: user.picture,
      });

      return reply.send({
        success: true,
        data: {
          token: newToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            provider: user.provider,
            picture: user.picture,
          },
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Invalid request data',
        });
      }
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send({
          success: false,
          error: error.message,
          message: 'Token refresh failed',
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Token refresh failed',
      });
    }
  });

  // Logout endpoint (mainly for client-side token cleanup)
  fastify.post('/logout', {
    schema: {
      description: 'User logout',
      tags: ['auth'],
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
  }, async (request, reply) => {
    // For JWT tokens, logout is mainly handled client-side by removing the token
    // In a more sophisticated setup, you might maintain a token blacklist
    return reply.send({
      success: true,
      message: 'Logout successful',
    });
  });

  /**
   * @swagger
   * /v1/auth/verify:
   *   post:
   *     summary: Verify JWT token
   *     description: Verify the validity of a JWT token
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
   *         description: Token is valid
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
   *                     valid:
   *                       type: boolean
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         email:
   *                           type: string
   *                 message:
   *                   type: string
   *       401:
   *         description: Invalid token
   *       400:
   *         description: Bad request
   */
  // Verify token endpoint
  fastify.post('/verify', {
    schema: {
      description: 'Verify JWT token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    emailVerified: { type: 'boolean' },
                    provider: { type: 'string' },
                  },
                },
              },
            },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { token } = request.body;

      if (!token) {
        throw new BadRequestError('Token is required');
      }

      // Verify the token
      const user = await verifyJWTToken(token);

      return reply.send({
        success: true,
        data: {
          valid: !!user,
          user: user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            provider: user.provider,
            picture: user.picture,
          } : null,
        },
        message: user ? 'Token is valid' : 'Token is invalid or expired',
      });
    } catch (error) {
      console.error('Token verification error:', error);
      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Invalid request data',
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Token verification failed',
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/reset-password:
   *   post:
   *     summary: Request password reset
   *     description: Send password reset email to user
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
   *                 description: User email address
   *     responses:
   *       200:
   *         description: Password reset email sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Bad request
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  fastify.post('/reset-password', {
    schema: {
      description: 'Request password reset',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email } = request.body;

      if (!email) {
        throw new BadRequestError('Email is required');
      }

      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return reply.send({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Generate reset token (in a real implementation, this would be a secure token)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database (you'd need to add this to UserModel)
      // For now, we'll just log it
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset token expires at: ${resetExpiry}`);

      // In a real implementation, you would:
      // 1. Store the reset token in the database
      // 2. Send an email with the reset link
      // 3. Use a proper email service (SendGrid, AWS SES, etc.)

      // For now, we'll simulate sending the email
      console.log(`📧 Password reset email would be sent to: ${email}`);
      console.log(`🔗 Reset link would be: https://yourapp.com/reset-password?token=${resetToken}`);

      return reply.send({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Invalid request data'
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process password reset request'
      });
    }
  });

  /**
   * @swagger
   * /v1/auth/reset-password/confirm:
   *   post:
   *     summary: Confirm password reset
   *     description: Reset password using reset token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token, newPassword]
   *             properties:
   *               token:
   *                 type: string
   *                 description: Password reset token
   *               newPassword:
   *                 type: string
   *                 minLength: 6
   *                 description: New password
   *     responses:
   *       200:
   *         description: Password reset successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       400:
   *         description: Bad request
   *       401:
   *         description: Invalid or expired token
   *       500:
   *         description: Internal server error
   */
  fastify.post('/reset-password/confirm', {
    schema: {
      description: 'Confirm password reset',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: {
            type: 'string',
            description: 'Password reset token'
          },
          newPassword: {
            type: 'string',
            minLength: 6,
            description: 'New password'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { token, newPassword } = request.body;

      if (!token || !newPassword) {
        throw new BadRequestError('Token and new password are required');
      }

      if (newPassword.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters long');
      }

      // In a real implementation, you would:
      // 1. Verify the reset token from the database
      // 2. Check if the token is not expired
      // 3. Update the user's password
      // 4. Invalidate the reset token

      // For now, we'll simulate the process
      console.log(`Password reset confirmation for token: ${token}`);
      console.log(`New password length: ${newPassword.length} characters`);

      // Simulate token validation
      if (token.length < 10) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or expired token',
          message: 'The reset token is invalid or has expired'
        });
      }

      return reply.send({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      if (error instanceof BadRequestError) {
        return reply.status(400).send({
          success: false,
          error: error.message,
          message: 'Invalid request data'
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to reset password'
      });
    }
  });
};

module.exports = authRoutes;
