# AI Agent Guide — ms365-cli

> This file helps AI agents (Claude, GPT, Gemini, open-source models, OpenClaw, etc.) install, authenticate, and use the ms365-cli to manage Microsoft 365 Mail, Calendar, OneDrive, and Contacts via the Microsoft Graph API.

## Quick Start

```bash
# Install globally
npm install -g ms365-cli

# Set credentials (non-interactive — best for agents on a server)
export M365_CLIENT_ID="your-azure-app-client-id"
export M365_TENANT_ID="your-tenant-id"  # or "common" for personal/multi-tenant

# Login (device code flow — run once, tokens cached at ~/.m365/token-cache.json)
m365 auth login

# Verify auth
m365 auth status

# Start using it
m365 mail unread-count
m365 mail list --pretty
m365 calendar list --pretty
```

**Requirements:** Node.js 18+, an Azure AD app registration (see Setup below)

---

## Authentication

ms365-cli uses Microsoft's **device code flow** (MSAL). You authenticate once and tokens are silently refreshed from `~/.m365/token-cache.json`.

### Setup — Register an Azure AD App

1. Go to https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
2. Click **New registration**
   - Name: anything (e.g. `ms365-cli`)
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Mobile/desktop → `http://localhost`
3. Copy the **Application (client) ID** and **Directory (tenant) ID**
4. Go to **API permissions → Add → Microsoft Graph → Delegated** and add:
   - `Mail.ReadWrite`, `Mail.Send`, `Calendars.ReadWrite`, `Files.ReadWrite`, `Contacts.ReadWrite`, `User.Read`
5. Click **Grant admin consent**
6. Go to **Authentication → Advanced settings** → enable **Allow public client flows** → Save

### Login

```bash
# Via env vars (recommended for agents)
export M365_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export M365_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
m365 auth login

# Or pass flags directly
m365 auth login --client-id <id> --tenant-id <id>
```

The device code prompt will print a URL and code. Open the URL in a browser, enter the code, sign in. Done — tokens are cached.

### Check status

```bash
m365 auth status
# → {"authenticated":true,"account":"user@example.com","tenant_id":"..."}
```

---

## Output Format

All commands output **JSON to stdout** by default — ready for parsing by agents and scripts:

```bash
# Default: compact JSON
m365 mail list
# → {"value":[{"id":"AAMk...","subject":"Hello","from":{...},...}], ...}

# Pretty-printed JSON
m365 mail list --pretty

# Select specific fields
m365 mail list --fields id,subject,from

# Suppress output (exit code only)
m365 mail send --to a@b.com --subject "Hi" --body "Hey" --quiet
```

**Exit codes:** 0 = success, 1 = error. Errors go to stderr as JSON:
```json
{"error":"Not logged in or token expired. Run: m365 auth login","code":"AUTH_ERROR"}
```

---

## Discovering Commands

```bash
# List all command groups
m365 --help

# List subcommands in a group
m365 mail --help
m365 calendar --help

# Get help for a specific command (shows options + examples)
m365 mail send --help
m365 calendar create --help
```

---

## All Command Groups & Subcommands

### auth
Authentication management.
```
login     Authenticate via device code flow (opens browser)
logout    Remove stored credentials and token cache
status    Show current auth state (account, tenant, client ID)
```

### mail
Read, search, send, and manage Outlook email.
```
list          List messages in a folder (default: inbox)
get           Get a message by ID (includes full body)
send          Send a new email
reply         Reply to a message (supports --reply-all)
search        Search messages using KQL across all folders
move          Move a message to a different folder
delete        Delete a message (moves to Deleted Items)
unread-count  Get unread message count for a folder
```

### calendar
Manage Outlook calendar events.
```
list    List events (default: next 7 days)
get     Get an event by ID
create  Create a new event (supports Teams meetings, attendees)
update  Update an existing event
delete  Delete an event
```

### drive
Browse and manage OneDrive files.
```
list    List files in root or a specific folder
get     Get file/folder metadata by ID or path
search  Search files by name or content
delete  Delete a file or folder
```

### contacts
Manage Outlook contacts.
```
list    List contacts
get     Get a contact by ID
search  Search contacts by name or email
create  Create a new contact
```

### mcp
```
mcp     Start the MCP server — exposes all commands as AI tools
```

---

## Command Reference

### Mail

