import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const CLI_VERSION = '0.2.0';

const program = new Command();

program
  .name('m365')
  .description('CLI and MCP server for Microsoft 365 — Mail, Calendar, OneDrive, Contacts. JSON-first, AI-agent ready.')
  .version(CLI_VERSION)
  .option('--output <format>', 'Output format: json (default) or pretty', 'json')
  .option('--pretty', 'Shorthand for --output pretty')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated fields to include in output');

program
  .command('version')
  .description('Show the current CLI version')
  .action(() => {
    console.log(JSON.stringify({ name: 'ms365-cli', version: CLI_VERSION }));
  });

registerAllCommands(program);

program.parse();
