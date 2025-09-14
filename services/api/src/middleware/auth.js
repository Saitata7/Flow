const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('./errorHandler');

// Initialize Firebase Admin SDK
let firebaseApp = null;
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  }
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Extract token from Authorization header
const extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// Verify Firebase token
const verifyFirebaseToken = async (token) => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      id: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      provider: 'firebase',
    };
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return null;
  }
};

// Verify JWT token
const verifyJWTToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      emailVerified: decoded.emailVerified || false,
      name: decoded.name,
      picture: decoded.picture,
      provider: 'jwt',
    };
  } catch (error) {
    console.error('JWT token verification failed:', error.message);
    return null;
  }
};

// Generate JWT token
const generateJWTToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      picture: user.picture,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Authentication middleware
const authMiddleware = async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const token = extractToken(authHeader);
    
    if (token) {
      try {
        let user = null;
        
        // Try Firebase token first if Firebase is configured
        if (firebaseApp && process.env.AUTH_PROVIDER !== 'jwt-only') {
          user = await verifyFirebaseToken(token);
        }
        
        // Fallback to JWT if Firebase fails or is not configured
        if (!user && (process.env.AUTH_PROVIDER === 'jwt-only' || !firebaseApp)) {
          user = await verifyJWTToken(token);
        }
        
        if (user) {
          request.user = user;
          fastify.log.debug({ userId: user.id }, 'User authenticated');
        } else {
          fastify.log.warn({ token: token.substring(0, 10) + '...' }, 'Invalid token');
        }
      } catch (error) {
        fastify.log.error({ error: error.message }, 'Token verification error');
      }
    }
  });
};

// Required authentication middleware
const requireAuth = async (request, reply) => {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }
};

// Role-based authorization middleware
const requireRole = (allowedRoles) => {
  return async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // For now, we'll use a simple role check
    // In a real implementation, you'd fetch user roles from the database
    const userRole = request.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
  };
};

// Permission-based authorization middleware
const requirePermission = (requiredPermission) => {
  return async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // For now, we'll implement basic permission checks
    // In a real implementation, you'd fetch user permissions from the database
    const userPermissions = request.user.permissions || ['read:flows', 'write:flows'];
    
    // Check if user has wildcard permission
    if (userPermissions.includes('*')) {
      return;
    }
    
    // Check specific permission
    if (!userPermissions.includes(requiredPermission)) {
      throw new ForbiddenError(`Access denied. Required permission: ${requiredPermission}`);
    }
  };
};

// Resource ownership middleware
const requireOwnership = (resourceUserIdField = 'ownerId') => {
  return async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const resourceUserId = request.params[resourceUserIdField] || request.body[resourceUserIdField];
    
    if (resourceUserId !== request.user.id && request.user.role !== 'admin') {
      throw new ForbiddenError('Access denied. You can only access your own resources.');
    }
  };
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const userRequests = new Map();
  
  return async (request, reply) => {
    if (!request.user) {
      return; // Skip rate limiting for anonymous users
    }
    
    const userId = request.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId);
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      userRequests.set(userId, validRequests);
    }
    
    // Check current request count
    const currentRequests = userRequests.get(userId) || [];
    
    if (currentRequests.length >= maxRequests) {
      throw new ForbiddenError('Rate limit exceeded for user');
    }
    
    // Add current request
    currentRequests.push(now);
    userRequests.set(userId, currentRequests);
  };
};

// API key authentication (for service-to-service)
const requireApiKey = async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  
  if (!apiKey) {
    throw new UnauthorizedError('API key required');
  }
  
  // In a real implementation, validate against database
  const validApiKeys = process.env.VALID_API_KEYS ? 
    process.env.VALID_API_KEYS.split(',') : 
    ['flow-api-key-123', 'flow-service-key-456'];
  
  if (!validApiKeys.includes(apiKey)) {
    throw new UnauthorizedError('Invalid API key');
  }
  
  // Set service user context
  request.user = {
    id: 'service',
    role: 'service',
    permissions: ['*'],
  };
};

// Optional authentication middleware (for public endpoints)
const optionalAuth = async (request, reply) => {
  const authHeader = request.headers.authorization;
  const token = extractToken(authHeader);
  
  if (token) {
    try {
      let user = null;
      
      if (firebaseApp && process.env.AUTH_PROVIDER !== 'jwt-only') {
        user = await verifyFirebaseToken(token);
      }
      
      if (!user && (process.env.AUTH_PROVIDER === 'jwt-only' || !firebaseApp)) {
        user = await verifyJWTToken(token);
      }
      
      if (user) {
        request.user = user;
      }
    } catch (error) {
      // Silently ignore auth errors for optional auth
      fastify.log.debug({ error: error.message }, 'Optional auth failed');
    }
  }
};

module.exports = {
  authMiddleware,
  requireAuth,
  requireRole,
  requirePermission,
  requireOwnership,
  userRateLimit,
  requireApiKey,
  optionalAuth,
  extractToken,
  verifyFirebaseToken,
  verifyJWTToken,
  generateJWTToken,
};