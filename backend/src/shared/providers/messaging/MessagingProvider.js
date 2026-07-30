class MessagingProvider {
  async publish(_event) {
    throw new Error('MessagingProvider.publish chưa được triển khai');
  }

  subscribe(_type, _handler) {
    throw new Error('MessagingProvider.subscribe chưa được triển khai');
  }
}

module.exports = MessagingProvider;

