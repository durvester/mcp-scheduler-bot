import NodeCache from 'node-cache';
import { Logger } from './Logger.js';
const DEFAULT_CONFIG = {
    stdTTL: 3600, // 1 hour default TTL
    checkperiod: 120 // Check for expired keys every 2 minutes
};
export class CacheManager {
    cache;
    version = 'v1';
    logger;
    constructor(config = {}) {
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
    createKey(toolName, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});
        return `${this.version}:${toolName}:${JSON.stringify(sortedParams)}`;
    }
    async cacheResponse(key, fetchFn, ttl) {
        try {
            // Check if data exists in cache
            const cached = this.cache.get(key);
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
        }
        catch (error) {
            this.logger.error('Error in cacheResponse', { key }, error);
            // Try to return stale data if available
            const staleData = this.cache.get(key);
            if (staleData !== undefined) {
                this.logger.warn('Returning stale data due to fetch error', { key });
                return {
                    ...staleData,
                    warning: "Data may be stale due to fetch error"
                };
            }
            throw error;
        }
    }
    async getOrFetch(key, fetchFn, ttl) {
        // This method is now an alias for cacheResponse for backward compatibility
        return this.cacheResponse(key, fetchFn, ttl);
    }
    invalidate(key) {
        this.logger.debug('Invalidating cache entry', { key });
        this.cache.del(key);
    }
    invalidatePattern(pattern) {
        const keys = this.cache.keys();
        const matchingKeys = keys.filter(key => key.includes(pattern));
        if (matchingKeys.length > 0) {
            this.logger.debug('Invalidating cache entries by pattern', { pattern, count: matchingKeys.length });
            this.cache.del(matchingKeys);
        }
        return matchingKeys.length;
    }
    clear() {
        this.logger.info('Clearing all cache entries');
        this.cache.flushAll();
    }
    getStats() {
        return this.cache.getStats();
    }
    // Create a singleton instance for global use
    static instance;
    static getInstance(config) {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager(config);
        }
        return CacheManager.instance;
    }
}
