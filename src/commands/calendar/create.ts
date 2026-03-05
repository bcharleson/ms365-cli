import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const calendarCreateCommand: CommandDefinition = {
  name: 'calendar_create',
  group: 'calendar',
  subcommand: 'create',
  description: 'Create a new calendar event.',
  examples: [
    'm365 calendar create --subject "Team Sync" --start 2026-03-10T14:00:00 --end 2026-03-10T15:00:00',
    'm365 calendar create --subject "Kickoff" --start 2026-03-10T09:00:00 --end 2026-03-10T10:00:00 --attendees "alice@co.com,bob@co.com"',
    'm365 calendar create --subject "All day" --start 2026-03-10 --end 2026-03-10 --all-day',
  ],

  inputSchema: z.object({
    subject: z.string().describe('Event title/subject'),
    start: z.string().describe('Start datetime (ISO 8601), e.g. 2026-03-10T14:00:00'),
    end: z.string().describe('End datetime (ISO 8601), e.g. 2026-03-10T15:00:00'),
    timezone: z.string().default('UTC').describe('Timezone, e.g. America/New_York'),
    body: z.string().optional().describe('Event description/body'),
    location: z.string().optional().describe('Location name or address'),
    attendees: z.string().optional().describe('Attendee email(s), comma-separated'),
    allDay: z.boolean().default(false).describe('All-day event'),
    isOnlineMeeting: z.boolean().default(false).describe('Create as Teams online meeting'),
  }),

  cliMappings: {
    options: [
      { field: 'subject', flags: '--subject <text>', description: 'Event title' },
      { field: 'start', flags: '--start <datetime>', description: 'Start datetime (ISO 8601)' },
      { field: 'end', flags: '--end <datetime>', description: 'End datetime (ISO 8601)' },
      { field: 'timezone', flags: '--timezone <tz>', description: 'Timezone (default: UTC)' },
      { field: 'body', flags: '--body <text>', description: 'Event description' },
      { field: 'location', flags: '--location <text>', description: 'Location' },
      { field: 'attendees', flags: '--attendees <emails>', description: 'Attendees, comma-separated' },
      { field: 'allDay', flags: '--all-day', description: 'All-day event' },
      { field: 'isOnlineMeeting', flags: '--online-meeting', description: 'Create as Teams meeting' },
    ],
  },

  endpoint: { method: 'POST', path: '/me/events' },
  fieldMappings: {},

  handler: async (input, client: GraphClient) => {
    const attendeeList = input.attendees
      ? String(input.attendees).split(',').map((e: string) => ({
          emailAddress: { address: e.trim() },
          type: 'required',
        }))
      : [];

    return client.post('/me/events', {
      subject: input.subject,
      body: input.body ? { contentType: 'Text', content: input.body } : undefined,
      start: { dateTime: input.start, timeZone: input.timezone },
      end: { dateTime: input.end, timeZone: input.timezone },
      location: input.location ? { displayName: input.location } : undefined,
      attendees: attendeeList.length > 0 ? attendeeList : undefined,
      isAllDay: input.allDay,
      isOnlineMeeting: input.isOnlineMeeting,
      onlineMeetingProvider: input.isOnlineMeeting ? 'teamsForBusiness' : undefined,
    });
  },
};
