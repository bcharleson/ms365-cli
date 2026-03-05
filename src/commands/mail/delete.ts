import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const mailDeleteCommand: CommandDefinition = {
  name: 'mail_delete',
  group: 'mail',
  subcommand: 'delete',
  description: 'Delete (move to Deleted Items) a message by ID.',
  examples: [
    'm365 mail delete AAMkAGI2TG93AAA=',
  ],

  inputSchema: z.object({
    id: z.string().describe('Message ID to delete'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
  },

  endpoint: { method: 'DELETE', path: '/me/messages/{id}' },
  fieldMappings: { id: 'path' },

  handler: async (input, client) => {
    await executeCommand(mailDeleteCommand, input, client);
    return { deleted: true, id: input.id };
  },
};
