import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const calendarUpdateCommand: CommandDefinition = {
  name: 'calendar_update',
  group: 'calendar',
  subcommand: 'update',
  description: 'Update an existing calendar event.',
  examples: [
    'm365 calendar update AAMkAGI2TG93AAA= --subject "Updated Sync"',
    'm365 calendar update AAMkAGI2TG93AAA= --start 2026-03-10T15:00:00 --end 2026-03-10T16:00:00',
  ],

  inputSchema: z.object({
    id: z.string().describe('Event ID'),
    subject: z.string().optional().describe('New event title'),
    start: z.string().optional().describe('New start datetime (ISO 8601)'),
    end: z.string().optional().describe('New end datetime (ISO 8601)'),
    timezone: z.string().optional().describe('Timezone, e.g. America/New_York'),
    body: z.string().optional().describe('New event description'),
    location: z.string().optional().describe('New location'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: true }],
    options: [
      { field: 'subject', flags: '--subject <text>', description: 'New event title' },
      { field: 'start', flags: '--start <datetime>', description: 'New start datetime' },
      { field: 'end', flags: '--end <datetime>', description: 'New end datetime' },
      { field: 'timezone', flags: '--timezone <tz>', description: 'Timezone' },
      { field: 'body', flags: '--body <text>', description: 'New event description' },
      { field: 'location', flags: '--location <text>', description: 'New location' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/me/events/{id}' },
  fieldMappings: { id: 'path' },

  handler: async (input, client: GraphClient) => {
    const patch: Record<string, any> = {};
    if (input.subject) patch.subject = input.subject;
    if (input.body) patch.body = { contentType: 'Text', content: input.body };
    if (input.location) patch.location = { displayName: input.location };
    const tz = input.timezone ?? 'UTC';
    if (input.start) patch.start = { dateTime: input.start, timeZone: tz };
    if (input.end) patch.end = { dateTime: input.end, timeZone: tz };

    return client.patch(`/me/events/${encodeURIComponent(String(input.id))}`, patch);
  },
};
