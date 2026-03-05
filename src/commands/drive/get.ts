import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const driveGetCommand: CommandDefinition = {
  name: 'drive_get',
  group: 'drive',
  subcommand: 'get',
  description: 'Get metadata for a file or folder by item ID or path.',
  examples: [
    'm365 drive get 01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K',
    'm365 drive get --path "/Documents/report.pdf"',
  ],

  inputSchema: z.object({
    id: z.string().optional().describe('Item ID'),
    path: z.string().optional().describe('Item path, e.g. /Documents/report.pdf'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: false }],
    options: [
      { field: 'path', flags: '--path <path>', description: 'Item path' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/drive/items/{id}' },
  fieldMappings: { id: 'path' },

  handler: (input, client) => {
    if (input.path) {
      return executeCommand({ ...driveGetCommand, endpoint: { method: 'GET', path: `/me/drive/root:${input.path}` } }, {}, client);
    }
    return executeCommand(driveGetCommand, input, client);
  },
};
