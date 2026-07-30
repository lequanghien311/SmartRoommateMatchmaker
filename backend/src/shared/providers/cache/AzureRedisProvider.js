const CacheProvider = require('./CacheProvider');

class AzureRedisProvider extends CacheProvider {
  constructor(connectionString) {
    super();
    if (!connectionString) throw new Error('Thiếu AZURE_REDIS_CONNECTION_STRING');
    const Redis = require('ioredis');
    this.client = new Redis(connectionString, { lazyConnect: true });
  }

  async get(key) {
    const raw = await this.client.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async set(key, value, ttlSeconds = 300) {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(pattern) {
    const keys = await this.client.keys(`${pattern}*`);
    if (keys.length) await this.client.del(...keys);
  }

  async health() {
    if (this.client.status === 'wait') await this.client.connect();
    await this.client.ping();
    return { status: 'healthy', provider: 'azure-redis' };
  }
}

module.exports = AzureRedisProvider;

