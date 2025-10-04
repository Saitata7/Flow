#!/bin/bash

# 🗄️ Run Database Migrations on GCP Cloud SQL
# This script connects to the GCP Cloud SQL instance and runs migrations
#
# ⚠️ SECURITY WARNING: Set DB_PASSWORD environment variable before running!
# Example: export DB_PASSWORD="your_actual_password"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="quick-doodad-472200-k0"
INSTANCE_NAME="flow-prod"
DATABASE_NAME="flow"
DB_USER="flow_user"
DB_PASSWORD="${DB_PASSWORD:-[YOUR_DB_PASSWORD]}"
DB_HOST="${DB_HOST:-34.63.78.153}"  # Primary address from gcloud sql instances list
DB_PORT="5432"

echo -e "${BLUE}🗄️ Running database migrations on GCP Cloud SQL...${NC}"
echo -e "${BLUE}Instance: ${INSTANCE_NAME}${NC}"
echo -e "${BLUE}Database: ${DATABASE_NAME}${NC}"
echo -e "${BLUE}Host: ${DB_HOST}${NC}"

# Set environment variables for the migration
export DB_HOST=${DB_HOST}
export DB_PORT=${DB_PORT}
export DB_NAME=${DATABASE_NAME}
export DB_USER=${DB_USER}
export DB_PASSWORD=${DB_PASSWORD}
export NODE_ENV=production

echo -e "${BLUE}📋 Environment variables set:${NC}"
echo -e "${BLUE}DB_HOST=${DB_HOST}${NC}"
echo -e "${BLUE}DB_PORT=${DB_PORT}${NC}"
echo -e "${BLUE}DB_NAME=${DATABASE_NAME}${NC}"
echo -e "${BLUE}DB_USER=${DB_USER}${NC}"

# Test database connection
echo -e "${BLUE}🔍 Testing database connection...${NC}"
cd "$(dirname "$0")/.."

# Test connection using Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    console.log('Current time:', result.rows[0].now);
    pool.end();
  }
});
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection test passed${NC}"
else
    echo -e "${RED}❌ Database connection test failed${NC}"
    exit 1
fi

# Run migrations
echo -e "${BLUE}🚀 Running database migrations...${NC}"
npm run migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Database migrations failed${NC}"
    exit 1
fi

# Verify tables were created
echo -e "${BLUE}🔍 Verifying tables were created...${NC}"
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

pool.query(\`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name
\`, (err, result) => {
  if (err) {
    console.error('❌ Error checking tables:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Tables created:');
    result.rows.forEach(row => {
      console.log('  -', row.table_name);
    });
    console.log(\`Total tables: \${result.rows.length}\`);
    pool.end();
  }
});
"

# Check default data
echo -e "${BLUE}🔍 Checking default data...${NC}"
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

Promise.all([
  pool.query('SELECT COUNT(*) as count FROM emotions'),
  pool.query('SELECT COUNT(*) as count FROM notification_templates')
]).then(results => {
  console.log('✅ Default data inserted:');
  console.log('  - Emotions:', results[0].rows[0].count);
  console.log('  - Notification templates:', results[1].rows[0].count);
  pool.end();
}).catch(err => {
  console.error('❌ Error checking default data:', err.message);
  process.exit(1);
});
"

echo -e "${GREEN}🎉 Database migration to GCP completed successfully!${NC}"
echo -e "${GREEN}📊 Database: ${DATABASE_NAME} on ${INSTANCE_NAME}${NC}"
echo -e "${GREEN}🔗 Connection: ${DB_HOST}:${DB_PORT}${NC}"
echo -e "${GREEN}👤 User: ${DB_USER}${NC}"

echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "${BLUE}1. Update your application's database connection settings${NC}"
echo -e "${BLUE}2. Test API endpoints with the new database${NC}"
echo -e "${BLUE}3. Verify all functionality works correctly${NC}"
echo -e "${BLUE}4. Set up monitoring and backups${NC}"
