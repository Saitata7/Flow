// routes/auth.js
// Authentication routes for JWT token-based authentication
// Handles login, logout, token refresh, and user registration

const { generateJWTToken, verifyJWTToken, verifyFirebaseToken } = require('../middleware/auth');
const { UnauthorizedError, BadRequestError } = require('../middleware/errorHandler');
const { UserModel } = require('../db/models');

const authRoutes = async fastify => {
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
              email: firebaseUser.email,
              name: firebaseUser.name || name || email.split('@')[0],
              emailVerified: firebaseUser.emailVerified || false,
              provider: 'firebase',
              picture: firebaseUser.picture || picture,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log('✅ New user created from Firebase token:', user.id);
          }
        } catch (error) {
          console.error('Firebase token verification failed:', error.message);
        }
      }

      // If still no user, create a basic user record
      if (!user) {
        user = await UserModel.create({
          id: require('crypto').randomUUID(),
          email: email,
          name: name || email.split('@')[0],
          emailVerified: false,
          provider: 'jwt',
          picture: picture,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('✅ New user created with JWT:', user.id);
      }

      // Generate JWT token
      const token = generateJWTToken({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        picture: user.picture,
      });

      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            provider: user.provider,
            picture: user.picture,
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
      const user = await UserModel.create({
        id: require('crypto').randomUUID(),
        email: email,
        name: name,
        emailVerified: false,
        provider: 'jwt',
        picture: picture,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate JWT token
      const token = generateJWTToken({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        picture: user.picture,
      });

      return reply.status(201).send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            provider: user.provider,
            picture: user.picture,
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
};

module.exports = authRoutes;
