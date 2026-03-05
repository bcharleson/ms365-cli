import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const driveSearchCommand: CommandDefinition = {
  name: 'drive_search',
  group: 'drive',
  subcommand: 'search',
  description: 'Search OneDrive files by name or content.',
  examples: [
    'm365 drive search "quarterly report"',
    'm365 drive search "invoice" --top 20',
  ],

  inputSchema: z.object({
    query: z.string().describe('Search query'),
    top: z.coerce.number().min(1).max(200).default(10).describe('Number of results'),
    select: z.string().optional().describe('Fields to return'),
  }),

  cliMappings: {
    args: [{ field: 'query', name: 'query', required: true }],
    options: [
      { field: 'top', flags: '-n, --top <number>', description: 'Number of results' },
      { field: 'select', flags: '--select <fields>', description: 'Fields to return' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/drive/root/search(q=\'{query}\')' },
  fieldMappings: { query: 'path', top: 'odata', select: 'odata' },

  handler: (input, client) => {
    return executeCommand({
      ...driveSearchCommand,
      endpoint: { method: 'GET', path: `/me/drive/root/search(q='${encodeURIComponent(String(input.query))}')` },
    }, { top: input.top, select: input.select }, client);
  },
};
