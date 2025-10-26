// Auth middleware - re-exports from sessionAuth for compatibility
const { authenticateSession, requireRole } = require('./sessionAuth');

module.exports = {
  requireAuth: authenticateSession,
  requireRole
};
