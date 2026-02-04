/**
 * Redis Service
 * Handles verification codes, caching, and rate limiting
 * Replaces in-memory storage for production scalability
 */

const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.useRedis = process.env.REDIS_URL ? true : false;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (!this.useRedis) {
      console.log('⚠️  Redis not configured - using in-memory fallback');
      this.inMemoryStore = new Map();
      return;
    }

    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('🔗 Redis connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connected and ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Redis connection error:', error.message);
      console.log('⚠️  Falling back to in-memory storage');
      this.useRedis = false;
      this.inMemoryStore = new Map();
    }
  }

  /**
   * Store verification code
   * @param {string} phoneNumber - Phone number
   * @param {string} code - Verification code
   * @param {number} expirySeconds - Expiry time in seconds (default: 600 = 10 minutes)
   */
  async setVerificationCode(phoneNumber, code, expirySeconds = 600) {
    const key = `verification:${phoneNumber}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        await this.client.setEx(key, expirySeconds, code);
        return true;
      } catch (error) {
        console.error('Redis setVerificationCode error:', error);
        return this._fallbackSet(key, code, expirySeconds);
      }
    } else {
      return this._fallbackSet(key, code, expirySeconds);
    }
  }

  /**
   * Get verification code
   * @param {string} phoneNumber - Phone number
   * @returns {string|null} - Verification code or null
   */
  async getVerificationCode(phoneNumber) {
    const key = `verification:${phoneNumber}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        return await this.client.get(key);
      } catch (error) {
        console.error('Redis getVerificationCode error:', error);
        return this._fallbackGet(key);
      }
    } else {
      return this._fallbackGet(key);
    }
  }

  /**
   * Delete verification code
   * @param {string} phoneNumber - Phone number
   */
  async deleteVerificationCode(phoneNumber) {
    const key = `verification:${phoneNumber}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        await this.client.del(key);
        return true;
      } catch (error) {
        console.error('Redis deleteVerificationCode error:', error);
        return this._fallbackDelete(key);
      }
    } else {
      return this._fallbackDelete(key);
    }
  }

  /**
   * Cache booking lookup
   * @param {string} confirmationCode - Booking confirmation code
   * @param {object} bookingData - Booking data to cache
   * @param {number} expirySeconds - Cache expiry (default: 300 = 5 minutes)
   */
  async cacheBooking(confirmationCode, bookingData, expirySeconds = 300) {
    const key = `booking:${confirmationCode}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        await this.client.setEx(key, expirySeconds, JSON.stringify(bookingData));
        return true;
      } catch (error) {
        console.error('Redis cacheBooking error:', error);
        return false;
      }
    }
    return false; // Don't cache in memory for bookings
  }

  /**
   * Get cached booking
   * @param {string} confirmationCode - Booking confirmation code
   * @returns {object|null} - Cached booking data or null
   */
  async getCachedBooking(confirmationCode) {
    const key = `booking:${confirmationCode}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Redis getCachedBooking error:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Increment rate limit counter
   * @param {string} key - Rate limit key (e.g., IP address, user ID)
   * @param {number} windowSeconds - Time window in seconds
   * @returns {number} - Current count
   */
  async incrementRateLimit(key, windowSeconds = 900) {
    const rateLimitKey = `ratelimit:${key}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        const count = await this.client.incr(rateLimitKey);
        if (count === 1) {
          await this.client.expire(rateLimitKey, windowSeconds);
        }
        return count;
      } catch (error) {
        console.error('Redis incrementRateLimit error:', error);
        return 0;
      }
    }
    return 0; // Don't enforce rate limits without Redis
  }

  /**
   * Get rate limit count
   * @param {string} key - Rate limit key
   * @returns {number} - Current count
   */
  async getRateLimitCount(key) {
    const rateLimitKey = `ratelimit:${key}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        const count = await this.client.get(rateLimitKey);
        return count ? parseInt(count) : 0;
      } catch (error) {
        console.error('Redis getRateLimitCount error:', error);
        return 0;
      }
    }
    return 0;
  }

  /**
   * Store live job status (for pub/sub later)
   * @param {number} bookingId - Booking ID
   * @param {string} status - Job status
   * @param {object} metadata - Additional metadata
   */
  async setJobStatus(bookingId, status, metadata = {}) {
    const key = `job:${bookingId}`;
    const data = {
      status,
      ...metadata,
      updatedAt: new Date().toISOString()
    };
    
    if (this.useRedis && this.isConnected) {
      try {
        await this.client.setEx(key, 3600, JSON.stringify(data)); // 1 hour expiry
        // Future: publish to pub/sub channel here
        return true;
      } catch (error) {
        console.error('Redis setJobStatus error:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get live job status
   * @param {number} bookingId - Booking ID
   * @returns {object|null} - Job status data
   */
  async getJobStatus(bookingId) {
    const key = `job:${bookingId}`;
    
    if (this.useRedis && this.isConnected) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Redis getJobStatus error:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Clear all verification codes (admin utility)
   */
  async clearAllVerificationCodes() {
    if (this.useRedis && this.isConnected) {
      try {
        const keys = await this.client.keys('verification:*');
        if (keys.length > 0) {
          await this.client.del(keys);
        }
        return keys.length;
      } catch (error) {
        console.error('Redis clearAllVerificationCodes error:', error);
        return 0;
      }
    } else {
      const count = Array.from(this.inMemoryStore.keys())
        .filter(k => k.startsWith('verification:'))
        .length;
      Array.from(this.inMemoryStore.keys())
        .filter(k => k.startsWith('verification:'))
        .forEach(k => this.inMemoryStore.delete(k));
      return count;
    }
  }

  /**
   * Disconnect Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('🔌 Redis disconnected');
    }
  }

  // --- In-memory fallback methods ---

  _fallbackSet(key, value, expirySeconds) {
    this.inMemoryStore.set(key, {
      value,
      expiresAt: Date.now() + (expirySeconds * 1000)
    });
    
    // Clean up expired entries
    setTimeout(() => {
      const entry = this.inMemoryStore.get(key);
      if (entry && entry.expiresAt <= Date.now()) {
        this.inMemoryStore.delete(key);
      }
    }, expirySeconds * 1000);
    
    return true;
  }

  _fallbackGet(key) {
    const entry = this.inMemoryStore.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt <= Date.now()) {
      this.inMemoryStore.delete(key);
      return null;
    }
    
    return entry.value;
  }

  _fallbackDelete(key) {
    this.inMemoryStore.delete(key);
    return true;
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.useRedis) {
      return {
        status: 'fallback',
        message: 'Using in-memory storage',
        entries: this.inMemoryStore.size
      };
    }

    if (this.isConnected) {
      try {
        await this.client.ping();
        return {
          status: 'healthy',
          message: 'Redis connected'
        };
      } catch (error) {
        return {
          status: 'error',
          message: error.message
        };
      }
    }

    return {
      status: 'disconnected',
      message: 'Redis not connected'
    };
  }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;