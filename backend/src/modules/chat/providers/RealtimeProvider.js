class RealtimeProvider {
  initialize(_server, _authenticate, _handlers) {
    throw new Error('RealtimeProvider.initialize chưa được triển khai');
  }
  async sendToConversation(_conversationId, _event, _data) {
    throw new Error('RealtimeProvider.sendToConversation chưa được triển khai');
  }
  async sendToUser(_userId, _event, _data) {
    throw new Error('RealtimeProvider.sendToUser chưa được triển khai');
  }
  async health() {
    throw new Error('RealtimeProvider.health chưa được triển khai');
  }
}
module.exports = RealtimeProvider;

