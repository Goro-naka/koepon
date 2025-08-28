import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLoggerService extends ConsoleLogger implements LoggerService {
  private logLevels = {
    error: 0,
    warn: 1,
    log: 2,
    debug: 3,
    verbose: 4,
  };

  constructor() {
    super('Koepon');
    this.setContext('Koepon');
    
    // Set log level based on environment
    const logLevel = process.env.LOG_LEVEL ?? 'log';
    this.setLogLevels(this.getLogLevelsForLevel(logLevel));
  }

  private getLogLevelsForLevel(level: string): string[] {
    const currentLevel = this.logLevels[level] ?? this.logLevels.log;
    const levels = [];

    if (currentLevel >= this.logLevels.error) levels.push('error');
    if (currentLevel >= this.logLevels.warn) levels.push('warn');
    if (currentLevel >= this.logLevels.log) levels.push('log');
    if (currentLevel >= this.logLevels.debug) levels.push('debug');
    if (currentLevel >= this.logLevels.verbose) levels.push('verbose');

    return levels;
  }

  error(message: string | object, stack?: string, context?: string) {
    const timestamp = new Date().toISOString();
    super.error(`[${timestamp}] ${typeof message === 'object' ? JSON.stringify(message) : message}`, stack, context ?? this.context);
  }

  warn(message: string | object, context?: string) {
    const timestamp = new Date().toISOString();
    super.warn(`[${timestamp}] ${typeof message === 'object' ? JSON.stringify(message) : message}`, context ?? this.context);
  }

  log(message: string | object, context?: string) {
    const timestamp = new Date().toISOString();
    super.log(`[${timestamp}] ${typeof message === 'object' ? JSON.stringify(message) : message}`, context ?? this.context);
  }

  debug(message: string | object, context?: string) {
    const timestamp = new Date().toISOString();
    super.debug(`[${timestamp}] ${typeof message === 'object' ? JSON.stringify(message) : message}`, context ?? this.context);
  }

  verbose(message: string | object, context?: string) {
    const timestamp = new Date().toISOString();
    super.verbose(`[${timestamp}] ${typeof message === 'object' ? JSON.stringify(message) : message}`, context ?? this.context);
  }

  // HTTP request logging
  logRequest(method: string, url: string, userAgent?: string, ip?: string) {
    this.log(`${method} ${url} - ${ip ?? 'unknown'} - ${userAgent ?? 'unknown'}`, 'HTTP');
  }

  // Business logic logging
  logBusinessEvent(event: string, data?: unknown) {
    const logData = data ? ` - Data: ${JSON.stringify(data)}` : '';
    this.log(`Business Event: ${event}${logData}`, 'BUSINESS');
  }

  // Security logging
  logSecurityEvent(event: string, details?: Record<string, unknown>) {
    const logData = details ? ` - Details: ${JSON.stringify(details)}` : '';
    this.warn(`Security Event: ${event}${logData}`, 'SECURITY');
  }
}