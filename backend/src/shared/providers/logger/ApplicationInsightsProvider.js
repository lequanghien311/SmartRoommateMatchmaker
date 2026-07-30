const LoggerProvider = require('./LoggerProvider');

class ApplicationInsightsProvider extends LoggerProvider {
  constructor(connectionString) {
    super();
    if (!connectionString) throw new Error('Thiếu APPLICATIONINSIGHTS_CONNECTION_STRING');
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = connectionString;
    this.client = require('../../../config/telemetry')();
  }

  info(event, context = {}) {
    this.client.trackEvent({ name: event, properties: context });
  }

  warn(event, context = {}) {
    this.client.trackTrace({ message: event, severity: 2, properties: context });
  }

  error(event, context = {}) {
    this.client.trackException({ exception: new Error(event), properties: context });
  }
}

module.exports = ApplicationInsightsProvider;
