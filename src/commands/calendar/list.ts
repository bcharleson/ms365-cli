import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const calendarListCommand: CommandDefinition = {
  name: 'calendar_list',
  group: 'calendar',
  subcommand: 'list',
  description: 'List calendar events. Defaults to next 7 days from now.',
  examples: [
    'm365 calendar list',
    'm365 calendar list --top 50 --pretty',
    'm365 calendar list --start 2026-03-01T00:00:00Z --end 2026-03-31T23:59:59Z',
    'm365 calendar list --filter "subject eq \'Team Standup\'"',
  ],

  inputSchema: z.object({
    top: z.coerce.number().min(1).max(1000).default(10).describe('Number of events to return'),
    start: z.string().optional().describe('Start datetime (ISO 8601), default: now'),
    end: z.string().optional().describe('End datetime (ISO 8601), default: 7 days from now'),
    filter: z.string().optional().describe('OData $filter expression'),
    select: z.string().optional().describe('Comma-separated fields to return'),
    orderby: z.string().default('start/dateTime').describe('Sort order'),
  }),

  cliMappings: {
    options: [
      { field: 'top', flags: '-n, --top <number>', description: 'Number of events' },
      { field: 'start', flags: '--start <datetime>', description: 'Start datetime (ISO 8601)' },
      { field: 'end', flags: '--end <datetime>', description: 'End datetime (ISO 8601)' },
      { field: 'filter', flags: '--filter <odata>', description: 'OData filter expression' },
      { field: 'select', flags: '--select <fields>', description: 'Fields to return' },
      { field: 'orderby', flags: '--orderby <expr>', description: 'Sort order' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/calendarView' },

  fieldMappings: {
    top: 'odata',
    start: 'query',
    end: 'query',
    filter: 'odata',
    select: 'odata',
    orderby: 'odata',
  },

  handler: (input, client) => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const resolved = {
      ...input,
      start: input.start ?? now.toISOString(),
      end: input.end ?? weekLater.toISOString(),
    };
    return executeCommand(calendarListCommand, resolved, client);
  },
};
