import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';

const BINARY_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/octet-stream',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
]);

export const mailAttachmentsGetCommand: CommandDefinition = {
  name: 'mail_attachments_get',
  group: 'mail',
  subcommand: 'attachments-get',
  description:
    'Download an attachment from a message. Use --output-file to save to disk. ' +
    'Without --output-file, returns base64 contentBytes in JSON (useful for MCP agents). ' +
    'Supports .pdf, .xlsx, .docx, .doc, images, zip, and any other attachment type.',
  examples: [
    'm365 mail attachments-get AAMkAGI2TG93AAA= AAMkAGI2TG94BBB= --output-file ./resume.pdf',
    'm365 mail attachments-get AAMkAGI2TG93AAA= AAMkAGI2TG94BBB= --output-file ./report.xlsx',
    'm365 mail attachments-get AAMkAGI2TG93AAA= AAMkAGI2TG94BBB=',
  ],

  inputSchema: z.object({
    messageId: z.string().describe('Message ID'),
    attachmentId: z.string().describe('Attachment ID (from attachments-list)'),
    outputFile: z.string().optional()
      .describe('Local path to save the file. If omitted, contentBytes is returned as base64 in JSON.'),
  }),

  cliMappings: {
    args: [
      { field: 'messageId', name: 'messageId', required: true },
      { field: 'attachmentId', name: 'attachmentId', required: true },
    ],
    options: [
      { field: 'outputFile', flags: '--output-file <path>', description: 'Save attachment to this local path' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/messages/{messageId}/attachments/{attachmentId}' },
  fieldMappings: { messageId: 'path', attachmentId: 'path' },

  handler: async (input, client: GraphClient) => {
    const attachment = await client.get<{
      name: string;
      contentType: string;
      size: number;
      contentBytes?: string;
    }>(
      `/me/messages/${encodeURIComponent(String(input.messageId))}/attachments/${encodeURIComponent(String(input.attachmentId))}`,
    );

    const { name, contentType, size, contentBytes } = attachment;

    if (input.outputFile) {
      if (!contentBytes) {
        return { name, contentType, size, saved: false, reason: 'No content bytes returned by Graph API' };
      }
      const outputPath = resolve(String(input.outputFile));
      const isBinary = BINARY_MIME_TYPES.has(contentType) || !contentType.startsWith('text/');
      const buffer = isBinary
        ? Buffer.from(contentBytes, 'base64')
        : Buffer.from(Buffer.from(contentBytes, 'base64').toString('utf8'));
      await writeFile(outputPath, buffer);
      return { name, contentType, size, saved: true, path: outputPath };
    }

    return { name, contentType, size, contentBytes };
  },
};
