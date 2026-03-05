# Claude Code Instructions — ms365-cli

## Project Overview

`ms365-cli` is a CLI and MCP server for Microsoft 365 productivity APIs (Mail, Calendar, OneDrive, Contacts) via the Microsoft Graph API. It wraps Graph API endpoints into a JSON-first terminal CLI and an MCP server for AI assistants.

**Dual interface, single codebase:** Every API endpoint is defined once as a `CommandDefinition` object that powers both the CLI subcommand and the MCP tool automatically.

**Inspired by:** [bcharleson/instantly-cli](https://github.com/bcharleson/instantly-cli) architecture.

---

## Architecture

### CommandDefinition Pattern

Every API endpoint lives in `src/commands/<group>/<subcommand>.ts` and exports a single `CommandDefinition`:

```typescript
interface CommandDefinition {
  name: string;           // MCP tool name: "mail_list"
  group: string;          // CLI group: "mail"
  subcommand: string;     // CLI subcommand: "list"
  description: string;    // Shared --help text and MCP description
  inputSchema: ZodObject; // Validates CLI flags AND MCP tool input
  cliMappings: {
    args?: [...];         // Positional CLI arguments
    options?: [...];      // Named CLI flags
  };
  endpoint: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;         // Graph API path, e.g. "/me/messages/{id}"
  };
  fieldMappings: {
    [field]: 'path' | 'query' | 'odata' | 'body';
  };
  handler: (input, client) => Promise<unknown>;
}
```

**Field mapping locations:**
- `path` — interpolated into URL (`{id}` → `encodeURIComponent(value)`)
- `query` — appended as regular query string params (e.g. `startDateTime`)
- `odata` — appended as OData params (e.g. `$top`, `$filter`, `$select`, `$search`)
- `body` — included in JSON request body

**Adding a new endpoint = one new file + add to `allCommands` in `src/commands/index.ts`.**

---

### Key Files

| File | Purpose |
|---|---|
| `src/core/types.ts` | `CommandDefinition`, `GraphClient` interfaces, shared types |
| `src/core/client.ts` | Graph API HTTP client — auth header injection, retry, rate limit, pagination |
| `src/core/auth.ts` | MSAL device code flow + silent token refresh from `~/.m365/token-cache.json` |
| `src/core/config.ts` | `~/.m365/config.json` manager, token cache paths, default scopes |
| `src/core/handler.ts` | `executeCommand()` — builds HTTP requests from `CommandDefinition` + parsed input |
| `src/core/output.ts` | JSON stdout output, `--fields` filtering, `--quiet`, `--pretty` |
| `src/core/errors.ts` | Typed error classes: `AuthError`, `NotFoundError`, `ValidationError`, `RateLimitError`, `ServerError` |
| `src/commands/index.ts` | Command registry (`allCommands`), `registerAllCommands()`, input validation, CLI wiring |
| `src/mcp/server.ts` | MCP server — auto-registers all `CommandDefinition`s as tools via stdio transport |
| `src/index.ts` | CLI entry point |
| `src/mcp.ts` | Direct MCP entry point |

### Directory Structure

```
src/
├── index.ts                 # CLI entry point
├── mcp.ts                   # MCP entry point
├── core/                    # Shared infrastructure
│   ├── types.ts             # Interfaces
│   ├── client.ts            # Graph API HTTP client
│   ├── auth.ts              # MSAL auth
│   ├── config.ts            # ~/.m365/ config + token cache
│   ├── handler.ts           # executeCommand()
│   ├── output.ts            # JSON output
│   └── errors.ts            # Error classes
├── commands/
│   ├── index.ts             # Registry + registerAllCommands()
│   ├── auth/                # login, logout, status (special — no API client)
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── status.ts
│   ├── mail/                # 8 commands
│   │   ├── list.ts
│   │   ├── get.ts
│   │   ├── send.ts
│   │   ├── reply.ts
│   │   ├── search.ts
│   │   ├── move.ts
│   │   ├── delete.ts
│   │   ├── unread-count.ts
│   │   └── index.ts
│   ├── calendar/            # 5 commands
│   ├── drive/               # 4 commands
│   ├── contacts/            # 4 commands
│   └── mcp/                 # mcp command registration
│       └── index.ts
└── mcp/
    └── server.ts            # MCP stdio server
skills/
├── m365-mail/SKILL.md
├── m365-calendar/SKILL.md
├── m365-drive/SKILL.md
└── m365-contacts/SKILL.md
```

---

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript (ESM, strict) | Language |
| Node.js 18+ | Runtime (target node18 in tsup) |
| Commander.js | CLI framework |
| Zod v4 | Input validation — shared between CLI and MCP |
| @azure/msal-node | MSAL auth — device code flow + token cache |
| @modelcontextprotocol/sdk | MCP server (stdio transport) |
| @inquirer/prompts | Interactive prompts — login only, dynamically imported |
| tsup | Bundler — two entry points: index.ts, mcp.ts |
| vitest | Testing |

---

## Development Commands

```bash
npm run build      # Build with tsup → dist/
npm run dev        # Run CLI with tsx (no build needed)
npm run typecheck  # TypeScript type-checking (tsc --noEmit)
npm test           # Run vitest
```

---

## Microsoft Graph API — Key Conventions

- **Base URL:** `https://graph.microsoft.com/v1.0`
- **Auth:** `Authorization: Bearer <token>` + `ConsistencyLevel: eventual` header
- **Pagination:** OData `@odata.nextLink` — the `GraphClient.paginate()` method handles this
- **OData params:** `$filter`, `$select`, `$top`, `$skip`, `$orderby`, `$search`, `$expand`
- **Mail search:** Uses `$search` with KQL syntax (not `$filter`) — wrap value in quotes: `$search="from:alice"`
- **Calendar range queries:** Use `calendarView` endpoint with `startDateTime` + `endDateTime` as plain query params (not OData)
- **DELETE responses:** Return 204 No Content — the client returns `undefined as T` for 204
- **Rate limits:** Graph API throttles at ~120 requests/minute per user — the client handles 429 with retry-after backoff

---

## Adding New Commands

1. Create `src/commands/<group>/<subcommand>.ts`
2. Export a `CommandDefinition` object — follow an existing command as a template
3. Export it from `src/commands/<group>/index.ts`
4. Import it and push to `allCommands` in `src/commands/index.ts`
5. Run `npm run build && npm run typecheck`

### Use `executeCommand()` for standard CRUD

```typescript
import { executeCommand } from '../../core/handler.js';

export const mailGetCommand: CommandDefinition = {
  // ...
  endpoint: { method: 'GET', path: '/me/messages/{id}' },
  fieldMappings: { id: 'path' },
  handler: (input, client) => executeCommand(mailGetCommand, input, client),
};
```

### Write custom handlers when Graph requires special request shaping

```typescript
handler: async (input, client: GraphClient) => {
  // e.g., for sendMail — body has a nested structure Graph requires
  return client.post('/me/sendMail', {
    message: {
      subject: input.subject,
      body: { contentType: 'Text', content: input.body },
      toRecipients: [{ emailAddress: { address: String(input.to) } }],
    },
    saveToSentItems: true,
  });
},
```

---

## Important Conventions

### Input types from Zod schema
When accessing `input` fields in a custom handler, always cast to `String()`, `Number()`, or `Boolean()` before use:

```typescript
// ✅ Correct
encodeURIComponent(String(input.id))
String(input.to).split(',')
Number(input.top)

// ❌ Wrong — TypeScript infers 'unknown' from ZodObject shape
encodeURIComponent(input.id)
```

### Auth commands are special
Auth commands (`login`, `logout`, `status`) are registered directly — they do NOT go into `allCommands` and do NOT get an API client. Register them manually in `registerAllCommands()` in `src/commands/index.ts`.

### @inquirer/prompts must be dynamically imported
It's marked as `external` in `tsup.config.ts` for Node 18 compatibility. Only use it in auth commands via `await import('@inquirer/prompts')`.

### All output is JSON to stdout
- **Never** use `console.log` for debug output in command handlers
- Command results → `output(result, globalOpts)` (goes to stdout)
- Errors → `outputError(error, globalOpts)` (goes to stderr as JSON `{"error":"...","code":"..."}`)

### OData field mapping
Fields mapped as `'odata'` in `fieldMappings` are automatically prefixed with `$`:

```typescript
// In handler.ts — ODATA_PREFIX maps field names to OData param names
filter → $filter
select → $select
top    → $top
skip   → $skip
search → $search
```

This means field names in `inputSchema` should be `filter`, `select`, `top` (not `$filter`).

---

## Do Not

- **Do not** add `@inquirer/prompts` as a static import — always dynamic `await import()`
- **Do not** use `console.log` for anything other than structured output in command handlers
- **Do not** add interactive prompts to API commands — only `login` should be interactive
- **Do not** create new command files without adding them to `allCommands` in `src/commands/index.ts`
- **Do not** hardcode access tokens — always use `getAccessToken()` from `src/core/auth.ts`
- **Do not** store credentials in source files — they live in `~/.m365/` (chmod 600)
- **Do not** modify output format — agents and scripts depend on JSON to stdout

---

## Error Handling

The client throws typed errors — catch them in handlers or let them bubble to `outputError()`:

```typescript
import { AuthError, NotFoundError, ValidationError, RateLimitError, ServerError } from '../../core/errors.js';

// These are all thrown by GraphClient automatically:
// 401/403 → AuthError
// 404     → NotFoundError
// 400/422 → ValidationError
// 429     → RateLimitError (with retryAfter)
// 5xx     → ServerError
```

---

## MCP Server

`src/mcp/server.ts` iterates `allCommands` and registers each as an MCP tool using the Zod schema shape directly. The tool name is `cmdDef.name` (e.g., `mail_list`, `calendar_create`).

To add a command to the MCP server: just add it to `allCommands`. No other changes needed.

---

## Publishing

```bash
# Bump version in package.json first, then:
npm run build
npm publish --access public --otp=<2fa-code>

# Tag the release
git tag v0.x.x
git push origin v0.x.x
```
