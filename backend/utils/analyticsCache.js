// Simple in-memory cache for the /analytics/overall response, keyed per user.
const cache = new Map();
const TTL_MS = 10 * 60 * 1000; // 10-minute safety-net expiry

const getCachedAnalytics = (userId) => {
    const key = String(userId);
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
};

const setCachedAnalytics = (userId, data) => {
    const key = String(userId);
    cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
};

const invalidateAnalyticsCache = (userId) => {
    cache.delete(String(userId));
};

module.exports = { getCachedAnalytics, setCachedAnalytics, invalidateAnalyticsCache };