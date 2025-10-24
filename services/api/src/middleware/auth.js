// Auth middleware - re-exports from jwtAuth for compatibility
const { authenticateToken, requireRole } = require('./jwtAuth');

module.exports = {
  requireAuth: authenticateToken,
  requireRole
};
