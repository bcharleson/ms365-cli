import type { Command } from 'commander';
import { loginWithDeviceCode } from '../../core/auth.js';
import {
  saveConfig,
  DEFAULT_CLIENT_ID,
  DEFAULT_TENANT_ID,
  DEFAULT_SCOPES,
} from '../../core/config.js';
import { outputError } from '../../core/output.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with Microsoft 365 using device code flow')
    .option('--client-id <id>', 'Azure AD app client ID (or set M365_CLIENT_ID env var)')
    .option('--tenant-id <id>', 'Azure AD tenant ID (default: common for multi-tenant)', DEFAULT_TENANT_ID)
    .option('--scopes <scopes>', 'Comma-separated OAuth scopes', DEFAULT_SCOPES.join(','))
    .addHelpText('after', `
Examples:
  $ m365 auth login
  $ m365 auth login --client-id 00000000-0000-0000-0000-000000000000
  $ m365 auth login --tenant-id your-tenant.onmicrosoft.com

Setup:
  Register a free Azure AD app at:
  https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
  - Platform: Mobile and desktop applications
  - Redirect URI: http://localhost
  - API permissions: Mail.ReadWrite, Mail.Send, Calendars.ReadWrite,
    Files.ReadWrite, Contacts.ReadWrite, User.Read
`)
    .action(async (opts) => {
      try {
        const clientId = opts.clientId || DEFAULT_CLIENT_ID;
        if (!clientId) {
          console.error(
            'Error: No client ID provided.\n' +
            '  Set M365_CLIENT_ID env var or pass --client-id <id>\n\n' +
            '  Register at: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps',
          );
          process.exitCode = 1;
          return;
        }

        const tenantId = opts.tenantId || DEFAULT_TENANT_ID;
        const scopes = opts.scopes.split(',').map((s: string) => s.trim());

        console.log('Starting device code login...');
        const result = await loginWithDeviceCode(clientId, tenantId, scopes);

        await saveConfig({ client_id: clientId, tenant_id: tenantId, account: result.account?.username });

        console.log(`\n✓ Logged in as: ${result.account?.username ?? 'unknown'}`);
        console.log('  Tokens cached at: ~/.m365/token-cache.json');
      } catch (error) {
        outputError(error, { output: 'pretty' });
      }
    });
}
