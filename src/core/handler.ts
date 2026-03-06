import type { CommandDefinition, GraphClient } from './types.js';

/**
 * Removes OData metadata properties (e.g. @odata.context, @odata.count) from a
 * Graph API response object. Keeps @odata.nextLink intact so callers can still
 * detect pagination if needed, but strips presentational noise from CLI output.
 */
export function stripODataMetadata(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const KEEP_KEYS = new Set(['@odata.nextLink']);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (!key.startsWith('@odata.') || KEEP_KEYS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

const ODATA_PREFIX: Record<string, string> = {
  filter: '$filter',
  select: '$select',
  top: '$top',
  skip: '$skip',
  orderby: '$orderby',
  search: '$search',
  count: '$count',
  expand: '$expand',
};

/**
 * Builds a Graph API request from a CommandDefinition and its parsed input,
 * then executes it via the client.
 */
export async function executeCommand(
  cmdDef: CommandDefinition,
  input: Record<string, any>,
  client: GraphClient,
): Promise<unknown> {
  let path = cmdDef.endpoint.path;
  const query: Record<string, any> = {};
  const body: Record<string, any> = {};

  for (const [field, location] of Object.entries(cmdDef.fieldMappings)) {
    const value = input[field];
    if (value === undefined || value === null) continue;

    switch (location) {
      case 'path':
        path = path.replace(`{${field}}`, encodeURIComponent(String(value)));
        break;
      case 'query':
        query[field] = value;
        break;
      case 'odata': {
        const paramName = ODATA_PREFIX[field] ?? `$${field}`;
        query[paramName] = value;
        break;
      }
      case 'body':
        body[field] = value;
        break;
    }
  }

  return client.request({
    method: cmdDef.endpoint.method,
    path,
    query: Object.keys(query).length > 0 ? query : undefined,
    body: Object.keys(body).length > 0 ? body : undefined,
  });
}
