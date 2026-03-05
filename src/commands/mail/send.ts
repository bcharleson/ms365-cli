import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

export const mailSendCommand: CommandDefinition = {
  name: 'mail_send',
  group: 'mail',
  subcommand: 'send',
  description: 'Send a new email message.',
  examples: [
    'm365 mail send --to alice@example.com --subject "Hello" --body "Hi there"',
    'm365 mail send --to "a@b.com,c@d.com" --subject "Team update" --body "See attached" --cc boss@example.com',
    'm365 mail send --to alice@example.com --subject "Hi" --body "<h1>Hello</h1>" --content-type html',
  ],

  inputSchema: z.object({
    to: z.string().describe('Recipient email(s), comma-separated'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body content'),
    cc: z.string().optional().describe('CC recipient email(s), comma-separated'),
    bcc: z.string().optional().describe('BCC recipient email(s), comma-separated'),
    contentType: z.enum(['text', 'html']).default('text').describe('Body content type: text or html'),
    saveToSentItems: z.boolean().default(true).describe('Save to Sent Items folder'),
  }),

  cliMappings: {
    options: [
      { field: 'to', flags: '--to <emails>', description: 'Recipient(s), comma-separated' },
      { field: 'subject', flags: '--subject <text>', description: 'Email subject' },
      { field: 'body', flags: '--body <text>', description: 'Email body' },
      { field: 'cc', flags: '--cc <emails>', description: 'CC recipient(s)' },
      { field: 'bcc', flags: '--bcc <emails>', description: 'BCC recipient(s)' },
      { field: 'contentType', flags: '--content-type <type>', description: 'text (default) or html' },
      { field: 'saveToSentItems', flags: '--no-save', description: 'Do not save to Sent Items' },
    ],
  },

  endpoint: { method: 'POST', path: '/me/sendMail' },
  fieldMappings: {},

  handler: async (input, client: GraphClient) => {
    const toRecipients = parseEmailList(String(input.to));
    const ccRecipients = input.cc ? parseEmailList(String(input.cc)) : [];
    const bccRecipients = input.bcc ? parseEmailList(String(input.bcc)) : [];

    await client.post('/me/sendMail', {
      message: {
        subject: input.subject,
        body: {
          contentType: input.contentType === 'html' ? 'HTML' : 'Text',
          content: input.body,
        },
        toRecipients,
        ccRecipients,
        bccRecipients,
      },
      saveToSentItems: input.saveToSentItems,
    });

    return {
      sent: true,
      to: input.to,
      subject: input.subject,
    };
  },
};

function parseEmailList(emails: string) {
  return emails.split(',').map((e) => ({
    emailAddress: { address: e.trim() },
  }));
}
