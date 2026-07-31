class AzureKeyVaultProvider {
  constructor(vaultUrl) {
    const rawUrl = vaultUrl || process.env.AZURE_KEYVAULT_URL || 'https://kv-smartroommate-ea.vault.azure.net/';
    this.vaultUrl = rawUrl.replace(/\/+$/, '');
    this.vaultName = 'kv-smartroommate-ea';
  }

  async readSecretTest(secretName = 'demo-secret') {
    const checkedAt = new Date().toISOString();
    const identityEndpoint = process.env.IDENTITY_ENDPOINT;
    const identityHeader = process.env.IDENTITY_HEADER;

    if (!identityEndpoint || !identityHeader) {
      return {
        provider: 'azure-key-vault-fallback',
        vaultName: this.vaultName,
        secretName,
        retrieved: false,
        fallbackUsed: true,
        error: 'App Service Managed Identity environment variables (IDENTITY_ENDPOINT/IDENTITY_HEADER) not present',
        checkedAt,
      };
    }

    // 1. Acquire Managed Identity Token (5s timeout)
    const tokenController = new AbortController();
    const tokenTimer = setTimeout(() => tokenController.abort(), 5000);
    let accessToken = null;

    try {
      const tokenUrl = `${identityEndpoint}?api-version=2019-08-01&resource=https://vault.azure.net`;
      const tokenRes = await fetch(tokenUrl, {
        method: 'GET',
        headers: {
          'X-IDENTITY-HEADER': identityHeader,
        },
        signal: tokenController.signal,
      });

      if (!tokenRes.ok) {
        throw new Error(`Managed Identity token acquisition failed with status ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;
    } catch (err) {
      return {
        provider: 'azure-key-vault-fallback',
        vaultName: this.vaultName,
        secretName,
        retrieved: false,
        fallbackUsed: true,
        error: err.name === 'AbortError' ? 'Managed Identity token request timeout (5s)' : err.message,
        checkedAt,
      };
    } finally {
      clearTimeout(tokenTimer);
    }

    // 2. Read Key Vault Secret via REST API (5s timeout)
    const kvController = new AbortController();
    const kvTimer = setTimeout(() => kvController.abort(), 5000);

    try {
      const kvUrl = `${this.vaultUrl}/secrets/${secretName}?api-version=7.4`;
      const kvRes = await fetch(kvUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
        signal: kvController.signal,
      });

      if (!kvRes.ok) {
        let errType = `HTTP error ${kvRes.status}`;
        if (kvRes.status === 401) errType = 'authentication failure (401)';
        else if (kvRes.status === 403) errType = 'RBAC/propagation failure (403)';
        else if (kvRes.status === 404) errType = 'secret not found (404)';
        throw new Error(errType);
      }

      const secretData = await kvRes.json();
      const secretVersionPresent = Boolean(secretData?.id);
      const enabled = Boolean(secretData?.attributes?.enabled ?? true);

      // Return ONLY safe metadata evidence schema - NO secret value, NO tokens, NO headers
      return {
        provider: 'azure-key-vault',
        vaultName: this.vaultName,
        secretName,
        retrieved: true,
        secretVersionPresent,
        enabled,
        authentication: 'system-assigned-managed-identity',
        httpStatus: kvRes.status,
        fallbackUsed: false,
        checkedAt,
      };
    } catch (err) {
      return {
        provider: 'azure-key-vault-fallback',
        vaultName: this.vaultName,
        secretName,
        retrieved: false,
        fallbackUsed: true,
        error: err.name === 'AbortError' ? 'Key Vault request service timeout (5s)' : err.message,
        checkedAt,
      };
    } finally {
      clearTimeout(kvTimer);
    }
  }

  async health() {
    return {
      status: 'configured',
      provider: 'azure-key-vault',
    };
  }
}

module.exports = AzureKeyVaultProvider;
