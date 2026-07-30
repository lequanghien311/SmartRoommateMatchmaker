const { ServiceBusClient } = require('@azure/service-bus');
const MessagingProvider = require('./MessagingProvider');

class AzureServiceBusProvider extends MessagingProvider {
  constructor(connectionString, queueName) {
    super();
    if (!connectionString || !queueName) throw new Error('Thiếu cấu hình Azure Service Bus');
    this.client = new ServiceBusClient(connectionString);
    this.queueName = queueName;
  }

  async publish(event) {
    const sender = this.client.createSender(this.queueName);
    try {
      await sender.sendMessages({
        body: event,
        contentType: 'application/json',
        correlationId: event.correlationId,
        messageId: event.id,
        subject: event.type,
      });
    } finally {
      await sender.close();
    }
  }

  subscribe(type, handler) {
    const receiver = this.client.createReceiver(this.queueName);
    return receiver.subscribe({
      processMessage: async (message) => {
        if (message.subject === type) await handler(message.body);
      },
      processError: async (error) => console.error(error),
    });
  }

  async health() {
    return { status: 'configured', provider: 'azure-service-bus' };
  }
}

module.exports = AzureServiceBusProvider;

