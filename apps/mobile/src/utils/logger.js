/**
 * Logging utility for Flow app
 * Provides conditional logging based on environment
 */

import { config } from '../config/environment';

class Logger {
  constructor() {
    this.isDebug = config.DEBUG;
    this.logLevel = config.LOG_LEVEL;
  }

  log(...args) {
    if (this.isDebug) {
      console.log(...args);
    }
  }

  error(...args) {
    if (this.logLevel === 'debug' || this.logLevel === 'error') {
      console.error(...args);
    }
  }

  warn(...args) {
    if (this.logLevel === 'debug' || this.logLevel === 'warn') {
      console.warn(...args);
    }
  }

  info(...args) {
    if (this.logLevel === 'debug') {
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.logLevel === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
