# ms365-cli

**Microsoft 365 in your terminal.** Read and send email, manage calendar events, browse OneDrive, and search contacts — from a single command line.

JSON-first output. Every command doubles as an MCP tool. Built for humans, scripts, CI/CD pipelines, and AI agents.

```bash
npm install -g ms365-cli
```

---

## What This CLI Enables

**Mail** — list inbox, read messages, send email, reply, search with KQL, move, and delete.

**Calendar** — list events, create meetings (including Teams), update, delete, and filter by date range.

**OneDrive** — browse files, search, get metadata, and delete items.

**Contacts** — list, search, get, and create Outlook contacts.

**MCP Server** — every command is available as a structured AI tool for Claude, Cursor, OpenClaw, or any MCP-compatible client.

---

## Setup (5 minutes)

### Step 1 — Install

```bash
npm install -g ms365-cli
```

### Step 2 — Register an Azure AD App

You need a free Azure AD app to authenticate. This is a one-time setup.

1. Go to **[portal.azure.com → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)**
2. Click **New registration**
   - **Name:** anything (e.g. `ms365-cli`)
   - **Supported account types:** Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI:** Select `Mobile and desktop applications` → enter `http://localhost`
3. Click **Register** — copy the **Application (client) ID** and **Directory (tenant) ID**
4. Go to **API permissions → Add a permission → Microsoft Graph → Delegated permissions**
   - Search and add each: `Mail.ReadWrite`, `Mail.Send`, `Calendars.ReadWrite`, `Files.ReadWrite`, `Contacts.ReadWrite`, `User.Read`
   - Click **Add permissions**
5. Click **Grant admin consent for [your org]** — all permissions should show a green checkmark
6. Go to **Authentication → Advanced settings** → set **Allow public client flows** to **Yes** → **Save**

### Step 3 — Login

```bash
m365 login --client-id <your-application-client-id> --tenant-id <your-directory-tenant-id>
```

This prints a URL and a code:

```
To sign in, use a web browser to open https://microsoft.com/devicelogin
and enter the code XXXXXXXX to authenticate.
```

Open the URL in a browser, enter the code, sign in with your Microsoft account. Done — tokens are cached at `~/.m365/token-cache.json` and silently refreshed from then on.

> **Tip:** Set env vars to avoid passing flags every time:
> ```bash
> export M365_CLIENT_ID="your-client-id"
> export M365_TENANT_ID="your-tenant-id"
> m365 login
> ```

### Step 4 — Verify

```bash
m365 status --pretty
# → {"authenticated":true,"account":"you@example.com",...}

m365 mail unread-count
# → {"folder":"Inbox","unread":4,"total":12}
```

You're in. All commands are now available.

---

## Quick Start

```bash
# Check unread email
m365 mail unread-count

# Read inbox
m365 mail list --pretty

# Search for a message
m365 mail search "from:alice@company.com subject:proposal"

# Send an email
m365 mail send --to client@example.com --subject "Hello" --body "Looking forward to connecting"

# Today's calendar
m365 calendar list --start $(date -u +%Y-%m-%dT00:00:00Z) --pretty

# Create a meeting
m365 calendar create \
  --subject "Discovery Call" \
  --start 2026-03-15T13:00:00 \
  --end 2026-03-15T14:00:00 \
  --timezone "America/New_York" \
  --attendees "prospect@company.com" \
  --online-meeting

# Browse OneDrive
m365 drive list --pretty

# Search files
m365 drive search "quarterly report"
```

---

## Commands

### Auth

```bash
m365 auth login [--client-id <id>] [--tenant-id <id>]
m365 auth logout
m365 auth status
```

### Mail (8 commands)

```bash
m365 mail list [--top <n>] [--folder <name>] [--filter <odata>] [--select <fields>]
m365 mail get <id>
m365 mail send --to <emails> --subject <text> --body <text> [--cc] [--bcc] [--content-type html]
m365 mail reply <id> --body <text> [--reply-all]
m365 mail search <query>
m365 mail move <id> --destination <folder>
m365 mail delete <id>
m365 mail unread-count [--folder <name>]
```

### Calendar (5 commands)

```bash
m365 calendar list [--start <iso>] [--end <iso>] [--top <n>] [--filter <odata>]
m365 calendar get <id>
m365 calendar create --subject <text> --start <iso> --end <iso> [--attendees <emails>] [--online-meeting]
m365 calendar update <id> [--subject] [--start] [--end] [--location]
m365 calendar delete <id>
```

### Drive (4 commands)

```bash
m365 drive list [--folder-id <id>] [--top <n>]
m365 drive get <id> | --path <path>
m365 drive search <query>
m365 drive delete <id>
```

### Contacts (4 commands)

```bash
m365 contacts list [--top <n>] [--filter <odata>]
m365 contacts get <id>
m365 contacts search <query>
m365 contacts create --given <name> [--surname] [--email] [--phone] [--company]
```

---

## Output

All commands output compact JSON by default — pipe to `jq`, save to files, or feed to other tools.

