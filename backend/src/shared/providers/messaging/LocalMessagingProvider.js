const EventEmitter = require('events');
const { randomUUID } = require('crypto');
const MessagingProvider = require('./MessagingProvider');

class LocalMessagingProvider extends MessagingProvider {
  constructor() {
    super();
    this.emitter = new EventEmitter();
  }

  createEvent(type, source, data, correlationId) {
    return {
      id: randomUUID(),
      type,
      source,
      time: new Date().toISOString(),
      data,
      correlationId: correlationId || randomUUID(),
    };
  }

  async publish(event) {
    this.emitter.emit(event.type, event);
  }

  subscribe(type, handler) {
    this.emitter.on(type, handler);
  }

  async health() {
    return { status: 'healthy', provider: 'local-event-emitter' };
  }
}

module.exports = LocalMessagingProvider;

