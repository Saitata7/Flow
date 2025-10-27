// middleware/sessionAuth.js
// Session-based Authentication Middleware using Redis
// Simple, secure, and reliable for early app versions (v0.1-v1.2)

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { UnauthorizedError, ForbiddenError, ValidationError } = require('./errorHandler');

// Session configuration
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
const BCRYPT_ROUNDS = 12;

// Password validation rules
const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Generate a secure random session token (64-character hex string)
 */
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Extend session expiration by sliding the TTL window
 */
const extendSessionExpiration = async (sessionToken) => {
  try {
    const { query } = require('../db/config');
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
    
    await query(
      `UPDATE sessions 
       SET expires_at = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE session_token = $2 AND revoked = false`,
      [newExpiresAt, sessionToken]
    );
    
    console.log('✅ Session expiration extended');
  } catch (error) {
    console.warn('⚠️ Failed to extend session expiration:', error.message);
    // Don't throw - session is still valid
  }
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters long`);
  }
  
  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must be no more than ${PASSWORD_RULES.maxLength} characters long`);
  }
  
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_RULES.requireSpecialChars) {
    const specialCharRegex = new RegExp(`[${PASSWORD_RULES.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push(`Password must contain at least one special character: ${PASSWORD_RULES.specialChars}`);
    }
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty', 'letmein'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more secure password');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }
  
  return { isValid: true };
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Failed to compare password');
  }
};

/**
 * Generate email verification token
 */
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get Redis client from Fastify instance
 */
const getRedis = (request) => {
  return request.server.redis;
};

/**
 * Create a new session and store it in DATABASE (primary) and Redis (optional cache)
 */
const createSession = async (redis, userId, userData, deviceId = null) => {
  try {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
    
    const sessionData = {
      userId,
      email: userData.email,
      emailVerified: userData.emailVerified || false,
      role: userData.role || 'user',
      firstName: userData.firstName || userData.first_name,
      lastName: userData.lastName || userData.last_name,
      username: userData.username,
      createdAt: new Date().toISOString(),
    };
    
    // Store session in DATABASE as primary storage
    const { query } = require('../db/config');
    try {
      await query(
        `INSERT INTO sessions (user_id, session_token, expires_at, device_id) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (session_token) DO UPDATE SET expires_at = $3, updated_at = CURRENT_TIMESTAMP`,
        [userId, sessionToken, expiresAt, deviceId]
      );
      console.log('✅ Session stored in database');
    } catch (dbError) {
      console.warn('⚠️ Failed to store session in database:', dbError.message);
      // Continue anyway - session token is still returned
    }
    
    // Also try to store in Redis for faster lookups (optional)
    if (redis) {
      try {
        const sessionKey = `session:${sessionToken}`;
        await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', SESSION_DURATION_SECONDS);
        console.log('✅ Session also cached in Redis');
      } catch (redisError) {
        console.warn('⚠️ Redis unavailable for caching:', redisError.message);
      }
    }
    
    console.log(`✅ Session created: ${sessionToken.substring(0, 8)}...`);
    
    return sessionToken;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw new Error('Failed to create session');
  }
};

/**
 * Get session data from Database (primary) or Redis (cache)
 */
const getSession = async (redis, sessionToken) => {
  try {
    // Always try to get from database first (primary source)
    const { query } = require('../db/config');
    const dbResult = await query(
      `SELECT s.*, u.email, u.email_verified, u.role, u.first_name, u.last_name, u.username
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.revoked = false AND s.expires_at > NOW()`,
      [sessionToken]
    );
    
    if (dbResult.rows.length > 0) {
      const session = dbResult.rows[0];
      console.log('✅ Session found in database');
      return {
        userId: session.user_id,
        email: session.email,
        emailVerified: session.email_verified,
        role: session.role,
        firstName: session.first_name,
        lastName: session.last_name,
        username: session.username,
        createdAt: session.created_at
      };
    }
    
    // If not in database, try Redis cache (optional fallback)
    if (redis) {
      try {
        const sessionKey = `session:${sessionToken}`;
        const cachedSessionData = await redis.get(sessionKey);
        if (cachedSessionData) {
          console.log('✅ Session found in Redis cache');
          // Parse if it's a string, otherwise use as-is
          const sessionData = typeof cachedSessionData === 'string' 
            ? JSON.parse(cachedSessionData) 
            : cachedSessionData;
          return sessionData;
        }
      } catch (redisError) {
        console.warn('⚠️ Redis unavailable for session lookup:', redisError.message);
      }
    }
    
    console.warn('⚠️ Session not found in database or Redis');
    return null;
  } catch (error) {
    console.error('Failed to get session:', error.message);
    return null;
  }
};

/**
 * Delete session from Database and Redis
 */
const deleteSession = async (redis, sessionToken) => {
  try {
    // Delete from database
    const { query } = require('../db/config');
    await query(
      'UPDATE sessions SET revoked = true WHERE session_token = $1',
      [sessionToken]
    );
    console.log('✅ Session revoked in database');
    
    // Also delete from Redis if available
    if (redis) {
      try {
        const sessionKey = `session:${sessionToken}`;
        await redis.del(sessionKey);
        console.log('✅ Session deleted from Redis cache');
      } catch (redisError) {
        console.warn('⚠️ Redis deletion failed:', redisError.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete session:', error);
    return false;
  }
};

/**
 * Extract session token from request headers
 */
const extractSessionToken = (request) => {
  const authHeader = request.headers.authorization || request.headers['x-session-token'];
  
  if (!authHeader) {
    return null;
  }
  
  // Support both "Bearer <token>" and plain token formats
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  } else if (parts.length === 1) {
    return authHeader;
  }
  
  return null;
};

/**
 * Authentication middleware - verifies session token with sliding TTL
 */
const authenticateSession = async (request, reply) => {
  try {
    // Extract session token
    const sessionToken = extractSessionToken(request);
    
    if (!sessionToken) {
      throw new UnauthorizedError('Session token required');
    }
    
    // Get Redis client (optional)
    const redis = getRedis(request);
    
    // Try to get session from database first, then Redis cache
    const session = await getSession(redis, sessionToken);
    
    if (!session) {
      console.warn('⚠️ Session not found for token:', sessionToken.substring(0, 8));
      throw new UnauthorizedError('Invalid or expired session');
    }
    
    // Extend session expiration (sliding window)
    await extendSessionExpiration(sessionToken);
    
    // If Redis is available, update cache with extended TTL
    if (redis) {
      try {
        const sessionKey = `session:${sessionToken}`;
        await redis.set(sessionKey, JSON.stringify(session), 'EX', SESSION_DURATION_SECONDS);
      } catch (redisError) {
        console.warn('⚠️ Failed to update Redis cache:', redisError.message);
        // Don't fail authentication if Redis fails
      }
    }
    
    // Attach user info to request
    request.user = {
      id: session.userId,
      email: session.email,
      emailVerified: session.emailVerified,
      role: session.role,
      firstName: session.firstName,
      lastName: session.lastName,
      username: session.username,
      sessionToken: sessionToken // For logout functionality
    };
    
    console.log(`✅ User authenticated: ${request.user.email}`);
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
};

/**
 * Optional authentication middleware (for public endpoints)
 */
const optionalSessionAuth = async (request, reply) => {
  try {
    const redis = getRedis(request);
    const sessionToken = extractSessionToken(request);
    
    if (sessionToken && redis) {
      const session = await getSession(redis, sessionToken);
      if (session) {
        request.user = {
          id: session.userId,
          email: session.email,
          emailVerified: session.emailVerified,
          role: session.role,
          firstName: session.firstName,
          lastName: session.lastName,
          username: session.username,
          sessionToken: sessionToken
        };
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
    console.log('Optional session auth failed:', error.message);
  }
};

/**
 * Require email verification middleware
 */
const requireEmailVerification = async (request, reply) => {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  if (!request.user.emailVerified) {
    throw new ForbiddenError('Email verification required');
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (allowedRoles) => {
  return async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
  };
};

/**
 * Rate limiting per user
 */
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
      throw new ForbiddenError('Rate limit exceeded');
    }
    
    // Add current request
    currentRequests.push(now);
    userRequests.set(userId, currentRequests);
  };
};

module.exports = {
  // Validation functions
  validatePassword,
  validateEmail,
  
  // Password functions
  hashPassword,
  comparePassword,
  
  // Token functions
  generateSessionToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  
  // Session functions
  createSession,
  getSession,
  deleteSession,
  extractSessionToken,
  extendSessionExpiration,
  
  // Middleware functions
  authenticateSession,
  optionalSessionAuth,
  requireEmailVerification,
  requireRole,
  userRateLimit,
  
  // Configuration
  PASSWORD_RULES,
  SESSION_DURATION_SECONDS
};

