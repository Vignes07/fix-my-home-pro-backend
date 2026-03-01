/**
 * In-memory API Response Cache Middleware
 * Caches JSON responses from the backend to reduce database (Supabase) hits.
 */

const cache = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const cacheMiddleware = (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        const isExpired = Date.now() - cachedResponse.timestamp > DEFAULT_TTL_MS;
        if (!isExpired) {
            // console.log(`[Cache Hit] ${key}`);
            return res.json(cachedResponse.data);
        }
        // console.log(`[Cache Expired] ${key}`);
        cache.delete(key);
    }

    // console.log(`[Cache Miss] ${key}`);

    // Intercept res.json to simultaneously cache the response
    const originalJson = res.json;
    res.json = function (body) {
        // Only cache successful requests
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success !== false) {
            cache.set(key, {
                data: body,
                timestamp: Date.now()
            });
        }

        // Call the original res.json
        return originalJson.call(this, body);
    };

    next();
};

/**
 * Utility to clear the cache manually if needed (e.g. after a mutation)
 */
export const clearCache = (prefix = '') => {
    if (!prefix) {
        cache.clear();
        return;
    }

    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
};
