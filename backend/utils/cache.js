const Redis = require('ioredis');

// Redis configuration
// Support both REDIS_URL and individual config
let redis;

if (process.env.REDIS_URL) {
  // Use connection string (URL format)
  redis = new Redis(process.env.REDIS_URL, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false
  });
} else if (process.env.REDIS_HOST && process.env.REDIS_PASSWORD) {
  // Use individual config with explicit host/port/password
  const redisConfig = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => {
      if (times > 10) {
        console.log('⚠ Redis: Max retries reached, giving up');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 3000);
      console.log(`⟳ Redis: Retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false,
    connectTimeout: 10000,
    // Add keepAlive for better connection stability
    keepAlive: 30000
  };
  
  console.log(`🔧 Redis: Attempting connection to ${redisConfig.host}:${redisConfig.port}`);
  redis = new Redis(redisConfig);
} else {
  // Default local Redis (no auth)
  redis = new Redis({
    host: 'localhost',
    port: 6379,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    lazyConnect: false
  });
}

// Event handlers
redis.on('connect', () => {
  console.log('✓ Redis: Connected successfully');
});

redis.on('error', (err) => {
  if (err && err.message) {
    console.error('✗ Redis error:', err.message);
  }
  // Don't log empty errors to reduce noise
});

redis.on('ready', () => {
  console.log('✓ Redis: Ready to accept commands');
});

redis.on('reconnecting', () => {
  console.log('⟳ Redis: Reconnecting...');
});

/**
 * Redis Cache Wrapper
 */
class RedisCache {
  constructor(client) {
    this.client = client;
    this.prefix = 'nesavent:';
  }

  /**
   * Build cache key with prefix
   */
  _buildKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key, value, ttl = 300) {
    try {
      const cacheKey = this._buildKey(key);
      const serialized = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.client.setex(cacheKey, ttl, serialized);
      } else {
        await this.client.set(cacheKey, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const cacheKey = this._buildKey(key);
      const data = await this.client.get(cacheKey);
      
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  }

  /**
   * Check if key exists
   */
  async has(key) {
    try {
      const cacheKey = this._buildKey(key);
      const exists = await this.client.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      console.error('Redis HAS error:', error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key) {
    try {
      const cacheKey = this._buildKey(key);
      await this.client.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error.message);
      return false;
    }
  }

  /**
   * Clear all cache with prefix
   */
  async clear() {
    try {
      const pattern = `${this.prefix}*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      
      return keys.length;
    } catch (error) {
      console.error('Redis CLEAR error:', error.message);
      return 0;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern) {
    try {
      const searchPattern = `${this.prefix}${pattern}*`;
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      
      return keys.length;
    } catch (error) {
      console.error('Redis INVALIDATE error:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const info = await this.client.info('stats');
      const keys = await this.client.keys(`${this.prefix}*`);
      const memory = await this.client.info('memory');
      
      return {
        keys: keys.length,
        keysList: keys.slice(0, 10), // Show first 10 keys
        connected: this.client.status === 'ready',
        stats: this._parseRedisInfo(info),
        memory: this._parseRedisInfo(memory)
      };
    } catch (error) {
      console.error('Redis STATS error:', error.message);
      return {
        keys: 0,
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Redis INFO command output
   */
  _parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });
    
    return result;
  }

  /**
   * Increment counter (for rate limiting, analytics)
   */
  async increment(key, ttl = 60) {
    try {
      const cacheKey = this._buildKey(key);
      const value = await this.client.incr(cacheKey);
      
      if (value === 1 && ttl > 0) {
        await this.client.expire(cacheKey, ttl);
      }
      
      return value;
    } catch (error) {
      console.error('Redis INCREMENT error:', error.message);
      return 0;
    }
  }

  /**
   * Set with NX (only if not exists)
   */
  async setNX(key, value, ttl = 300) {
    try {
      const cacheKey = this._buildKey(key);
      const serialized = JSON.stringify(value);
      const result = await this.client.set(cacheKey, serialized, 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      console.error('Redis SETNX error:', error.message);
      return false;
    }
  }

  /**
   * Get Redis client (for advanced operations)
   */
  getClient() {
    return this.client;
  }
}

// Create and export cache instance
const cache = new RedisCache(redis);

module.exports = cache;
module.exports.redis = redis;