```bash
# List inbox (default: 10 messages)
m365 mail list
m365 mail list --top 25
m365 mail list --folder sentitems
m365 mail list --folder drafts
m365 mail list --filter "isRead eq false"
m365 mail list --filter "receivedDateTime ge 2026-03-01T00:00:00Z"
m365 mail list --select "id,subject,from,receivedDateTime,isRead"
m365 mail list --orderby "receivedDateTime desc"

# Get a message (full body included)
m365 mail get <id>
m365 mail get <id> --pretty

# Send email
m365 mail send --to recipient@example.com --subject "Hello" --body "Message"
m365 mail send --to "a@b.com,c@d.com" --subject "Team" --cc boss@co.com --body "Update"
m365 mail send --to a@b.com --subject "Hi" --body "<h1>Hello</h1>" --content-type html
m365 mail send --to a@b.com --subject "Hi" --body "Hey" --no-save  # Don't save to Sent Items

# Reply
m365 mail reply <id> --body "Thanks!"
m365 mail reply <id> --body "Looping everyone in" --reply-all

# Search (KQL — Keyword Query Language)
m365 mail search "from:alice@company.com"
m365 mail search "subject:invoice"
m365 mail search "received>=2026-03-01 AND from:boss@co.com"
m365 mail search "project proposal" --top 20

# Move
m365 mail move <id> --destination archive
m365 mail move <id> --destination deleteditems
m365 mail move <id> --destination junkemail

# Delete
m365 mail delete <id>

# Unread count
m365 mail unread-count
m365 mail unread-count --folder inbox
```

### Calendar

```bash
# List events (default: next 7 days)
m365 calendar list
m365 calendar list --top 20
m365 calendar list --start 2026-03-01T00:00:00Z --end 2026-03-31T23:59:59Z
m365 calendar list --filter "subject eq 'Team Standup'"
m365 calendar list --select "id,subject,start,end,location,attendees"

# Get event
m365 calendar get <id>

# Create event
m365 calendar create --subject "Team Sync" --start 2026-03-10T14:00:00 --end 2026-03-10T15:00:00
m365 calendar create \
  --subject "Client Call" \
  --start 2026-03-10T09:00:00 \
  --end 2026-03-10T10:00:00 \
  --timezone "America/New_York" \
  --attendees "client@co.com,pm@co.com" \
  --location "Zoom" \
  --body "Looking forward to connecting"
m365 calendar create \
  --subject "Team Standup" \
  --start 2026-03-10T09:00:00 \
  --end 2026-03-10T09:30:00 \
  --online-meeting   # Creates Teams meeting link

# Update event
m365 calendar update <id> --subject "New Title"
m365 calendar update <id> --start 2026-03-10T15:00:00 --end 2026-03-10T16:00:00
m365 calendar update <id> --location "Conference Room A"

# Delete event
m365 calendar delete <id>
```

### Drive

```bash
# List root folder
m365 drive list
m365 drive list --top 50

# List a specific folder
m365 drive list --folder-id <item-id>

# Get file/folder metadata
m365 drive get <item-id>
m365 drive get --path "/Documents/report.pdf"

# Search files
m365 drive search "quarterly report"
m365 drive search "invoice" --top 20

# Delete
m365 drive delete <item-id>
```

### Contacts

```bash
# List
m365 contacts list
m365 contacts list --top 50
m365 contacts list --select "displayName,emailAddresses,mobilePhone"
m365 contacts list --orderby "displayName asc"

# Get
m365 contacts get <id>

# Search
m365 contacts search "Alice"
m365 contacts search "smith" --top 20

# Create
m365 contacts create --given "Jane" --surname "Doe" --email jane@example.com
m365 contacts create \
  --given "John" \
  --surname "Smith" \
  --email john@co.com \
  --phone "+1-555-0100" \
  --company "Acme Corp" \
  --job-title "VP Sales"
```

---

## Piping & Scripting

All output is JSON — chain with `jq` for powerful one-liners:

```bash
# Count unread emails
m365 mail unread-count | jq '.unread'

# List unread email subjects and senders
m365 mail list --filter "isRead eq false" \
  | jq '.value[] | {subject, from: .from.emailAddress.address}'

# Get today's meeting subjects
m365 calendar list \
  --start $(date -u +%Y-%m-%dT00:00:00Z) \
  --end $(date -u +%Y-%m-%dT23:59:59Z) \
  | jq '.value[].subject'

# Find all files matching a name
m365 drive search "report" | jq '.value[] | {name, size, id}'

# Send email to everyone in a contact search
m365 contacts search "Smith" | jq -r '.value[].emailAddresses[0].address' | while read email; do
  m365 mail send --to "$email" --subject "Hello" --body "Hi there"
done
```

---

## Common Workflows

### Check and triage email

```bash
# How many unread?
m365 mail unread-count

# List unread with just subject + sender
m365 mail list --filter "isRead eq false" \
  --select "id,subject,from,receivedDateTime" \
  --top 20 \
  --pretty

# Read a specific message
m365 mail get <id> --pretty

# Reply
m365 mail reply <id> --body "Thanks, I'll follow up tomorrow."

# Move to archive
m365 mail move <id> --destination archive
```

