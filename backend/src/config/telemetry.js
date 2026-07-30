function initializeTelemetry() {
  if (!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) return null;
  const applicationInsights = require('applicationinsights');
  applicationInsights
    .setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(false)
    .setUseDiskRetryCaching(true)
    .start();
  return applicationInsights.defaultClient;
}

module.exports = initializeTelemetry;

