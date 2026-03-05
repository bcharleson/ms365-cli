import { z } from 'zod';

export interface CliMapping {
  args?: Array<{
    field: string;
    name: string;
    required?: boolean;
  }>;
  options?: Array<{
    field: string;
    flags: string;
    description?: string;
  }>;
}

export interface CommandDefinition<TInput extends z.ZodObject<any> = z.ZodObject<any>> {
  /** Unique identifier — used as MCP tool name. e.g., "mail_list" */
  name: string;

  /** CLI group. e.g., "mail" */
  group: string;

  /** CLI subcommand. e.g., "list" */
  subcommand: string;

  /** Human-readable description (used in --help AND MCP tool description) */
  description: string;

  /** Detailed examples for --help output */
  examples?: string[];

  /** Zod schema defining all inputs */
  inputSchema: TInput;

  /** Maps Zod fields to CLI constructs */
  cliMappings: CliMapping;

  /** HTTP method and Graph API path template */
  endpoint: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
  };

  /**
   * Where each input field goes in the request.
   * - path: interpolated into URL path (e.g., {id})
   * - query: appended as query string
   * - odata: appended as OData query param (e.g., $filter, $top, $select)
   * - body: included in JSON request body
   */
  fieldMappings: Record<string, 'path' | 'query' | 'odata' | 'body'>;

  /** The handler function */
  handler: (input: z.infer<TInput>, client: GraphClient) => Promise<unknown>;
}

export interface GraphClient {
  request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }): Promise<T>;

  get<T>(path: string, query?: Record<string, any>): Promise<T>;
  post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export interface GraphPagedResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
}

export interface M365Config {
  client_id: string;
  tenant_id?: string;
  account?: string;
}

export interface GlobalOptions {
  output?: 'json' | 'pretty';
  quiet?: boolean;
  fields?: string;
  pretty?: boolean;
}
