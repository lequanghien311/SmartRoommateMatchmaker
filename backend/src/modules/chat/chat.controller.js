const { success, noContent } = require('../../shared/responses');
class ChatController {
  constructor(service) { this.service = service; }
  create = async (req, res, next) => { try { success(res, await this.service.create(req.user.id, req.body), 'Tạo cuộc trò chuyện thành công', {}, 201); } catch (error) { next(error); } };
  list = async (req, res, next) => { try { success(res, await this.service.list(req.user.id, req.query)); } catch (error) { next(error); } };
  messages = async (req, res, next) => { try { success(res, await this.service.messages(req.user.id, req.params.id, req.query)); } catch (error) { next(error); } };
  send = async (req, res, next) => { try { success(res, await this.service.send(req.user.id, { ...req.body, conversationId: req.params.id }, req.correlationId), 'Gửi tin nhắn thành công', {}, 201); } catch (error) { next(error); } };
  read = async (req, res, next) => { try { await this.service.markRead(req.user.id, req.params.id); noContent(res); } catch (error) { next(error); } };
  remove = async (req, res, next) => { try { await this.service.remove(req.user.id, req.params.messageId); noContent(res); } catch (error) { next(error); } };
}
module.exports = ChatController;

