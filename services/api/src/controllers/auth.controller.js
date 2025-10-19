const { generateJWTToken, verifyFirebaseToken } = require('../middleware/auth');
const { UnauthorizedError, BadRequestError } = require('../middleware/errorHandler');

/**
 * Convert Firebase ID token to JWT token
 * POST /auth/firebase-to-jwt
 */
const convertFirebaseToJWT = async (request, reply) => {
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
};

/**
 * Refresh JWT token using Firebase token
 * POST /auth/refresh-jwt
 */
const refreshJWT = async (request, reply) => {
  try {
    console.log('🔄 Refreshing JWT token...');
    
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Firebase token required for refresh');
    }
    
    const firebaseToken = authHeader.substring(7);
    
    // Verify Firebase token
    const firebaseUser = await verifyFirebaseToken(firebaseToken);
    
    if (!firebaseUser) {
      throw new UnauthorizedError('Invalid Firebase token');
    }
    
    // Generate new JWT token
    const jwtToken = generateJWTToken({
      id: firebaseUser.id,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      name: firebaseUser.name,
      picture: firebaseUser.picture,
    });
    
    console.log('✅ JWT token refreshed successfully');
    
    return reply.send({
      success: true,
      jwtToken: jwtToken,
      user: {
        id: firebaseUser.id,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        name: firebaseUser.name,
        picture: firebaseUser.picture,
      },
      expiresIn: '7d',
    });
    
  } catch (error) {
    console.error('❌ JWT refresh failed:', error.message);
    
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new UnauthorizedError('Token refresh failed');
  }
};

/**
 * Verify authentication status
 * GET /auth/verify
 */
const verifyAuth = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token required');
    }
    
    const token = authHeader.substring(7);
    
    // Try JWT first
    let user = null;
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = {
        id: decoded.userId,
        email: decoded.email,
        emailVerified: decoded.emailVerified,
        name: decoded.name,
        picture: decoded.picture,
        provider: 'jwt',
      };
    } catch (jwtError) {
      // Fallback to Firebase
      user = await verifyFirebaseToken(token);
    }
    
    if (!user) {
      throw new UnauthorizedError('Invalid token');
    }
    
    return reply.send({
      success: true,
      user: user,
      valid: true,
    });
    
  } catch (error) {
    console.error('❌ Auth verification failed:', error.message);
    
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new UnauthorizedError('Authentication verification failed');
  }
};

module.exports = {
  convertFirebaseToJWT,
  refreshJWT,
  verifyAuth,
};
