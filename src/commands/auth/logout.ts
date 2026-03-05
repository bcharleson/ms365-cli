import type { Command } from 'commander';
import { logout } from '../../core/auth.js';
import { deleteConfig } from '../../core/config.js';
import { outputError } from '../../core/output.js';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored credentials and token cache')
    .action(async () => {
      try {
        await logout();
        await deleteConfig();
        console.log('✓ Logged out. Config and token cache removed.');
      } catch (error) {
        outputError(error, { output: 'pretty' });
      }
    });
}
