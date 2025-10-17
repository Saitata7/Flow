/**
 * Test Environment Configuration
 * Loads production environment variables for testing
 */

const path = require('path');
const fs = require('fs');

// Load production environment variables
const envPath = path.resolve(__dirname, '../../env.production');

// Read and parse the environment file manually (Jest compatibility issue with dotenv)
try {
  const fileContent = fs.readFileSync(envPath, 'utf8');
  const lines = fileContent.split('\n');
  const parsed = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Set environment variable for tests
        process.env[key.trim()] = value;
        parsed[key.trim()] = value;
      }
    }
  });
  
  module.exports = parsed;
} catch (error) {
  console.error('Error reading env.production file:', error.message);
  module.exports = {};
}
