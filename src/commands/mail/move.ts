import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const mailMoveCommand: CommandDefinition = {
  name: 'mail_move',
  group: 'mail',
  subcommand: 'move',
  description: 'Move a message to a different folder.',
  examples: [
    'm365 mail move AAMkAGI2TG93AAA= --destination archive',
    'm365 mail move AAMkAGI2TG93AAA= --destination deleteditems',
  ],

  inputSchema: z.object({
    id: z.string().describe('Message ID'),
    destination: z.string().describe('Destination folder name or ID (e.g. inbox, archive, deleteditems)'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
    options: [
      { field: 'destination', flags: '--destination <folder>', description: 'Target folder' },
    ],
  },

  endpoint: { method: 'POST', path: '/me/messages/{id}/move' },
  fieldMappings: { id: 'path', destination: 'body' },

  handler: async (input, client: GraphClient) => {
    return client.post(`/me/messages/${encodeURIComponent(String(input.id))}/move`, {
      destinationId: input.destination,
    });
  },
};
