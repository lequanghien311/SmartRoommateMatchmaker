const { AppConfigurationClient } = require('@azure/app-configuration');

class AzureAppConfigProvider {
  constructor(connectionString) {
    this.connectionString = connectionString || process.env.AZURE_APPCONFIG_CONNECTION_STRING;
    this.client = null;
    if (this.connectionString) {
      try {
        this.client = new AppConfigurationClient(this.connectionString);
      } catch (err) {
        console.warn('AzureAppConfigProvider init warning:', err.message);
      }
    }
  }

  async getStatus() {
    const checkedAt = new Date().toISOString();
    if (!this.client) {
      return {
        connected: false,
        keyLoaded: false,
        featureEnabled: true, // safe fallback
        checkedAt,
        provider: 'azure-app-configuration-fallback',
      };
    }

    try {
      const setting = await this.client.getConfigurationSetting({
        key: 'SmartRoommate:Features:CloudDemoEnabled',
      });
      const featureEnabled = setting?.value === 'true';
      return {
        connected: true,
        keyLoaded: true,
        featureEnabled,
        checkedAt,
        provider: 'azure-app-configuration',
      };
    } catch (err) {
      return {
        connected: false,
        keyLoaded: false,
        featureEnabled: true, // safe fallback
        checkedAt,
        provider: 'azure-app-configuration-fallback',
        error: err.message,
      };
    }
  }
}

module.exports = AzureAppConfigProvider;
