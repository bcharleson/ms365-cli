import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';
import { stripODataMetadata } from '../../core/handler.js';

export const mailAttachmentsListCommand: CommandDefinition = {
  name: 'mail_attachments_list',
  group: 'mail',
  subcommand: 'attachments-list',
  description: 'List attachments on a message. Returns name, contentType, size, and ID for each attachment.',
  examples: [
    'm365 mail attachments-list AAMkAGI2TG93AAA=',
    'm365 mail attachments-list AAMkAGI2TG93AAA= --pretty',
  ],

  inputSchema: z.object({
    id: z.string().describe('Message ID'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
    options: [],
  },

  endpoint: { method: 'GET', path: '/me/messages/{id}/attachments' },
  fieldMappings: { id: 'path' },

  handler: async (input, client: GraphClient) => {
    const result = await client.get<any>(
      `/me/messages/${encodeURIComponent(String(input.id))}/attachments?$select=id,name,contentType,size,isInline`,
    );
    return stripODataMetadata(result);
  },
};
