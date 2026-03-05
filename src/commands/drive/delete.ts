import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const driveDeleteCommand: CommandDefinition = {
  name: 'drive_delete',
  group: 'drive',
  subcommand: 'delete',
  description: 'Delete a file or folder by item ID.',
  examples: ['m365 drive delete 01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K'],

  inputSchema: z.object({
    id: z.string().describe('Item ID to delete'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
  },

  endpoint: { method: 'DELETE', path: '/me/drive/items/{id}' },
  fieldMappings: { id: 'path' },

  handler: async (input, client: GraphClient) => {
    await client.delete(`/me/drive/items/${encodeURIComponent(String(input.id))}`);
    return { deleted: true, id: input.id };
  },
};
