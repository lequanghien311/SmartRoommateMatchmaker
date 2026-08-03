const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const RealtimeProvider = require('./RealtimeProvider');

class AzureWebPubSubProvider extends RealtimeProvider {
  constructor(connectionString, hub = 'smart_roommate') {
    super();
    if (!connectionString || !hub) throw new Error('Thiếu cấu hình Azure Web PubSub');
    if (!/^[A-Za-z][A-Za-z0-9_.,[\]()]{0,127}$/.test(hub)) {
      throw new Error('Azure Web PubSub hub name is invalid');
    }
    this.hub = hub;
    this.client = new WebPubSubServiceClient(connectionString, hub);
  }
  initialize() {}
  async sendToConversation(conversationId, event, data) {
    await this.client.group(`conversation:${conversationId}`).sendToAll({ event, data }, { contentType: 'application/json' });
  }
  async sendToUser(userId, event, data) {
    await this.client.sendToUser(userId, { event, data }, { contentType: 'application/json' });
  }
  async getClientAccessToken(userId, conversationId) {
    return this.client.getClientAccessToken({
      userId: String(userId),
      groups: [`conversation:${conversationId}`],
      expirationTimeInMinutes: 10,
    });
  }
  async health() {
    return { status: 'CONFIGURED', provider: 'azure-web-pubsub', fallbackUsed: false };
  }
}
module.exports = AzureWebPubSubProvider;

