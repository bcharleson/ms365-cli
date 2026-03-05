import { startMcpServer } from './mcp/server.js';

startMcpServer().catch((err) => {
  console.error('MCP server failed to start:', err);
  process.exit(1);
});
