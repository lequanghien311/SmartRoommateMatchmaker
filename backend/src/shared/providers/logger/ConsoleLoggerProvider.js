const LoggerProvider = require('./LoggerProvider');

class ConsoleLoggerProvider extends LoggerProvider {
  write(level, event, context = {}) {
    const safe = { ...context };
    delete safe.password;
    delete safe.token;
    delete safe.authorization;
    console[level](JSON.stringify({ time: new Date().toISOString(), level, event, ...safe }));
  }

  info(event, context) {
    this.write('info', event, context);
  }

  warn(event, context) {
    this.write('warn', event, context);
  }

  error(event, context) {
    this.write('error', event, context);
  }
}

module.exports = ConsoleLoggerProvider;

