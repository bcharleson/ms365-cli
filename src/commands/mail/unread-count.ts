import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const mailUnreadCountCommand: CommandDefinition = {
  name: 'mail_unread_count',
  group: 'mail',
  subcommand: 'unread-count',
  description: 'Get the count of unread messages in a folder.',
  examples: [
    'm365 mail unread-count',
    'm365 mail unread-count --folder inbox',
  ],

  inputSchema: z.object({
    folder: z.string().default('inbox').describe('Folder name (inbox, sentitems, etc.)'),
  }),

  cliMappings: {
    options: [
      { field: 'folder', flags: '-f, --folder <name>', description: 'Folder name (default: inbox)' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/mailFolders/{folder}' },
  fieldMappings: { folder: 'path' },

  handler: async (input, client: GraphClient) => {
    const folder = await client.get<{ unreadItemCount: number; totalItemCount: number; displayName: string }>(
      `/me/mailFolders/${encodeURIComponent(String(input.folder))}`,
    );
    return {
      folder: folder.displayName,
      unread: folder.unreadItemCount,
      total: folder.totalItemCount,
    };
  },
};
