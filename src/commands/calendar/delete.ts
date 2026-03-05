import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const calendarDeleteCommand: CommandDefinition = {
  name: 'calendar_delete',
  group: 'calendar',
  subcommand: 'delete',
  description: 'Delete a calendar event by ID.',
  examples: ['m365 calendar delete AAMkAGI2TG93AAA='],

  inputSchema: z.object({
    id: z.string().describe('Event ID to delete'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
  },

  endpoint: { method: 'DELETE', path: '/me/events/{id}' },
  fieldMappings: { id: 'path' },

  handler: async (input, client: GraphClient) => {
    await client.delete(`/me/events/${encodeURIComponent(String(input.id))}`);
    return { deleted: true, id: input.id };
  },
};
