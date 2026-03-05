import type { Command } from 'commander';
import { getActiveAccount } from '../../core/auth.js';
import { loadConfig } from '../../core/config.js';
import { output, outputError } from '../../core/output.js';
import type { GlobalOptions } from '../../core/types.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      try {
        const globalOpts = program.optsWithGlobals() as GlobalOptions;
        const [account, config] = await Promise.all([getActiveAccount(), loadConfig()]);

        if (!account) {
          output({ authenticated: false, message: 'Not logged in. Run: m365 auth login' }, globalOpts);
          return;
        }

        output({
          authenticated: true,
          account: account.username,
          name: account.name,
          tenant_id: config?.tenant_id ?? 'common',
          client_id: config?.client_id ?? process.env.M365_CLIENT_ID ?? 'not set',
        }, globalOpts);
      } catch (error) {
        outputError(error, { output: 'pretty' });
      }
    });
}
