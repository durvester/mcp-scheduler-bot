import NodeCache from 'node-cache';
import { Logger } from './Logger.js';

export interface CacheConfig {
  stdTTL: number;
  checkperiod: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  stdTTL: 3600, // 1 hour default TTL
  checkperiod: 120 // Check for expired keys every 2 minutes
};

export class CacheManager {
  private cache: NodeCache;
  private readonly version: string = 'v1';
  private logger: Logger;

  constructor(config: Partial<CacheConfig> = {}) {
    this.logger = Logger.create('CacheManager');
    this.cache = new NodeCache({
      ...DEFAULT_CONFIG,
      ...config
    });

    // Set up cache event listeners
    this.cache.on('set', (key, value) => {
      this.logger.debug('Cache entry set', { key, hasValue: !!value });
    });

    this.cache.on('del', (key, value) => {
      this.logger.debug('Cache entry deleted', { key });
    });

    this.cache.on('expired', (key, value) => {
      this.logger.debug('Cache entry expired', { key });
    });
  }

  createKey(toolName: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return `${this.version}:${toolName}:${JSON.stringify(sortedParams)}`;
  }

  async cacheResponse<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      // Check if data exists in cache
      const cached = this.cache.get<T>(key);
      if (cached !== undefined) {
        this.logger.debug('Cache hit', { key });
        return cached;
      }

      // Fetch fresh data
      this.logger.debug('Cache miss, fetching fresh data', { key });
      const result = await fetchFn();
      
      // Store in cache
      this.cache.set(key, result, ttl ?? DEFAULT_CONFIG.stdTTL);
      this.logger.debug('Data cached successfully', { key, ttl: ttl ?? DEFAULT_CONFIG.stdTTL });
      
      return result;
    } catch (error) {
      this.logger.error('Error in cacheResponse', { key }, error as Error);
      
      // Try to return stale data if available
      const staleData = this.cache.get<T>(key);
      if (staleData !== undefined) {
        this.logger.warn('Returning stale data due to fetch error', { key });
        return {
          ...staleData,
          warning: "Data may be stale due to fetch error"
        } as T;
      }
      
      throw error;
    }
  }     

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // This method is now an alias for cacheResponse for backward compatibility
    return this.cacheResponse(key, fetchFn, ttl);
  }

  invalidate(key: string): void {
    this.logger.debug('Invalidating cache entry', { key });
    this.cache.del(key);
  }

  invalidatePattern(pattern: string): number {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    if (matchingKeys.length > 0) {
      this.logger.debug('Invalidating cache entries by pattern', { pattern, count: matchingKeys.length });
      this.cache.del(matchingKeys);
    }
    
    return matchingKeys.length;
  }

  clear(): void {
    this.logger.info('Clearing all cache entries');
    this.cache.flushAll();
  }

  getStats(): { keys: number; hits: number; misses: number; ksize: number; vsize: number } {
    return this.cache.getStats();
  }

  // Create a singleton instance for global use
  private static instance: CacheManager;
  
  public static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }
}

