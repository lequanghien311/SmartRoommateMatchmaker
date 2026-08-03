jest.mock('@azure/web-pubsub', () => ({
  WebPubSubServiceClient: jest.fn(),
}));

const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const AzureWebPubSubProvider = require('../src/modules/chat/providers/AzureWebPubSubProvider');

describe('AzureWebPubSubProvider', () => {
  let getClientAccessToken;

  beforeEach(() => {
    getClientAccessToken = jest.fn().mockResolvedValue({ url: 'wss://example.webpubsub.azure.com/client/hubs/smart_roommate' });
    WebPubSubServiceClient.mockReset();
    WebPubSubServiceClient.mockImplementation(() => ({ getClientAccessToken }));
  });

  test('dùng hub mặc định smart_roommate', () => {
    new AzureWebPubSubProvider('Endpoint=https://example.webpubsub.azure.com;AccessKey=redacted');
    expect(WebPubSubServiceClient).toHaveBeenCalledWith(
      'Endpoint=https://example.webpubsub.azure.com;AccessKey=redacted',
      'smart_roommate',
    );
  });

  test('từ chối hub chứa dấu gạch ngang', () => {
    expect(() => new AzureWebPubSubProvider('connection', 'smart-roommate')).toThrow('hub name is invalid');
  });

  test('token chỉ cấp group conversation và hết hạn sau 10 phút', async () => {
    const provider = new AzureWebPubSubProvider('connection', 'smart_roommate');
    await provider.getClientAccessToken('user-1', 'conversation-1');
    expect(getClientAccessToken).toHaveBeenCalledWith({
      userId: 'user-1',
      groups: ['conversation:conversation-1'],
      expirationTimeInMinutes: 10,
    });
  });

  test('health chỉ báo CONFIGURED', async () => {
    const provider = new AzureWebPubSubProvider('connection', 'smart_roommate');
    await expect(provider.health()).resolves.toEqual({
      status: 'CONFIGURED',
      provider: 'azure-web-pubsub',
      fallbackUsed: false,
    });
  });
});
