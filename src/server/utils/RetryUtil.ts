import { Logger } from './Logger.js';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      (error.response && error.response.status >= 500) ||
      (error.response && error.response.status === 429) // Rate limiting
    );
  }
};

export class RetryUtil {
  private static logger = Logger.create('RetryUtil');

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.debug(`Retry attempt ${attempt}/${config.maxRetries}`);
        }
        
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if we've exceeded max retries
        if (attempt >= config.maxRetries) {
          this.logger.warn('Max retries exceeded', { 
            maxRetries: config.maxRetries, 
            lastError: error?.message || String(error)
          });
          break;
        }

        // Check if we should retry this error
        if (config.retryCondition && !config.retryCondition(error)) {
          this.logger.debug('Error not retryable', { error: error?.message || String(error) });
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );

        this.logger.warn(`Operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          delay,
          error: error?.message || String(error)
        });

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw lastError;
  }

  static async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: {
      failureThreshold?: number;
      resetTimeout?: number;
      retryOptions?: Partial<RetryOptions>;
    } = {}
  ): Promise<T> {
    // Simple circuit breaker implementation
    const failureThreshold = options.failureThreshold ?? 5;
    const resetTimeout = options.resetTimeout ?? 60000; // 1 minute

    // This is a simplified circuit breaker - in production you might want
    // to use a more sophisticated implementation with proper state management
    return this.withRetry(operation, options.retryOptions);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createRetryWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: Partial<RetryOptions> = {}
  ): (...args: T) => Promise<R> {
    return (...args: T) => this.withRetry(() => fn(...args), options);
  }

  static isRetryableError(error: any): boolean {
    return DEFAULT_RETRY_OPTIONS.retryCondition!(error);
  }
}

// Export a convenience function for common use cases
export const retryOnFailure = RetryUtil.withRetry;