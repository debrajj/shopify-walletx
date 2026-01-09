import { createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

class Logger {
  constructor() {
    this.logStream = null;
    this.initLogStream();
  }

  async initLogStream() {
    if (process.env.LOG_FILE) {
      try {
        const logDir = dirname(join(process.cwd(), process.env.LOG_FILE));
        await mkdir(logDir, { recursive: true });
        this.logStream = createWriteStream(join(process.cwd(), process.env.LOG_FILE), { flags: 'a' });
      } catch (error) {
        console.error('Failed to create log file:', error);
      }
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] > currentLevel) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m'
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[level]}${formattedMessage}${reset}`);
    
    // File output
    if (this.logStream) {
      this.logStream.write(formattedMessage + '\n');
    }
  }

  error(message, meta) {
    this.log('error', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  debug(message, meta) {
    this.log('debug', message, meta);
  }
}

export const logger = new Logger();
