const { success } = require('../../shared/responses');

class RoomIntelligenceController {
  constructor(service) {
    this.service = service;
  }

  translate = async (req, res, next) => {
    try {
      success(res, await this.service.translate(req.params.id, req.query.targetLanguage || 'en'));
    } catch (error) {
      next(error);
    }
  };

  language = async (req, res, next) => {
    try {
      success(res, await this.service.analyzeLanguage(req.params.id));
    } catch (error) {
      next(error);
    }
  };

  speech = async (req, res, next) => {
    try {
      const result = await this.service.synthesize(req.params.id);
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': result.audio.length,
        'X-Azure-Provider': result.provider,
        'X-Azure-Fallback-Used': 'false',
        'Cache-Control': 'private, max-age=300',
      });
      res.status(200).send(result.audio);
    } catch (error) {
      next(error);
    }
  };

  geocode = async (req, res, next) => {
    try {
      success(res, await this.service.geocode(req.body));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = RoomIntelligenceController;
