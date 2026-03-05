import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const calendarGetCommand: CommandDefinition = {
  name: 'calendar_get',
  group: 'calendar',
  subcommand: 'get',
  description: 'Get a calendar event by ID.',
  examples: [
    'm365 calendar get AAMkAGI2TG93AAA=',
    'm365 calendar get AAMkAGI2TG93AAA= --pretty',
  ],

  inputSchema: z.object({
    id: z.string().describe('Event ID'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
  },

  endpoint: { method: 'GET', path: '/me/events/{id}' },
  fieldMappings: { id: 'path' },

  handler: (input, client) => executeCommand(calendarGetCommand, input, client),
};
