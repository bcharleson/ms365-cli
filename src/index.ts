import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('m365')
  .description('CLI and MCP server for Microsoft 365 — Mail, Calendar, OneDrive, Contacts. JSON-first, AI-agent ready.')
  .version('0.1.0')
  .option('--output <format>', 'Output format: json (default) or pretty', 'json')
  .option('--pretty', 'Shorthand for --output pretty')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated fields to include in output');

registerAllCommands(program);

program.parse();
