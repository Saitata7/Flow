/**
 * Test Environment Configuration
 * Loads production environment variables for testing
 */

const path = require('path');
const dotenv = require('dotenv');

// Load production environment variables
const envPath = path.join(__dirname, '../../env.production');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.warn('Warning: Could not load env.production file:', envConfig.error.message);
}

// Export the parsed environment variables
module.exports = envConfig.parsed || {};
