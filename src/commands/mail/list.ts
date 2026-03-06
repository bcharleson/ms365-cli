import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand, stripODataMetadata } from '../../core/handler.js';

export const mailListCommand: CommandDefinition = {
  name: 'mail_list',
  group: 'mail',
  subcommand: 'list',
  description: 'List messages in your inbox. Returns sender, subject, preview, and metadata.',
  examples: [
    'm365 mail list',
    'm365 mail list --top 25 --pretty',
    'm365 mail list --folder sentitems',
    'm365 mail list --filter "isRead eq false"',
    'm365 mail list --select "id,subject,from,receivedDateTime"',
  ],

  inputSchema: z.object({
    top: z.coerce.number().min(1).max(1000).default(10)
      .describe('Number of messages to return (1-1000)'),
    skip: z.coerce.number().min(0).default(0).optional()
      .describe('Number of messages to skip (for pagination)'),
    folder: z.string().default('inbox')
      .describe('Folder name or ID (inbox, sentitems, drafts, deleteditems, junkemail)'),
    filter: z.string().optional()
      .describe('OData $filter expression, e.g. "isRead eq false"'),
    unread: z.boolean().optional()
      .describe('Shorthand for --filter "isRead eq false"'),
    select: z.string().optional()
      .describe('Comma-separated fields to return, e.g. "id,subject,from"'),
    orderby: z.string().optional()
      .describe('OData $orderby, e.g. "receivedDateTime desc"'),
  }),

  cliMappings: {
    options: [
      { field: 'top', flags: '-n, --top <number>', description: 'Number of messages (1-1000)' },
      { field: 'skip', flags: '--skip <number>', description: 'Skip N messages' },
      { field: 'folder', flags: '-f, --folder <name>', description: 'Folder: inbox, sentitems, drafts, deleteditems, junkemail' },
      { field: 'unread', flags: '--unread', description: 'Show only unread messages (shorthand for --filter "isRead eq false")' },
      { field: 'filter', flags: '--filter <odata>', description: 'OData filter, e.g. "isRead eq false"' },
      { field: 'select', flags: '--select <fields>', description: 'Fields to return, e.g. "id,subject,from"' },
      { field: 'orderby', flags: '--orderby <expr>', description: 'Sort order, e.g. "receivedDateTime desc"' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/mailFolders/{folder}/messages' },

  fieldMappings: {
    folder: 'path',
    top: 'odata',
    skip: 'odata',
    filter: 'odata',
    select: 'odata',
    orderby: 'odata',
  },

  handler: async (input, client) => {
    const resolvedInput: Record<string, unknown> = { ...input };
    if (input.unread) {
      const unreadFilter = 'isRead eq false';
      resolvedInput.filter = input.filter ? `${input.filter} AND ${unreadFilter}` : unreadFilter;
    }
    delete resolvedInput.unread;
    const result = await executeCommand(mailListCommand, resolvedInput as typeof input, client);
    return stripODataMetadata(result);
  },
};
