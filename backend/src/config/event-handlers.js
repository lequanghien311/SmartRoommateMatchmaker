const { pool } = require('../database/connection');
const { messaging, logger } = require('../shared/providers');
const { service: notifications } = require('../modules/notifications/notifications.routes');

function safeHandler(name, handler) {
  return async (event) => {
    try {
      await handler(event);
    } catch (error) {
      logger.error('event_handler_failed', {
        eventType: name,
        eventId: event.id,
        correlationId: event.correlationId,
        message: error.message,
      });
    }
  };
}

function registerEventHandlers() {
  if (typeof messaging.createEvent !== 'function') return;
  messaging.subscribe(
    'RoomFavorited',
    safeHandler('RoomFavorited', async (event) => {
      const result = await pool.query('SELECT landlord_id,title FROM rooms WHERE id=$1', [
        event.data.roomId,
      ]);
      const room = result.rows[0];
      if (room && room.landlord_id !== event.data.userId) {
        await notifications.create(
          room.landlord_id,
          'room_interest',
          'Có người quan tâm phòng',
          `Tin “${room.title}” vừa được lưu vào danh sách yêu thích.`,
          `/rooms/${event.data.roomId}`,
        );
      }
    }),
  );
  messaging.subscribe(
    'MatchCalculated',
    safeHandler('MatchCalculated', async (event) => {
      if (event.data.count > 0) {
        await notifications.create(
          event.data.userId,
          'match_found',
          'Đã tìm thấy ứng viên ở ghép',
          `Có ${event.data.count} hồ sơ đang tìm kiếm phù hợp với bạn.`,
          '/matches',
        );
      }
    }),
  );
}

module.exports = registerEventHandlers;

