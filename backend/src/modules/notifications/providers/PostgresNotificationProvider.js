const NotificationProvider = require('./NotificationProvider');
class PostgresNotificationProvider extends NotificationProvider {
  constructor(repository) {
    super();
    this.repository = repository;
  }
  create(...args) {
    return this.repository.create(...args);
  }
}
module.exports = PostgresNotificationProvider;

