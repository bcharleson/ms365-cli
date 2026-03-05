import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const contactsSearchCommand: CommandDefinition = {
  name: 'contacts_search',
  group: 'contacts',
  subcommand: 'search',
  description: 'Search contacts by name or email.',
  examples: [
    'm365 contacts search "Alice"',
    'm365 contacts search "smith" --top 20',
  ],

  inputSchema: z.object({
    query: z.string().describe('Name or email to search'),
    top: z.coerce.number().min(1).max(250).default(10).describe('Number of results'),
  }),

  cliMappings: {
    args: [{ field: 'query', name: 'query', required: true }],
    options: [
      { field: 'top', flags: '-n, --top <number>', description: 'Number of results' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/contacts' },
  fieldMappings: { top: 'odata', query: 'odata' },

  handler: (input, client) => {
    return executeCommand({
      ...contactsSearchCommand,
      fieldMappings: { filter: 'odata', top: 'odata' },
    }, {
      filter: `startsWith(displayName,'${input.query}') or emailAddresses/any(e:startsWith(e/address,'${input.query}'))`,
      top: input.top,
    }, client);
  },
};
