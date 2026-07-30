const CacheProvider = require('./CacheProvider');

class MemoryCacheProvider extends CacheProvider {
  constructor() {
    super();
    this.items = new Map();
  }

  async get(key) {
    const item = this.items.get(key);
    if (!item) return null;
    if (item.expiresAt <= Date.now()) {
      this.items.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = 300) {
    this.items.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async delete(pattern) {
    for (const key of this.items.keys()) {
      if (key.startsWith(pattern)) this.items.delete(key);
    }
  }

  async health() {
    return { status: 'healthy', provider: 'memory', entries: this.items.size };
  }
}

module.exports = MemoryCacheProvider;

