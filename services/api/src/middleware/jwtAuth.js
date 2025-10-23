// middleware/jwtAuth.js
// Professional JWT Authentication Middleware
// Implements industry-standard authentication patterns

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { UnauthorizedError, ForbiddenError, ValidationError } = require('./errorHandler');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
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
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    emailVerified: user.email_verified,
    role: user.role || 'user',
    iat: Math.floor(Date.now() / 1000),
    type: 'access'
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'flow-api',
    audience: 'flow-mobile-app'
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'flow-api',
    audience: 'flow-mobile-app'
  });
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
 * Verify JWT token
 */
const verifyToken = (token, type = 'access') => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'flow-api',
      audience: 'flow-mobile-app'
    });
    
    if (decoded.type !== type) {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    } else {
      throw new UnauthorizedError('Token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 */
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

/**
 * Authentication middleware
 */
const authenticateToken = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
      throw new UnauthorizedError('Access token required');
    }
    
    const decoded = verifyToken(token, 'access');
    
    // Add user info to request
    request.user = {
      id: decoded.userId,
      email: decoded.email,
      emailVerified: decoded.emailVerified,
      role: decoded.role
    };
    
    console.log('✅ User authenticated:', request.user.email);
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
};

/**
 * Optional authentication middleware (for public endpoints)
 */
const optionalAuth = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    const token = extractToken(authHeader);
    
    if (token) {
      const decoded = verifyToken(token, 'access');
      request.user = {
        id: decoded.userId,
        email: decoded.email,
        emailVerified: decoded.emailVerified,
        role: decoded.role
      };
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
    console.log('Optional auth failed:', error.message);
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
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  extractToken,
  
  // Middleware functions
  authenticateToken,
  optionalAuth,
  requireEmailVerification,
  requireRole,
  userRateLimit,
  
  // Configuration
  PASSWORD_RULES,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};
