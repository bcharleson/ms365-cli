import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const mailGetCommand: CommandDefinition = {
  name: 'mail_get',
  group: 'mail',
  subcommand: 'get',
  description: 'Get a message by ID, including full body content.',
  examples: [
    'm365 mail get AAMkAGI2TG93AAA=',
    'm365 mail get AAMkAGI2TG93AAA= --pretty',
  ],

  inputSchema: z.object({
    id: z.string().describe('Message ID'),
    select: z.string().optional()
      .describe('Comma-separated fields to return'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
    options: [
      { field: 'select', flags: '--select <fields>', description: 'Fields to return' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/messages/{id}' },

  fieldMappings: {
    id: 'path',
    select: 'odata',
  },

  handler: (input, client) => executeCommand(mailGetCommand, input, client),
};
