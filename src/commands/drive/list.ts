import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const driveListCommand: CommandDefinition = {
  name: 'drive_list',
  group: 'drive',
  subcommand: 'list',
  description: 'List files and folders in OneDrive root or a specific folder.',
  examples: [
    'm365 drive list',
    'm365 drive list --top 50',
    'm365 drive list --folder-id 01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K',
    'm365 drive list --filter "file ne null"',
  ],

  inputSchema: z.object({
    folderId: z.string().optional().describe('Folder item ID (default: root)'),
    top: z.coerce.number().min(1).max(1000).default(20).describe('Number of items to return'),
    filter: z.string().optional().describe('OData $filter expression'),
    select: z.string().optional().describe('Fields to return'),
    orderby: z.string().optional().describe('Sort order, e.g. "name asc"'),
  }),

  cliMappings: {
    options: [
      { field: 'folderId', flags: '--folder-id <id>', description: 'Folder item ID' },
      { field: 'top', flags: '-n, --top <number>', description: 'Number of items' },
      { field: 'filter', flags: '--filter <odata>', description: 'OData filter' },
      { field: 'select', flags: '--select <fields>', description: 'Fields to return' },
      { field: 'orderby', flags: '--orderby <expr>', description: 'Sort order' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/drive/root/children' },
  fieldMappings: {
    top: 'odata',
    filter: 'odata',
    select: 'odata',
    orderby: 'odata',
  },

  handler: (input, client) => {
    const path = input.folderId
      ? `/me/drive/items/${encodeURIComponent(String(input.folderId))}/children`
      : '/me/drive/root/children';
    return executeCommand({ ...driveListCommand, endpoint: { method: 'GET', path } }, input, client);
  },
};
