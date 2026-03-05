import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const contactsCreateCommand: CommandDefinition = {
  name: 'contacts_create',
  group: 'contacts',
  subcommand: 'create',
  description: 'Create a new contact in Outlook.',
  examples: [
    'm365 contacts create --given "Jane" --surname "Doe" --email jane@example.com',
    'm365 contacts create --given "John" --surname "Smith" --email john@co.com --phone "+1-555-0100" --company "Acme Corp"',
  ],

  inputSchema: z.object({
    given: z.string().describe('First name'),
    surname: z.string().optional().describe('Last name'),
    email: z.string().optional().describe('Email address'),
    phone: z.string().optional().describe('Mobile phone number'),
    company: z.string().optional().describe('Company name'),
    jobTitle: z.string().optional().describe('Job title'),
    notes: z.string().optional().describe('Personal notes'),
  }),

  cliMappings: {
    options: [
      { field: 'given', flags: '--given <name>', description: 'First name' },
      { field: 'surname', flags: '--surname <name>', description: 'Last name' },
      { field: 'email', flags: '--email <email>', description: 'Email address' },
      { field: 'phone', flags: '--phone <number>', description: 'Mobile phone' },
      { field: 'company', flags: '--company <name>', description: 'Company name' },
      { field: 'jobTitle', flags: '--job-title <title>', description: 'Job title' },
      { field: 'notes', flags: '--notes <text>', description: 'Personal notes' },
    ],
  },

  endpoint: { method: 'POST', path: '/me/contacts' },
  fieldMappings: {},

  handler: async (input, client: GraphClient) => {
    return client.post('/me/contacts', {
      givenName: input.given,
      surname: input.surname,
      emailAddresses: input.email ? [{ address: input.email, name: `${input.given} ${input.surname ?? ''}`.trim() }] : [],
      mobilePhone: input.phone,
      companyName: input.company,
      jobTitle: input.jobTitle,
      personalNotes: input.notes,
    });
  },
};
