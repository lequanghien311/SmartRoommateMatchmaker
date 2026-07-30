const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const RealtimeProvider = require('./RealtimeProvider');

class AzureWebPubSubProvider extends RealtimeProvider {
  constructor(connectionString, hub) {
    super();
    if (!connectionString || !hub) throw new Error('Thiếu cấu hình Azure Web PubSub');
    this.client = new WebPubSubServiceClient(connectionString, hub);
  }
  initialize() {}
  async sendToConversation(conversationId, event, data) {
    await this.client.group(`conversation:${conversationId}`).sendToAll({ event, data }, { contentType: 'application/json' });
  }
  async sendToUser(userId, event, data) {
    await this.client.sendToUser(userId, { event, data }, { contentType: 'application/json' });
  }
  async health() {
    return { status: 'configured', provider: 'azure-web-pubsub' };
  }
}
module.exports = AzureWebPubSubProvider;

