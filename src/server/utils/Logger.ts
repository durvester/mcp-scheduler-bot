export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private component: string;

  private constructor(component: string = 'MCP Server', logLevel: LogLevel = LogLevel.INFO) {
    this.component = component;
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL) ?? logLevel;
  }

  public static getInstance(component?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(component);
    }
    return Logger.instance;
  }

  public static create(component: string): Logger {
    return new Logger(component);
  }

  private parseLogLevel(level?: string): LogLevel | null {
    if (!level) return null;
    
    const normalizedLevel = level.toLowerCase();
    switch (normalizedLevel) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level].padEnd(5);
    const component = `[${entry.component}]`.padEnd(20);
    
    let message = `${timestamp} ${level} ${component} ${entry.message}`;
    
    if (entry.data) {
      message += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    // Don't log anything in MCP stdio mode to avoid protocol interference
    if (this.isMcpMode()) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      data,
      error
    };

    const formattedMessage = this.formatMessage(entry);
    
    // Use appropriate console method based on log level
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  private isMcpMode(): boolean {
    // Detect if we're running in MCP stdio mode
    // MCP servers should not output to stdout/stderr as it interferes with the protocol
    return process.env.NODE_ENV === 'production' || 
           process.argv.some(arg => arg.includes('mcp')) ||
           !process.stdout.isTTY; // Not a terminal (likely MCP stdio)
  }

  public error(message: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Export a default logger instance
export const logger = Logger.getInstance();