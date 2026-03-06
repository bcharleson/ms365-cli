import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const mailReplyCommand: CommandDefinition = {
  name: 'mail_reply',
  group: 'mail',
  subcommand: 'reply',
  description: 'Reply to a message. Replies to the sender by default; use --reply-all to include all recipients.',
  examples: [
    'm365 mail reply AAMkAGI2TG93AAA= --body "Thanks!"',
    'm365 mail reply AAMkAGI2TG93AAA= --body "Looping in the team" --reply-all',
    'm365 mail reply AAMkAGI2TG93AAA= --body "<b>See you then</b>" --content-type html',
  ],

  inputSchema: z.object({
    id: z.string().describe('Message ID to reply to'),
    body: z.string().describe('Reply body content'),
    contentType: z.enum(['text', 'html']).default('text').describe('Body content type'),
    replyAll: z.boolean().default(false).describe('Reply to all recipients'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: false }],
    options: [
      { field: 'id', flags: '--id <id>', description: 'Message ID to reply to (alias for positional argument)' },
      { field: 'body', flags: '--body <text>', description: 'Reply body' },
      { field: 'contentType', flags: '--content-type <type>', description: 'text (default) or html' },
      { field: 'replyAll', flags: '--reply-all', description: 'Reply to all recipients' },
    ],
  },

  endpoint: { method: 'POST', path: '/me/messages/{id}/reply' },
  fieldMappings: { id: 'path' },

  handler: async (input, client: GraphClient) => {
    const endpoint = input.replyAll
      ? `/me/messages/${encodeURIComponent(String(input.id))}/replyAll`
      : `/me/messages/${encodeURIComponent(String(input.id))}/reply`;

    await client.post(endpoint, {
      message: {},
      comment: input.body,
    });

    return { replied: true, messageId: input.id };
  },
};
