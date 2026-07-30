const env = require('../../config/env');
const ConsoleLoggerProvider = require('./logger/ConsoleLoggerProvider');
const ApplicationInsightsProvider = require('./logger/ApplicationInsightsProvider');
const LocalMessagingProvider = require('./messaging/LocalMessagingProvider');
const AzureServiceBusProvider = require('./messaging/AzureServiceBusProvider');
const MemoryCacheProvider = require('./cache/MemoryCacheProvider');
const AzureRedisProvider = require('./cache/AzureRedisProvider');

const logger = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  ? new ApplicationInsightsProvider(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  : new ConsoleLoggerProvider();

const messaging =
  env.messagingProvider === 'azure-service-bus'
    ? new AzureServiceBusProvider(
        process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
        process.env.AZURE_SERVICE_BUS_QUEUE,
      )
    : new LocalMessagingProvider();

const cache =
  env.cacheProvider === 'azure-redis'
    ? new AzureRedisProvider(process.env.AZURE_REDIS_CONNECTION_STRING)
    : new MemoryCacheProvider();

module.exports = { logger, messaging, cache };

