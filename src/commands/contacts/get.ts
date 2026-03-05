import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const contactsGetCommand: CommandDefinition = {
  name: 'contacts_get',
  group: 'contacts',
  subcommand: 'get',
  description: 'Get a contact by ID.',
  examples: ['m365 contacts get AAMkAGI2TG93AAA='],

  inputSchema: z.object({
    id: z.string().describe('Contact ID'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
  },

  endpoint: { method: 'GET', path: '/me/contacts/{id}' },
  fieldMappings: { id: 'path' },

  handler: (input, client) => executeCommand(contactsGetCommand, input, client),
};
