class HealthService {
  constructor(database, storage, messaging, realtime, cache) {
    this.database = database;
    this.storage = storage;
    this.messaging = messaging;
    this.realtime = realtime;
    this.cache = cache;
  }
  basic() {
    return { status: 'healthy', service: 'smart-roommate-api', time: new Date().toISOString() };
  }
  async databaseCheck() {
    const started = Date.now();
    await this.database.query('SELECT 1');
    return { status: 'healthy', provider: 'postgresql', latencyMs: Date.now() - started };
  }
  storageCheck() { return this.storage.health(); }
  messagingCheck() { return this.messaging.health(); }
  realtimeCheck() { return this.realtime.health(); }
  cacheCheck() { return this.cache.health(); }
}
module.exports = HealthService;

