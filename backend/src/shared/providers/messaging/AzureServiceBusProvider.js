const { ServiceBusClient } = require('@azure/service-bus');
const MessagingProvider = require('./MessagingProvider');

class AzureServiceBusProvider extends MessagingProvider {
  constructor(connectionString, queueName) {
    super();
    this.connectionString = connectionString || process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
    this.queueName = queueName || process.env.AZURE_SERVICE_BUS_QUEUE || 'smart-roommate-events';
  }

  getClient() {
    if (!this.connectionString) return null;
    return new ServiceBusClient(this.connectionString);
  }

  async publish(event) {
    const client = this.getClient();
    if (!client) {
      return { status: 'fallback', provider: 'local-messaging', fallbackUsed: true };
    }
    const sender = client.createSender(this.queueName);
    try {
      const messageId = event.id || `msg-${Date.now()}`;
      await sender.sendMessages({
        body: event,
        contentType: 'application/json',
        correlationId: event.correlationId || `corr-${Date.now()}`,
        messageId,
        subject: event.type || 'RoomCreatedEvent',
      });
      return {
        status: 'published',
        provider: 'azure-service-bus',
        queueName: this.queueName,
        messageId,
        fallbackUsed: false,
      };
    } finally {
      await sender.close();
      await client.close();
    }
  }

  async publishAndVerifyTestMessage() {
    if (!this.connectionString) {
      return {
        provider: 'local-messaging-fallback',
        queueName: this.queueName,
        sent: false,
        received: false,
        completed: false,
        fallbackUsed: true,
        error: 'AZURE_SERVICE_BUS_CONNECTION_STRING missing',
        checkedAt: new Date().toISOString(),
      };
    }

    const client = new ServiceBusClient(this.connectionString);
    const sender = client.createSender(this.queueName);
    const receiver = client.createReceiver(this.queueName, { receiveMode: 'peekLock' });

    const nonce = Math.random().toString(36).substring(2, 9);
    const testMessageId = `test-msg-${Date.now()}-${nonce}`;
    const testCorrelationId = `test-corr-${Date.now()}-${nonce}`;

    try {
      // 1. Send test message
      await sender.sendMessages({
        body: {
          event: 'RoomCreatedEvent',
          roomId: 'demo-room-001',
          timestamp: new Date().toISOString(),
        },
        contentType: 'application/json',
        messageId: testMessageId,
        correlationId: testCorrelationId,
        subject: 'RoomCreatedEvent',
      });

      // 2. Receive & complete matching test message (up to 5 retries / 10s total deadline)
      let receivedMatching = false;
      let attempts = 0;
      const startTime = Date.now();

      while (attempts < 5 && (Date.now() - startTime) < 10000 && !receivedMatching) {
        attempts++;
        const messages = await receiver.receiveMessages(1, { maxWaitTimeInMs: 2000 });
        if (!messages || messages.length === 0) continue;

        const msg = messages[0];
        if (msg.messageId === testMessageId && msg.correlationId === testCorrelationId) {
          await receiver.completeMessage(msg);
          receivedMatching = true;
        } else {
          // Non-matching message: ABANDON immediately, DO NOT COMPLETE
          await receiver.abandonMessage(msg);
        }
      }

      if (!receivedMatching) {
        throw new Error('Test message was sent but matching test message was not received within deadline');
      }

      return {
        provider: 'azure-service-bus',
        queueName: this.queueName,
        messageId: testMessageId,
        correlationId: testCorrelationId,
        sent: true,
        received: true,
        completed: true,
        fallbackUsed: false,
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        provider: 'azure-service-bus-fallback',
        queueName: this.queueName,
        sent: false,
        received: false,
        completed: false,
        fallbackUsed: true,
        error: err.message,
        checkedAt: new Date().toISOString(),
      };
    } finally {
      try { await sender.close(); } catch (_) { /* ignore */ }
      try { await receiver.close(); } catch (_) { /* ignore */ }
      try { await client.close(); } catch (_) { /* ignore */ }
    }
  }

  async health() {
    return {
      status: 'configured',
      provider: 'azure-service-bus',
    };
  }
}

module.exports = AzureServiceBusProvider;
