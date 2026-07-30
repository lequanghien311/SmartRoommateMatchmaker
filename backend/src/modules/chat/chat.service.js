const sanitizeHtml = require('sanitize-html');
const AppError = require('../../shared/errors/AppError');
const { getPagination } = require('../../shared/utils/pagination');

class ChatService {
  constructor(repository, realtime, messaging, notifications) {
    this.repository = repository;
    this.realtime = realtime;
    this.messaging = messaging;
    this.notifications = notifications;
  }
  create(userId, input) {
    if (userId === input.memberId) throw new AppError('Không thể trò chuyện với chính mình', 400);
    return this.repository.create(userId, input.memberId, input.roomId);
  }
  list(userId, query) {
    const { limit, offset } = getPagination(query);
    return this.repository.list(userId, limit, offset);
  }
  async messages(userId, conversationId, query) {
    const { limit, offset } = getPagination(query);
    const rows = await this.repository.messages(userId, conversationId, limit, offset);
    if (!rows) throw new AppError('Bạn không thuộc cuộc trò chuyện này', 403);
    return rows;
  }
  async send(userId, input, correlationId) {
    const content = sanitizeHtml(String(input.content || ''), { allowedTags: [] }).trim();
    if (!content) throw new AppError('Nội dung tin nhắn không được để trống', 422);
    if (content.length > 2000) throw new AppError('Tin nhắn tối đa 2000 ký tự', 422);
    const message = await this.repository.createMessage(userId, input.conversationId, content);
    if (!message) throw new AppError('Bạn không thuộc cuộc trò chuyện này', 403);
    await this.realtime.sendToConversation(input.conversationId, 'message:new', message);
    const members = await this.repository.otherMembers(input.conversationId, userId);
    for (const memberId of members) {
      await this.notifications.create(memberId, 'new_message', 'Tin nhắn mới', content.slice(0, 120), `/chat/${input.conversationId}`);
      await this.realtime.sendToUser(memberId, 'notification:new', { type: 'new_message' });
    }
    const event = this.messaging.createEvent?.('MessageCreated', 'chat', { messageId: message.id, conversationId: input.conversationId }, correlationId);
    if (event) await this.messaging.publish(event);
    return message;
  }
  async markRead(userId, conversationId) {
    if (!(await this.repository.markRead(userId, conversationId))) throw new AppError('Không tìm thấy cuộc trò chuyện', 404);
    await this.realtime.sendToConversation(conversationId, 'message:read', { conversationId, userId });
  }
  async remove(userId, messageId) {
    const message = await this.repository.removeMessage(userId, messageId);
    if (!message) throw new AppError('Không tìm thấy tin nhắn hoặc bạn không phải người gửi', 404);
    await this.realtime.sendToConversation(message.conversation_id, 'message:deleted', { messageId });
  }
}
module.exports = ChatService;

