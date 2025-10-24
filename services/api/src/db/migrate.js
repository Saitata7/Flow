// db/migrate.js
// Database migration runner for Flow API

const { query } = require('./config');
const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor() {
    this.migrationsTable = 'schema_migrations';
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  async init() {
    try {
      // Create migrations table if it doesn't exist
      await query(`
        CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Migrations table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await query(`SELECT version FROM ${this.migrationsTable} ORDER BY version`);
      return result.rows.map(row => row.version);
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error);
      return [];
    }
  }

  async getPendingMigrations() {
    try {
      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      const executed = await this.getExecutedMigrations();
      
      return files.filter(file => !executed.includes(file));
    } catch (error) {
      console.error('❌ Failed to get pending migrations:', error);
      return [];
    }
  }

  async runMigration(filename) {
    try {
      const filePath = path.join(this.migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`🔄 Running migration: ${filename}`);
      
      // Execute migration in a transaction
      await query('BEGIN');
      await query(sql);
      
      // Record migration as executed
      const version = filename.replace('.sql', '');
      await query(
        `INSERT INTO ${this.migrationsTable} (version, filename) VALUES ($1, $2)`,
        [version, filename]
      );
      
      await query('COMMIT');
      console.log(`✅ Migration completed: ${filename}`);
      
    } catch (error) {
      await query('ROLLBACK');
      console.error(`❌ Migration failed: ${filename}`, error);
      throw error;
    }
  }

  async runAll() {
    try {
      console.log('🚀 Starting database migrations...');
      
      await this.init();
      
      const pending = await this.getPendingMigrations();
      
      if (pending.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }
      
      console.log(`📋 Found ${pending.length} pending migrations:`, pending);
      
      for (const migration of pending) {
        await this.runMigration(migration);
      }
      
      console.log('✅ All migrations completed successfully');
      
    } catch (error) {
      console.error('❌ Migration runner failed:', error);
      throw error;
    }
  }

  async status() {
    try {
      await this.init();
      
      const executed = await this.getExecutedMigrations();
      const pending = await this.getPendingMigrations();
      
      console.log('📊 Migration Status:');
      console.log(`✅ Executed: ${executed.length} migrations`);
      console.log(`⏳ Pending: ${pending.length} migrations`);
      
      if (executed.length > 0) {
        console.log('Executed migrations:', executed);
      }
      
      if (pending.length > 0) {
        console.log('Pending migrations:', pending);
      }
      
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2] || 'run';
  
  (async () => {
    try {
      switch (command) {
        case 'run':
          await runner.runAll();
          break;
        case 'status':
          await runner.status();
          break;
        default:
          console.log('Usage: node migrate.js [run|status]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Migration command failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = MigrationRunner;
