class CacheProvider {
  async get(_key) {
    throw new Error('CacheProvider.get chưa được triển khai');
  }

  async set(_key, _value, _ttlSeconds) {
    throw new Error('CacheProvider.set chưa được triển khai');
  }

  async delete(_pattern) {
    throw new Error('CacheProvider.delete chưa được triển khai');
  }
}

module.exports = CacheProvider;