### Schedule a meeting

```bash
# Create a Teams meeting with external attendee
m365 calendar create \
  --subject "Discovery Call — Acme Corp" \
  --start 2026-03-15T13:00:00 \
  --end 2026-03-15T14:00:00 \
  --timezone "America/Chicago" \
  --attendees "prospect@acme.com" \
  --body "Looking forward to connecting. Teams link below." \
  --online-meeting \
  --pretty
```

### Search email history

```bash
# All emails from a contact this month
m365 mail search "from:alice@company.com received>=2026-03-01" --top 50

# All emails with invoice in subject
m365 mail search "subject:invoice" --top 100 --select "id,subject,receivedDateTime,from"
```

### Add a contact after a meeting

```bash
m365 contacts create \
  --given "Sarah" \
  --surname "Johnson" \
  --email sarah@targetcompany.com \
  --phone "+1-555-0199" \
  --company "Target Company" \
  --job-title "VP of Engineering" \
  --notes "Met at DevConf 2026. Interested in our platform."
```

---

## MCP Server (for Claude, Cursor, OpenClaw)

The CLI includes a built-in MCP server that exposes all 21 commands as structured tools:

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
        "M365_CLIENT_ID": "your-azure-app-client-id",
        "M365_TENANT_ID": "your-tenant-id"
      }
    }
  }
}
```

### Configure for OpenClaw agents

```bash
# Install agent skills
ln -s $(pwd)/skills/m365-* ~/.openclaw/skills/

# Or install via npx skills
npx skills add https://github.com/bcharleson/ms365-cli
```

---

## Microsoft Graph API — Key Details

- **Base URL:** `https://graph.microsoft.com/v1.0`
- **Auth:** `Authorization: Bearer <access_token>` (MSAL, auto-refreshed)
- **Pagination:** OData `@odata.nextLink` (handled automatically by the client)
- **Filtering:** OData `$filter`, `$select`, `$top`, `$orderby`, `$search`
- **Mail search:** Uses KQL (Keyword Query Language), not OData `$filter`
- **Docs:** https://learn.microsoft.com/en-us/graph/api/overview

### Key Graph endpoints used

| Command | Graph API endpoint |
|---|---|
| `mail list` | `GET /me/mailFolders/{folder}/messages` |
| `mail get` | `GET /me/messages/{id}` |
| `mail send` | `POST /me/sendMail` |
| `mail reply` | `POST /me/messages/{id}/reply` |
| `mail search` | `GET /me/messages?$search="..."` |
| `mail move` | `POST /me/messages/{id}/move` |
| `mail delete` | `DELETE /me/messages/{id}` |
| `calendar list` | `GET /me/calendarView?startDateTime=...&endDateTime=...` |
| `calendar get` | `GET /me/events/{id}` |
| `calendar create` | `POST /me/events` |
| `calendar update` | `PATCH /me/events/{id}` |
| `calendar delete` | `DELETE /me/events/{id}` |
| `drive list` | `GET /me/drive/root/children` |
| `drive get` | `GET /me/drive/items/{id}` |
| `drive search` | `GET /me/drive/root/search(q='...')` |
| `drive delete` | `DELETE /me/drive/items/{id}` |
| `contacts list` | `GET /me/contacts` |
| `contacts get` | `GET /me/contacts/{id}` |
| `contacts search` | `GET /me/contacts?$filter=startsWith(...)` |
| `contacts create` | `POST /me/contacts` |

---

## Tips for AI Agents

1. **Always check `auth status` first** before running commands — if not authenticated, run `auth login`
2. **JSON output is the default** — parse `.value[]` for list responses, direct object for single-item responses
3. **Use `--filter` for server-side filtering** — faster than fetching all and filtering locally
4. **Use `--select` to reduce payload size** — only fetch fields you need
5. **Use `--top` to control page size** — default is 10, max is 1000 for most endpoints
6. **Mail search uses KQL syntax** — `from:`, `subject:`, `received>=`, `hasAttachments:true`
7. **Calendar `list` uses `calendarView`** — requires `--start` and `--end` for best results (defaults to next 7 days)
8. **Drive `get --path`** accepts human-readable paths like `/Documents/report.pdf`
9. **Use `--pretty`** for readable output when debugging
10. **Use `--fields`** to extract specific top-level fields from JSON response
11. **Errors go to stderr** as `{"error":"message","code":"ERROR_CODE"}` — exit code 1
12. **Rate limits** are handled automatically with retry + exponential backoff
13. **Token refresh** is silent and automatic — you only need to `auth login` once