```bash
# Pretty print
m365 mail list --pretty

# Filter with jq
m365 mail list --filter "isRead eq false" | jq '.value[] | {id, subject, from: .from.emailAddress.address}'

# Select specific fields
m365 mail list --select "id,subject,from,receivedDateTime"

# Quiet mode (exit code only)
m365 mail send --to a@b.com --subject "Hi" --body "Hey" --quiet
```

---

## MCP Server

Every command is available as an MCP (Model Context Protocol) tool for AI assistants.

```bash
m365 mcp
```

### Configure in Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "m365": {
      "command": "npx",
      "args": ["ms365-cli", "mcp"],
      "env": {
        "M365_CLIENT_ID": "your-azure-app-client-id"
      }
    }
  }
}
```

### Configure for OpenClaw agents

```bash
# Symlink skills
ln -s $(pwd)/skills/m365-* ~/.openclaw/skills/

# Or install all at once
npx skills add https://github.com/bcharleson/ms365-cli
```

---

## Agent Skills

Skills are `SKILL.md` files that teach AI agents how to use this CLI:

| Skill | Covers |
|-------|--------|
| `skills/m365-mail/` | Read inbox, send, search, reply |
| `skills/m365-calendar/` | List events, create meetings, update |
| `skills/m365-drive/` | Browse, search, download files |
| `skills/m365-contacts/` | List, search, create contacts |

---

## OpenClaw Agent Setup

To give an [OpenClaw](https://openclaw.ai) agent access to Microsoft 365, install `ms365-cli` on the agent's droplet and authenticate once. The agent can then call all commands via its `exec` tool.

### 1 — Install on the agent's server

```bash
npm install -g ms365-cli
```

### 2 — Authenticate as the agent's email account

```bash
# Run as the tofu service user
su - tofu -c 'm365 login --client-id <client-id> --tenant-id <tenant-id>'
```

Follow the device code prompt — open the URL in a browser, sign in as the agent's email account. Tokens are cached at `~/.m365/token-cache.json` for the `tofu` user.

### 3 — Install skills into OpenClaw

```bash
# Symlink all ms365 skills (stays in sync with repo updates)
ln -s /path/to/ms365-cli/skills/m365-* ~/.openclaw/skills/

# Or copy specific skills
cp -r /path/to/ms365-cli/skills/m365-mail ~/.openclaw/skills/
cp -r /path/to/ms365-cli/skills/m365-calendar ~/.openclaw/skills/
```

### 4 — Add email instructions to the agent's SOUL.md

Add a section like this to the agent's `SOUL.md` so it knows how to use email:

```markdown
## Email Access

You have full access to your Outlook inbox via the `m365` CLI. Use the `exec` tool.

### Check inbox
m365 mail unread-count
m365 mail list --filter "isRead eq false" --top 20 --pretty

### Send email
m365 mail send --to recipient@example.com --subject "Subject" --body "Body"

### Reply
m365 mail reply <message-id> --body "Your reply here"

### Search
m365 mail search "from:someone@company.com"
```

### 5 — Test from the agent's Slack channel

Ask the agent:
> "Check my email and tell me what's unread"

The agent will call `m365 mail list --filter "isRead eq false"` via exec and report back.

---

### Re-authentication

Tokens are long-lived but will eventually expire. If the agent reports auth errors:

```bash
# Re-run login from the server
ssh root@<droplet-ip> "su - tofu -c 'm365 login --client-id <id> --tenant-id <id>'"
# Follow device code flow again
```

> **Tip for MFA accounts:** Add the agent's email to your Microsoft Authenticator app so you can approve re-auth prompts without needing the client's help.

---

## Development

```bash
git clone https://github.com/bcharleson/ms365-cli.git
cd ms365-cli
npm install
npm run dev -- auth status
npm run build
npm test
npm run typecheck
```

### Architecture

Every API endpoint is a `CommandDefinition` object — one source of truth that powers both the CLI subcommand and the MCP tool:

```
src/
├── core/
│   ├── types.ts      # CommandDefinition, GraphClient interfaces
│   ├── client.ts     # Graph API HTTP client (retry, rate limit, pagination)
│   ├── auth.ts       # MSAL device code flow + silent refresh
│   ├── config.ts     # ~/.m365/ config and token cache
│   ├── errors.ts     # Typed error classes
│   ├── output.ts     # JSON output + field filtering
│   └── handler.ts    # executeCommand (path/query/odata/body mapping)
├── commands/
│   ├── mail/         # 8 commands
│   ├── calendar/     # 5 commands
│   ├── drive/        # 4 commands
│   └── contacts/     # 4 commands
└── mcp/
    └── server.ts     # MCP server (auto-registers all commands as tools)
```

Adding a new endpoint = one new file. It's automatically available in both CLI and MCP.

---

## License

MIT

## Inspired by

- [bcharleson/ms365-cli](https://github.com/bcharleson/ms365-cli) — this repo
- [bcharleson/instantly-cli](https://github.com/bcharleson/instantly-cli) — architecture pattern
- [googleworkspace/cli](https://github.com/googleworkspace/cli) — the Google equivalent
- [steipete/gogcli](https://github.com/steipete/gogcli) — productivity-first approach
