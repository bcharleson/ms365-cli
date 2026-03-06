import { readFile, stat } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';
import { ValidationError } from '../../core/errors.js';

const MAX_INLINE_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3 MB — Graph API inline limit

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.md': 'text/markdown',
};

export const mailSendCommand: CommandDefinition = {
  name: 'mail_send',
  group: 'mail',
  subcommand: 'send',
  description: 'Send a new email message.',
  examples: [
    'm365 mail send --to alice@example.com --subject "Hello" --body "Hi there"',
    'm365 mail send --to "a@b.com,c@d.com" --subject "Team update" --body "See attached" --cc boss@example.com',
    'm365 mail send --to alice@example.com --subject "Hi" --body "<h1>Hello</h1>" --content-type html',
    'm365 mail send --to hr@co.com --subject "Resume" --body "Please find attached." --attachment /path/to/resume.pdf',
    'm365 mail send --to client@co.com --subject "Docs" --body "Two files attached." --attachment "brief.pdf,spec.docx"',
  ],

  inputSchema: z.object({
    to: z.string().describe('Recipient email(s), comma-separated'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body content'),
    cc: z.string().optional().describe('CC recipient email(s), comma-separated'),
    bcc: z.string().optional().describe('BCC recipient email(s), comma-separated'),
    contentType: z.enum(['text', 'html']).default('text').describe('Body content type: text or html'),
    saveToSentItems: z.boolean().default(true).describe('Save to Sent Items folder'),
    attachment: z.string().optional()
      .describe('File path(s) to attach, comma-separated. Max 3 MB per file.'),
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
      { field: 'attachment', flags: '--attachment <files>', description: 'File path(s) to attach, comma-separated (max 3 MB each)' },
    ],
  },

  endpoint: { method: 'POST', path: '/me/sendMail' },
  fieldMappings: {},

  handler: async (input, client: GraphClient) => {
    const toRecipients = parseEmailList(String(input.to));
    const ccRecipients = input.cc ? parseEmailList(String(input.cc)) : [];
    const bccRecipients = input.bcc ? parseEmailList(String(input.bcc)) : [];
    const attachments = input.attachment ? await buildAttachments(String(input.attachment)) : [];

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
        ...(attachments.length > 0 ? { attachments } : {}),
      },
      saveToSentItems: input.saveToSentItems,
    });

    return {
      sent: true,
      to: input.to,
      subject: input.subject,
      ...(attachments.length > 0 ? { attachments: attachments.map((a) => a.name) } : {}),
    };
  },
};

function parseEmailList(emails: string) {
  return emails.split(',').map((e) => ({
    emailAddress: { address: e.trim() },
  }));
}

async function buildAttachments(paths: string) {
  const filePaths = paths.split(',').map((p) => p.trim()).filter(Boolean);

  return Promise.all(
    filePaths.map(async (filePath) => {
      const absolutePath = resolve(filePath);
      const stats = await stat(absolutePath).catch(() => {
        throw new ValidationError(`Attachment not found: ${filePath}`);
      });

      if (stats.size > MAX_INLINE_ATTACHMENT_BYTES) {
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        throw new ValidationError(
          `Attachment "${basename(absolutePath)}" is ${sizeMB} MB — exceeds the 3 MB inline limit.`,
        );
      }

      const content = await readFile(absolutePath);
      const name = basename(absolutePath);
      const contentType = MIME_TYPES[extname(name).toLowerCase()] ?? 'application/octet-stream';

      return {
        '@odata.type': '#microsoft.graph.fileAttachment',
        name,
        contentType,
        contentBytes: content.toString('base64'),
      };
    }),
  );
}

