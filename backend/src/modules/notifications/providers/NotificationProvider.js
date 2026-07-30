class NotificationProvider {
  async create(_userId, _type, _title, _body, _link, _data) {
    throw new Error('NotificationProvider.create chưa được triển khai');
  }
}
module.exports = NotificationProvider;

