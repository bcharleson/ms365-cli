import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
} from '@azure/msal-node';
import {
  loadConfig,
  loadTokenCache,
  saveTokenCache,
  DEFAULT_CLIENT_ID,
  DEFAULT_TENANT_ID,
  DEFAULT_SCOPES,
} from './config.js';
import { AuthError } from './errors.js';

let _msalApp: PublicClientApplication | null = null;

async function getMsalApp(): Promise<PublicClientApplication> {
  if (_msalApp) return _msalApp;

  const config = await loadConfig();
  const clientId = config?.client_id || DEFAULT_CLIENT_ID;

  if (!clientId) {
    throw new AuthError(
      'No Azure AD client ID found.\n' +
      '  Option 1: Set M365_CLIENT_ID env var\n' +
      '  Option 2: Run: m365 auth login --client-id <id>\n\n' +
      '  Register a free Azure AD app at: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps\n' +
      '  App type: Public client, Redirect URI: http://localhost (mobile/desktop)',
    );
  }

  const tenantId = config?.tenant_id || DEFAULT_TENANT_ID;
  const tokenCacheData = await loadTokenCache();

  const app = new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    cache: {
      cachePlugin: {
        beforeCacheAccess: async (ctx) => {
          if (tokenCacheData) ctx.tokenCache.deserialize(tokenCacheData);
        },
        afterCacheAccess: async (ctx) => {
          if (ctx.cacheHasChanged) {
            await saveTokenCache(ctx.tokenCache.serialize());
          }
        },
      },
    },
  });

  _msalApp = app;
  return app;
}

export async function getAccessToken(): Promise<string> {
  const app = await getMsalApp();
  const accounts = await app.getAllAccounts();

  if (accounts.length > 0) {
    try {
      const result = await app.acquireTokenSilent({
        account: accounts[0],
        scopes: DEFAULT_SCOPES,
      });
      return result.accessToken;
    } catch {
      // Silent refresh failed — fall through to device code
    }
  }

  throw new AuthError(
    'Not logged in or token expired. Run: m365 auth login',
  );
}

export async function loginWithDeviceCode(
  clientId: string,
  tenantId: string,
  scopes: string[],
): Promise<AuthenticationResult> {
  // Reset cached app so new clientId/tenantId takes effect
  _msalApp = null;

  const app = new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    cache: {
      cachePlugin: {
        beforeCacheAccess: async (ctx) => {
          const data = await loadTokenCache();
          if (data) ctx.tokenCache.deserialize(data);
        },
        afterCacheAccess: async (ctx) => {
          if (ctx.cacheHasChanged) {
            await saveTokenCache(ctx.tokenCache.serialize());
          }
        },
      },
    },
  });

  _msalApp = app;

  const result = await app.acquireTokenByDeviceCode({
    scopes,
    deviceCodeCallback: (response) => {
      console.log('\n' + response.message + '\n');
    },
  });

  if (!result) {
    throw new AuthError('Login failed — no token returned');
  }

  return result;
}

export async function getActiveAccount(): Promise<AccountInfo | null> {
  try {
    const app = await getMsalApp();
    const accounts = await app.getAllAccounts();
    return accounts[0] ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  _msalApp = null;
}
