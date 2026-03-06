import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { CommandDefinition, GraphClient } from '../../core/types.js';
import { ValidationError } from '../../core/errors.js';

export const driveDownloadCommand: CommandDefinition = {
  name: 'drive_download',
  group: 'drive',
  subcommand: 'download',
  description:
    'Download a file from OneDrive to a local path. ' +
    'Supports all file types including .pdf, .xlsx, .docx, .doc, images, and zip files. ' +
    'Fetches a pre-signed download URL from Graph and streams the binary content to disk.',
  examples: [
    'm365 drive download 01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K --output-file ./report.pdf',
    'm365 drive download 01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K --output-file ./budget.xlsx',
    'm365 drive download --path "/Documents/contract.docx" --output-file ./contract.docx',
    'm365 drive download --path "/Documents/report.pdf"',
  ],

  inputSchema: z.object({
    id: z.string().optional().describe('Item ID'),
    path: z.string().optional().describe('Item path, e.g. /Documents/report.pdf'),
    outputFile: z.string().optional()
      .describe('Local path to save the file. Defaults to the original filename in the current directory.'),
  }),

  cliMappings: {
    args: [{ field: 'id', name: 'id', required: false }],
    options: [
      { field: 'path', flags: '--path <path>', description: 'Item path, e.g. /Documents/report.pdf' },
      { field: 'outputFile', flags: '--output-file <path>', description: 'Save to this path (default: original filename in cwd)' },
    ],
  },

  endpoint: { method: 'GET', path: '/me/drive/items/{id}' },
  fieldMappings: { id: 'path' },

  handler: async (input, client: GraphClient) => {
    if (!input.id && !input.path) {
      throw new ValidationError('Provide an item ID (positional argument) or --path');
    }

    const metaPath = input.path
      ? `/me/drive/root:${String(input.path)}`
      : `/me/drive/items/${encodeURIComponent(String(input.id))}`;

    const meta = await client.get<{
      name: string;
      size: number;
      file?: { mimeType: string };
      '@microsoft.graph.downloadUrl'?: string;
    }>(metaPath);

    const downloadUrl = meta['@microsoft.graph.downloadUrl'];
    if (!downloadUrl) {
      throw new ValidationError(
        `"${meta.name}" has no downloadable content — it may be a folder. Use 'drive list' to browse its contents.`,
      );
    }

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed (${response.status}): ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = resolve(String(input.outputFile ?? meta.name));
    await writeFile(outputPath, buffer);

    return {
      name: meta.name,
      contentType: meta.file?.mimeType ?? 'application/octet-stream',
      size: buffer.length,
      path: outputPath,
    };
  },
};
