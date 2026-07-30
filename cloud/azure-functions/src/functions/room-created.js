const { app } = require('@azure/functions');

app.serviceBusQueue('roomCreated', {
  connection: 'AZURE_SERVICE_BUS_CONNECTION_STRING',
  queueName: '%AZURE_SERVICE_BUS_QUEUE%',
  handler: async (message, context) => {
    if (message?.type !== 'RoomCreated') {
      context.log(`Bỏ qua event ${message?.type || 'không xác định'}`);
      return;
    }
    context.log('Đã nhận RoomCreated', {
      eventId: message.id,
      roomId: message.data?.roomId,
      correlationId: message.correlationId,
    });
    // Điểm mở rộng: gọi Notification API bằng Managed Identity hoặc ghi Cosmos DB.
  },
});

