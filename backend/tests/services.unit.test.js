const RoomsService = require('../src/modules/rooms/rooms.service');
const FavoritesService = require('../src/modules/favorites/favorites.service');
const ChatService = require('../src/modules/chat/chat.service');
const ReportsService = require('../src/modules/reports/reports.service');
const AdminService = require('../src/modules/admin/admin.service');
const MemoryCacheProvider = require('../src/shared/providers/cache/MemoryCacheProvider');
const LocalMessagingProvider = require('../src/shared/providers/messaging/LocalMessagingProvider');
const MediaService = require('../src/modules/media/media.service');
const RoomIntelligenceService = require('../src/modules/rooms/room-intelligence.service');
const { hydrateAzureSearchRooms } = require('../src/modules/cloud/search-hydrator');

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const messaging = new LocalMessagingProvider();

describe('RoomsService', () => {
  test('tìm kiếm trả meta phân trang', async () => {
    const repository = { search: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], total: 13 }) };
    const service = new RoomsService(repository, messaging, new MemoryCacheProvider(), logger);
    const result = await service.search({ page: 2, limit: 5 });
    expect(result.meta).toEqual({ total: 13, page: 2, limit: 5, totalPages: 3 });
  });

  test('không tìm thấy chi tiết phòng trả 404', async () => {
    const repository = { findById: jest.fn().mockResolvedValue(null) };
    const service = new RoomsService(repository, messaging, new MemoryCacheProvider(), logger);
    await expect(service.detail('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  test('chủ trọ không thể duyệt active', async () => {
    const service = new RoomsService({}, messaging, new MemoryCacheProvider(), logger);
    await expect(service.transition('room', { id: 'u', role: 'landlord' }, 'active'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test('gửi duyệt yêu cầu ít nhất một ảnh', async () => {
    const repository = { countImages: jest.fn().mockResolvedValue(0) };
    const service = new RoomsService(repository, messaging, new MemoryCacheProvider(), logger);
    await expect(service.transition('room', { id: 'u', role: 'landlord' }, 'pending'))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  test('gửi duyệt chỉ thành công khi Azure Content Safety xác minh không fallback', async () => {
    const repository = {
      countImages: jest.fn().mockResolvedValue(1),
      findById: jest.fn().mockResolvedValue({ id: 'room', landlord_id: 'u', title: 'Phòng an toàn', description: 'Mô tả phòng sạch sẽ và đầy đủ tiện nghi.' }),
      transition: jest.fn().mockResolvedValue({ id: 'room', status: 'pending' }),
    };
    const contentSafety = { analyzeText: jest.fn().mockResolvedValue({
      allowed: true, severity: 'low', categories: [], provider: 'azure-content-safety', fallbackUsed: false,
    }) };
    const service = new RoomsService(repository, messaging, new MemoryCacheProvider(), logger, contentSafety);
    const result = await service.transition('room', { id: 'u', role: 'landlord' }, 'pending');
    expect(contentSafety.analyzeText).toHaveBeenCalledWith(expect.stringContaining('Mô tả phòng'));
    expect(result.moderation).toMatchObject({ moderationStatus: 'approved', fallbackUsed: false });
  });

  test('Azure Content Safety fallback giữ phòng ở draft moderation_pending', async () => {
    const repository = {
      countImages: jest.fn().mockResolvedValue(1),
      findById: jest.fn().mockResolvedValue({ id: 'room', landlord_id: 'u', title: 'Phòng', description: 'Mô tả đủ dài cho phòng.' }),
      transition: jest.fn(),
    };
    const contentSafety = { analyzeText: jest.fn().mockResolvedValue({
      allowed: true, provider: 'azure-content-safety-fallback', fallbackUsed: true, error: 'timeout',
    }) };
    const service = new RoomsService(repository, messaging, new MemoryCacheProvider(), logger, contentSafety);
    await expect(service.transition('room', { id: 'u', role: 'landlord' }, 'pending'))
      .rejects.toMatchObject({ statusCode: 503, errors: [expect.objectContaining({ moderationStatus: 'moderation_pending' })] });
    expect(repository.transition).not.toHaveBeenCalled();
  });
});

describe('Azure Search hydration', () => {
  test('giữ score và lấy giá mới nhất từ PostgreSQL theo thứ tự Search', async () => {
    const firstId = '11111111-1111-4111-8111-111111111111';
    const secondId = '22222222-2222-4222-8222-222222222222';
    const db = {
      query: jest.fn().mockResolvedValue({
        rows: [
          { id: secondId, title: 'Phòng B', monthly_price: 4200000 },
          { id: firstId, title: 'Phòng A', monthly_price: 3100000 },
        ],
      }),
    };
    const indexed = {
      provider: 'azure-ai-search', source: 'azure-ai-search', fallbackUsed: false,
      results: [
        { id: firstId, price: 999, '@search.score': 3.5 },
        { id: secondId, price: 888, '@search.score': 2.1 },
      ],
    };

    const result = await hydrateAzureSearchRooms(db, indexed);

    expect(result.results.map((room) => room.id)).toEqual([firstId, secondId]);
    expect(result.results[0]).toMatchObject({ monthly_price: 3100000, '@search.score': 3.5 });
    expect(result.results[0].price).toBeUndefined();
    expect(result).toMatchObject({
      provider: 'azure-ai-search', fallbackUsed: false, hydratedFrom: 'postgresql', resultCount: 2,
    });
  });

  test('không biến fallback thành kết quả Azure', async () => {
    const fallback = { provider: 'local-search', fallbackUsed: true, results: [{ id: 'demo' }] };
    const db = { query: jest.fn() };
    await expect(hydrateAzureSearchRooms(db, fallback)).resolves.toBe(fallback);
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('RoomIntelligenceService', () => {
  const room = { id: 'room', description: 'Mô tả production hiện tại của phòng.' };
  const repository = { findById: jest.fn().mockResolvedValue(room) };

  test('Translator nhận đúng mô tả hiện tại và không fallback', async () => {
    const translator = { translateText: jest.fn().mockResolvedValue({
      translatedText: 'Current room description', provider: 'azure-translator', fallbackUsed: false,
    }) };
    const service = new RoomIntelligenceService(repository, translator, {}, {}, {});
    const result = await service.translate('room', 'en');
    expect(translator.translateText).toHaveBeenCalledWith(room.description, 'en');
    expect(result).toMatchObject({ originalText: room.description, provider: 'azure-translator', fallbackUsed: false });
  });

  test('AI Language trả key phrases Azure cho đúng mô tả phòng', async () => {
    const language = { analyzeText: jest.fn().mockResolvedValue({
      sentiment: 'positive', keyPhrases: ['phòng sạch'], provider: 'azure-ai-language', fallbackUsed: false,
    }) };
    const service = new RoomIntelligenceService(repository, {}, {}, {}, language);
    const result = await service.analyzeLanguage('room');
    expect(language.analyzeText).toHaveBeenCalledWith(room.description);
    expect(result.keyPhrases).toEqual(['phòng sạch']);
  });

  test('Speech fallback bị từ chối thay vì phát audio giả', async () => {
    const speech = { synthesizeAudio: jest.fn().mockResolvedValue({ provider: 'azure-speech-fallback', fallbackUsed: true }) };
    const service = new RoomIntelligenceService(repository, {}, speech, {}, {});
    await expect(service.synthesize('room')).rejects.toMatchObject({ statusCode: 503 });
  });
});

describe('MediaService', () => {
  test('upload Blob tự động trả bằng chứng Azure AI Vision', async () => {
    const repository = {
      roomOwnedBy: jest.fn().mockResolvedValue(true),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'image-1', url: 'https://account.blob.core.windows.net/room-images/image.jpg' }),
    };
    const storage = {
      save: jest.fn().mockResolvedValue({ key: 'rooms/r/image.jpg', url: 'https://account.blob.core.windows.net/room-images/image.jpg' }),
      delete: jest.fn(),
    };
    const vision = {
      analyzeImageBuffer: jest.fn().mockResolvedValue({
        provider: 'azure-ai-vision', fallbackUsed: false, caption: 'a room', tags: ['room'],
      }),
    };
    const file = { buffer: Buffer.from('image'), mimetype: 'image/jpeg', size: 5, originalname: 'room.jpg' };
    const result = await new MediaService(repository, storage, vision).upload('room', { id: 'owner' }, [file]);
    expect(result[0].vision).toMatchObject({ provider: 'azure-ai-vision', fallbackUsed: false });
    expect(result[0]).toMatchObject({ storageProvider: 'azure-blob', storageFallbackUsed: false });
    expect(vision.analyzeImageBuffer).toHaveBeenCalledWith(file.buffer, 'image/jpeg', 'rooms/r/image.jpg');
  });

  test('stream ảnh từ Blob qua backend với provider thật', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue({
        id: 'image-1', storage_key: 'rooms/r/image.jpg', mime_type: 'image/jpeg',
        url: 'https://account.blob.core.windows.net/room-images/rooms/r/image.jpg',
      }),
    };
    const storage = { readBuffer: jest.fn().mockResolvedValue(Buffer.from('image')) };
    const result = await new MediaService(repository, storage).content('image-1');
    expect(result).toMatchObject({ mimeType: 'image/jpeg', provider: 'azure-blob' });
    expect(result.buffer).toEqual(Buffer.from('image'));
  });

  test('không cho người ngoài gọi lại Vision trên ảnh phòng', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue({ id: 'image-1', room_id: 'room' }),
      roomOwnedBy: jest.fn().mockResolvedValue(false),
    };
    const service = new MediaService(repository, {}, { analyzeImageBuffer: jest.fn() });
    await expect(service.analyze('image-1', { id: 'outsider' })).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('FavoritesService', () => {
  test('thêm yêu thích thành công', async () => {
    const repository = { add: jest.fn().mockResolvedValue({ id: 'favorite' }) };
    const result = await new FavoritesService(repository, messaging).add('user', 'room');
    expect(result.id).toBe('favorite');
  });

  test('không lưu trùng phòng', async () => {
    const repository = { add: jest.fn().mockResolvedValue(null) };
    await expect(new FavoritesService(repository, messaging).add('user', 'room'))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  test('xóa mục không tồn tại trả 404', async () => {
    const repository = { remove: jest.fn().mockResolvedValue(null) };
    await expect(new FavoritesService(repository, messaging).remove('user', 'room'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ChatService', () => {
  const realtime = { sendToConversation: jest.fn(), sendToUser: jest.fn() };
  const notifications = { create: jest.fn() };

  test('không tạo conversation với chính mình', async () => {
    const service = new ChatService({}, realtime, messaging, notifications);
    expect(() => service.create('same', { memberId: 'same' })).toThrow('Không thể');
  });

  test('không gửi nội dung rỗng', async () => {
    const service = new ChatService({}, realtime, messaging, notifications);
    await expect(service.send('user', { conversationId: 'c', content: '   ' }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  test('người ngoài không gửi được tin', async () => {
    const repository = { createMessage: jest.fn().mockResolvedValue(null) };
    const service = new ChatService(repository, realtime, messaging, notifications);
    await expect(service.send('outsider', { conversationId: 'c', content: 'Xin chào' }))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  test('gửi tin phát realtime và notification', async () => {
    const repository = {
      createMessage: jest.fn().mockResolvedValue({ id: 'm', conversation_id: 'c' }),
      otherMembers: jest.fn().mockResolvedValue(['other']),
    };
    const service = new ChatService(repository, realtime, messaging, notifications);
    await service.send('user', { conversationId: 'c', content: '<b>Xin chào</b>' });
    expect(repository.createMessage).toHaveBeenCalledWith('user', 'c', 'Xin chào');
    expect(realtime.sendToConversation).toHaveBeenCalled();
    expect(notifications.create).toHaveBeenCalled();
  });
});

describe('ReportsService', () => {
  test('chống báo cáo trùng trong thời gian ngắn', async () => {
    const repository = { duplicate: jest.fn().mockResolvedValue(true) };
    await expect(new ReportsService(repository, messaging).create('u', { roomId: 'r' }))
      .rejects.toMatchObject({ statusCode: 429 });
  });

  test('phòng không tồn tại trả 404', async () => {
    const repository = { duplicate: jest.fn().mockResolvedValue(false), create: jest.fn().mockResolvedValue(null) };
    await expect(new ReportsService(repository, messaging).create('u', { roomId: 'r' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('AdminService', () => {
  const notifications = { create: jest.fn() };

  test('không cho trạng thái user bất kỳ', async () => {
    await expect(new AdminService({}, messaging, notifications).setUserStatus('a', 'u', 'deleted'))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  test('admin duyệt phòng và gửi thông báo', async () => {
    const repository = { moderateRoom: jest.fn().mockResolvedValue({ id: 'r', landlord_id: 'l', title: 'Room' }) };
    const service = new AdminService(repository, messaging, notifications);
    const room = await service.moderateRoom('a', 'r', { status: 'active' });
    expect(room.id).toBe('r');
    expect(notifications.create).toHaveBeenCalled();
  });

  test('admin xử lý báo cáo không tồn tại trả 404', async () => {
    const repository = { resolveReport: jest.fn().mockResolvedValue(null) };
    await expect(new AdminService(repository, messaging, notifications).resolveReport('a', 'r', { status: 'resolved' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('MemoryCacheProvider', () => {
  test('lưu và đọc theo TTL', async () => {
    const cache = new MemoryCacheProvider();
    await cache.set('amenities:active', [1], 10);
    expect(await cache.get('amenities:active')).toEqual([1]);
  });

  test('xóa theo prefix', async () => {
    const cache = new MemoryCacheProvider();
    await cache.set('rooms:popular', [1], 10);
    await cache.delete('rooms:');
    expect(await cache.get('rooms:popular')).toBeNull();
  });
});
