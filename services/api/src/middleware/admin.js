// middleware/admin.js
// Admin middleware for protecting admin-only routes

const { UnauthorizedError } = require('./errorHandler');

/**
 * Middleware to require admin privileges
 * For now, this is a placeholder that allows all authenticated users
 * In production, this should check user roles/permissions
 */
const requireAdmin = async (request, reply) => {
  try {
    // For now, just check if user is authenticated
    // In production, you would check user.role === 'admin' or similar
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // TODO: Implement proper admin role checking
    // For now, allow all authenticated users
    // if (request.user.role !== 'admin') {
    //   throw new UnauthorizedError('Admin privileges required');
    // }

    return;
  } catch (error) {
    reply.code(401).send({
      success: false,
      error: 'UNAUTHORIZED',
      message: error.message || 'Admin privileges required'
    });
  }
};

module.exports = {
  requireAdmin
};
