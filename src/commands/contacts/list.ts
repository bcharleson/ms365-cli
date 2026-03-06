import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand, stripODataMetadata } from '../../core/handler.js';

export const contactsListCommand: CommandDefinition = {
  name: 'contacts_list',
  group: 'contacts',
  subcommand: 'list',
  description: 'List contacts from your Outlook contacts.',
  examples: [
    'm365 contacts list',
    'm365 contacts list --top 50',
    'm365 contacts list --select "displayName,emailAddresses,mobilePhone"',
  ],

  inputSchema: z.object({
    top: z.coerce.number().min(1).max(1000).default(10).describe('Number of contacts'),
    filter: z.string().optional().describe('OData $filter expression'),
    select: z.string().optional().describe('Fields to return'),
    orderby: z.string().optional().describe('Sort order, e.g. "displayName asc"'),
  }),

  cliMappings: {
    options: [
      { field: 'top', flags: '-n, --top <number>', description: 'Number of contacts' },
      { field: 'filter', flags: '--filter <odata>', description: 'OData filter' },
      { field: 'select', flags: '--select <fields>', description: 'Fields to return' },
      { field: 'orderby', flags: '--orderby <expr>', description: 'Sort order' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/contacts' },
  fieldMappings: {
    top: 'odata',
    filter: 'odata',
    select: 'odata',
    orderby: 'odata',
  },

  handler: async (input, client) => {
    const result = await executeCommand(contactsListCommand, input, client);
    return stripODataMetadata(result);
  },
};
