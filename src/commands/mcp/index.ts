import type { Command } from 'commander';

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start the MCP (Model Context Protocol) server — exposes all commands as AI tools')
    .addHelpText('after', `
The MCP server exposes all microsoft365-cli commands as structured tools
that AI assistants (Claude, Cursor, OpenClaw) can call directly.

Add to your MCP client config:
  {
    "mcpServers": {
      "m365": {
        "command": "npx",
        "args": ["ms365-cli", "mcp"],
        "env": { "M365_CLIENT_ID": "your-client-id" }
      }
    }
  }

Or for OpenClaw agents:
  openclaw config set plugins.entries.m365.command "m365 mcp"
`)
    .action(async () => {
      const { startMcpServer } = await import('../../mcp/server.js');
      await startMcpServer();
    });
}
