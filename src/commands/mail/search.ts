import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const mailSearchCommand: CommandDefinition = {
  name: 'mail_search',
  group: 'mail',
  subcommand: 'search',
  description: 'Search messages using KQL (Keyword Query Language) across all folders.',
  examples: [
    'm365 mail search "project proposal"',
    'm365 mail search "from:alice@example.com"',
    'm365 mail search "subject:invoice" --top 20',
    'm365 mail search "received>=2026-01-01 AND from:boss@company.com"',
  ],

  inputSchema: z.object({
    query: z.string().describe('KQL search query, e.g. "from:alice@example.com subject:invoice"'),
    top: z.coerce.number().min(1).max(250).default(10).describe('Number of results (1-250)'),
    select: z.string().optional().describe('Fields to return, e.g. "id,subject,from,receivedDateTime"'),
  }),

  cliMappings: {
    args: [{ field: 'query', name: 'query', required: true }],
    options: [
      { field: 'top', flags: '-n, --top <number>', description: 'Number of results (1-250)' },
      { field: 'select', flags: '--select <fields>', description: 'Fields to return' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/messages' },

  fieldMappings: {
    query: 'odata',
    top: 'odata',
    select: 'odata',
  },

  handler: (input, client) => {
    const modified = { ...input, search: `"${input.query}"`, query: undefined };
    return executeCommand({ ...mailSearchCommand, fieldMappings: { search: 'odata', top: 'odata', select: 'odata' } }, modified, client);
  },
};
