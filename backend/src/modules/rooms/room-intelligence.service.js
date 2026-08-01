const AppError = require('../../shared/errors/AppError');

class RoomIntelligenceService {
  constructor(repository, translator, speech, maps, language) {
    this.repository = repository;
    this.translator = translator;
    this.speech = speech;
    this.maps = maps;
    this.language = language;
  }

  async room(id) {
    const room = await this.repository.findById(id);
    if (!room) throw new AppError('Không tìm thấy phòng', 404);
    return room;
  }

  async translate(id, targetLanguage = 'en') {
    const room = await this.room(id);
    const result = await this.translator.translateText(room.description, targetLanguage);
    if (result.fallbackUsed || result.provider !== 'azure-translator') {
      throw new AppError('Azure Translator tạm thời không khả dụng', 503, [
        { field: 'translator', provider: result.provider, fallbackUsed: true },
      ]);
    }
    return { roomId: room.id, originalText: room.description, ...result };
  }

  async analyzeLanguage(id) {
    const room = await this.room(id);
    const result = await this.language.analyzeText(room.description);
    if (result.fallbackUsed || result.provider !== 'azure-ai-language') {
      throw new AppError('Azure AI Language tạm thời không khả dụng', 503, [
        { field: 'language', provider: result.provider, fallbackUsed: true },
      ]);
    }
    return { roomId: room.id, analyzedText: room.description, ...result };
  }

  async synthesize(id) {
    const room = await this.room(id);
    const result = await this.speech.synthesizeAudio(room.description);
    if (result.fallbackUsed || result.provider !== 'azure-ai-speech' || !Buffer.isBuffer(result.audio)) {
      throw new AppError('Azure AI Speech tạm thời không khả dụng', 503, [
        { field: 'speech', provider: result.provider, fallbackUsed: true },
      ]);
    }
    return { roomId: room.id, ...result };
  }

  async geocode(input) {
    const query = [input.address, input.ward, input.district, input.province].filter(Boolean).join(', ');
    if (!query.trim()) throw new AppError('Địa chỉ không được để trống', 422);
    const result = await this.maps.geocode(query);
    if (result.fallbackUsed || result.provider !== 'azure-maps') {
      throw new AppError('Azure Maps tạm thời không khả dụng', 503, [
        { field: 'maps', provider: result.provider, fallbackUsed: true },
      ]);
    }
    return { inputAddress: query, ...result };
  }
}

module.exports = RoomIntelligenceService;
