const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('./errorHandler');

// Initialize Firebase Admin SDK
let firebaseApp = null;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'quick-doodad-472200-k0';

// Force Firebase to be disabled in JWT-only mode
if (process.env.AUTH_PROVIDER === 'jwt-only') {
  console.log('🔐 JWT-only authentication mode - Firebase Admin SDK disabled');
  firebaseApp = null;
  // Also clear any existing Firebase apps
  if (admin.apps.length > 0) {
    console.log('🔐 Clearing existing Firebase apps for JWT-only mode');
    admin.apps.forEach(app => {
      try {
        app.delete();
      } catch (error) {
        console.log('🔐 Error deleting Firebase app:', error.message);
      }
    });
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');
    console.log('🔥 Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('🔥 Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('🔥 Private Key Length:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 'NOT SET');
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    console.error('❌ Error details:', error);
  }
} else {
  if (process.env.AUTH_PROVIDER === 'jwt-only') {
    console.log('🔐 JWT-only authentication mode - Firebase Admin SDK disabled');
  } else {
    console.warn('⚠️ Firebase Admin SDK not initialized - missing environment variables');
    console.warn('⚠️ Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
    console.warn('⚠️ Using fallback authentication mode');
  }
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Extract token from Authorization header
const extractToken = authHeader => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Verify Firebase token with Redis caching and strict validation
const verifyFirebaseToken = async (token, redisClient = null) => {
  if (!firebaseApp) {
    console.log('Firebase Admin SDK not initialized, skipping Firebase verification');
    return null;
  }

  try {
    console.log('Verifying Firebase token...');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    // Validate token format first
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid token format - not a valid JWT');
      return null;
    }

    // Decode token header and payload for validation
    let header, payload;
    try {
      header = JSON.parse(atob(tokenParts[0]));
      payload = JSON.parse(atob(tokenParts[1]));
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError.message);
      return null;
    }

    // Validate token structure
    if (header.alg !== 'RS256' || header.typ !== 'JWT') {
      console.error('❌ Invalid token algorithm or type');
      return null;
    }

    // Validate Firebase project ID
    if (payload.aud !== FIREBASE_PROJECT_ID) {
      console.error('❌ Project ID mismatch:', payload.aud, 'vs', FIREBASE_PROJECT_ID);
      return null;
    }

    // Validate issuer
    const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    if (payload.iss !== expectedIssuer) {
      console.error('❌ Issuer mismatch:', payload.iss, 'vs', expectedIssuer);
      return null;
    }

    // Check for test/mock tokens
    if (payload.sub && payload.sub.includes('test') || payload.iss && payload.iss.includes('test')) {
      console.error('❌ Test/mock token detected');
      return null;
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('❌ Token is expired');
      return null;
    }

    // Check token issued time (not too old)
    const maxAge = 24 * 60 * 60; // 24 hours
    if (payload.iat && (now - payload.iat) > maxAge) {
      console.error('❌ Token is too old');
      return null;
    }

    // Create cache key from token hash
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    const cacheKey = `auth:firebase:${tokenHash}`;
    
    // Try Redis cache first (if available)
    let cachedUser = null;
    if (redisClient && redisClient.isConnected) {
      try {
        cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
          const cachedData = JSON.parse(cachedUser);
          // Validate cached data hasn't expired
          if (cachedData.expiresAt && cachedData.expiresAt > now) {
            console.log('✅ Firebase token verified from Redis cache');
            return cachedData.userData;
          } else {
            // Cache expired, remove it
            await redisClient.del(cacheKey);
            console.log('🔄 Stale cache removed, verifying with Firebase');
          }
        }
      } catch (cacheError) {
        console.log('Redis cache read failed, falling back to Firebase verification');
      }
    }
    
    // Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Firebase token verified successfully for user:', decodedToken.uid);
    
    // Additional validation for production
    if (process.env.NODE_ENV === 'production') {
      // Ensure user is not anonymous in production
      if (decodedToken.firebase?.sign_in_provider === 'anonymous') {
        console.error('Anonymous users not allowed in production');
        return null;
      }

      // Ensure email is verified for critical operations
      if (!decodedToken.email_verified) {
        console.error('Email verification required for user:', decodedToken.uid);
        return null;
      }
    }
    
    const userData = {
      id: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      provider: 'firebase',
    };
    
    // Cache the verified user data in Redis (if available)
    if (redisClient && redisClient.isConnected) {
      try {
        // Cache for 5 minutes (300 seconds) - shorter than Firebase token expiry
        const cacheData = {
          userData,
          expiresAt: now + 300
        };
        await redisClient.set(cacheKey, JSON.stringify(cacheData), 300);
        console.log('✅ Firebase token verification cached in Redis');
      } catch (cacheError) {
        console.log('Redis cache write failed, continuing without cache');
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Token preview:', token.substring(0, 20) + '...');
    
    // Log specific error types for debugging
    if (error.code === 'auth/id-token-expired') {
      console.error('Token is expired');
    } else if (error.code === 'auth/invalid-id-token') {
      console.error('Token is invalid');
    } else if (error.code === 'auth/id-token-revoked') {
      console.error('Token has been revoked');
    }
    
    // Don't throw error, just return null to allow fallback
    return null;
  }
};

// Verify JWT token
const verifyJWTToken = async token => {
  try {
    console.log('🔍 JWT verification: Starting token verification');
    console.log('🔍 JWT verification: Token length:', token.length);
    console.log('🔍 JWT verification: Token preview:', token.substring(0, 20) + '...');
    console.log('🔍 JWT verification: JWT_SECRET length:', JWT_SECRET.length);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 JWT verification: Token decoded successfully');
    console.log('🔍 JWT verification: Decoded payload:', decoded);
    
    const user = {
      id: decoded.uid || decoded.userId || decoded.id,
      email: decoded.email,
      emailVerified: decoded.emailVerified || false,
      name: decoded.name,
      picture: decoded.picture,
      provider: 'jwt',
    };
    
    console.log('🔍 JWT verification: User object created:', user);
    return user;
  } catch (error) {
    console.error('🔍 JWT verification: Token verification failed:', error.message);
    console.error('🔍 JWT verification: Error details:', error);
    return null;
  }
};

// Generate JWT token
const generateJWTToken = user => {
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

// Direct authentication function for use in requireAuth
const authenticateUser = async (request, reply) => {
  console.log('🔍 authenticateUser: Starting JWT authentication process');
  console.log('🔍 authenticateUser: AUTH_PROVIDER =', process.env.AUTH_PROVIDER);
  
  const authHeader = request.headers.authorization;
  const token = extractToken(authHeader);

  // Log request details for debugging
  console.log('Auth middleware - URL:', request.url);
  console.log('Auth middleware - Method:', request.method);
  console.log('Auth middleware - Has auth header:', !!authHeader);
  console.log('Auth middleware - Token preview:', token ? token.substring(0, 10) + '...' : 'none');

  if (token) {
    try {
      let user = null;

      // Always try JWT first - this is now the primary authentication method
      console.log('🔍 Attempting JWT token verification...');
      user = await verifyJWTToken(token);
      console.log('🔍 JWT verification result:', user ? 'SUCCESS' : 'FAILED');

      // Only fallback to Firebase if JWT fails and Firebase is configured
      if (!user && firebaseApp && process.env.AUTH_PROVIDER !== 'jwt-only') {
        console.log('JWT failed, attempting Firebase token verification as fallback...');
        const redisClient = request.server?.redis || null;
        user = await verifyFirebaseToken(token, redisClient);
        console.log('Firebase verification result:', user ? 'SUCCESS' : 'FAILED');
      }

      if (user) {
        request.user = user;
        console.log('✅ User authenticated successfully:', user.id);
        return user;
      } else {
        console.log('❌ No user found after all authentication attempts');
        return null;
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
      return null;
    }
  } else {
    console.log('ℹ️ No token provided');
    return null;
  }
};

// Authentication middleware
const authMiddleware = async fastify => {
  fastify.addHook('preHandler', async (request, reply) => {
    console.log('🔍 authMiddleware: Called for URL:', request.url);
    console.log('🔍 authMiddleware: Method:', request.method);
    
    const authHeader = request.headers.authorization;
    const token = extractToken(authHeader);

    // Log request details for debugging
    console.log('Auth middleware - URL:', request.url);
    console.log('Auth middleware - Method:', request.method);
    console.log('Auth middleware - Has auth header:', !!authHeader);
    console.log('Auth middleware - Token preview:', token ? token.substring(0, 10) + '...' : 'none');

    if (token) {
      try {
        let user = null;

        // Always try JWT first - this is now the primary authentication method
        console.log('🔍 Attempting JWT token verification...');
        user = await verifyJWTToken(token);
        console.log('🔍 JWT verification result:', user ? 'SUCCESS' : 'FAILED');

        // Only fallback to Firebase if JWT fails and Firebase is configured
        if (!user && firebaseApp && process.env.AUTH_PROVIDER !== 'jwt-only') {
          console.log('JWT failed, attempting Firebase token verification as fallback...');
          const redisClient = request.server?.redis || null;
          user = await verifyFirebaseToken(token, redisClient);
          console.log('Firebase verification result:', user ? 'SUCCESS' : 'FAILED');
        }

        if (user) {
          request.user = user;
          console.log('✅ User authenticated successfully:', user.id);
        } else {
          console.log('⚠️ Token verification failed, but continuing...');
        }
      } catch (error) {
        console.error('❌ Token verification error:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
    } else {
      console.log('ℹ️ No token provided');
    }
  });
};

// Required authentication middleware
const requireAuth = async (request, reply) => {
  console.log('🚨 requireAuth: FUNCTION CALLED - Starting authentication process');
  console.log('🚨 requireAuth: URL:', request.url);
  console.log('🚨 requireAuth: Method:', request.method);
  console.log('🚨 requireAuth: Authorization header:', request.headers.authorization ? 'Present' : 'Missing');
  
  console.log('🔍 requireAuth: FUNCTION CALLED - Starting authentication process');
  console.log('🔍 requireAuth: URL:', request.url);
  console.log('🔍 requireAuth: Method:', request.method);
  console.log('🔍 requireAuth: Authorization header:', request.headers.authorization ? 'Present' : 'Missing');
  
  console.log('🔍 requireAuth: Starting authentication process');
  
  // Only allow dev-token in development environment
  if (
    process.env.NODE_ENV === 'development' &&
    request.headers.authorization && 
    request.headers.authorization.includes('dev-token')
  ) {
    // Set a development user for testing (only in development)
    request.user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'dev@flow.app',
      name: 'Development User',
      role: 'user',
      emailVerified: true,
      provider: 'dev',
    };
    console.log('🔧 Development mode: Using dev user');
    return;
  }

  console.log('🔍 requireAuth: Calling authenticateUser function');
  console.log('🔍 requireAuth: NODE_ENV =', process.env.NODE_ENV);
  console.log('🔍 requireAuth: AUTH_PROVIDER =', process.env.AUTH_PROVIDER);
  console.log('🔍 requireAuth: About to call authenticateUser...');
  
  // Use the main authMiddleware function which has our fallback logic
  try {
    console.log('🔍 requireAuth: Calling authenticateUser now...');
    const user = await authenticateUser(request, reply);
    console.log('🔍 requireAuth: authenticateUser returned:', user ? 'SUCCESS' : 'FAILED');
    if (!user) {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.error('❌ Auth header:', request.headers.authorization ? 'Present' : 'Missing');
    console.error('❌ Token preview:', request.headers.authorization ? request.headers.authorization.substring(0, 20) + '...' : 'None');
    
    // Check authentication provider
    if (process.env.AUTH_PROVIDER === 'jwt-only') {
      console.error('❌ JWT authentication failed - invalid or expired token');
    } else {
      console.error('❌ Firebase Admin SDK is initialized but token verification failed');
    }
    
    throw new UnauthorizedError('Authentication required. Please provide a valid token.');
  }

  // Additional security checks for production
  if (process.env.NODE_ENV === 'production') {
    // Verify email is verified for critical operations
    if (request.user.provider === 'firebase' && !request.user.emailVerified) {
      console.error('❌ Email verification required for user:', request.user.id);
      throw new ForbiddenError('Email verification required for this operation');
    }

    // Check for suspicious activity patterns
    const userAgent = request.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
      console.error('❌ Invalid user agent:', userAgent);
      throw new ForbiddenError('Invalid user agent');
    }
  }
  
  console.log('✅ User authenticated successfully:', request.user.id);
};

// Role-based authorization middleware
const requireRole = allowedRoles => {
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
const requirePermission = requiredPermission => {
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
  const validApiKeys = process.env.VALID_API_KEYS
    ? process.env.VALID_API_KEYS.split(',')
    : ['flow-api-key-123', 'flow-service-key-456'];

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

      // Always try JWT first
      user = await verifyJWTToken(token);

      // Only fallback to Firebase if JWT fails and Firebase is configured
      if (!user && firebaseApp && process.env.AUTH_PROVIDER !== 'jwt-only') {
        user = await verifyFirebaseToken(token);
      }

      if (user) {
        request.user = user;
      }
    } catch (error) {
      // Silently ignore auth errors for optional auth
      console.log('Optional auth failed:', error.message);
    }
  }
};

// Clear authentication cache for a specific token
const clearAuthCache = async (token, redisClient = null) => {
  if (!redisClient || !redisClient.isConnected) {
    return;
  }
  
  try {
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
    const cacheKey = `auth:firebase:${tokenHash}`;
    await redisClient.del(cacheKey);
    console.log('✅ Authentication cache cleared for token');
  } catch (error) {
    console.error('❌ Failed to clear authentication cache:', error.message);
  }
};

// Clear all authentication cache for a user
const clearUserAuthCache = async (userId, redisClient = null) => {
  if (!redisClient || !redisClient.isConnected) {
    return;
  }
  
  try {
    // This would require scanning Redis keys, which is expensive
    // For now, we'll rely on TTL expiration
    console.log('ℹ️ User auth cache will expire automatically via TTL');
  } catch (error) {
    console.error('❌ Failed to clear user authentication cache:', error.message);
  }
};

module.exports = {
  authMiddleware,
  authenticateUser,
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
  clearAuthCache,
  clearUserAuthCache,
};
