# AGENTS.md — microsoft365-cli

**Purpose:** CLI and MCP server for Microsoft 365 productivity APIs. Read/send mail, manage calendar, browse OneDrive, search contacts. JSON-first, AI-agent ready.

**Pattern:** Every command is a `CommandDefinition` — one object that powers both the CLI subcommand (`m365 mail send`) and the MCP tool (`mail_send`). No duplication.

## Quick reference for AI agents

```bash
# Auth
m365 auth status                          # Check login state
m365 auth login --client-id <id>          # Device code login

# Mail
m365 mail unread-count                    # How many unread?
m365 mail list --filter "isRead eq false" # List unread
m365 mail get <id>                        # Read a message
m365 mail search "from:alice@co.com"      # Search KQL
m365 mail send --to x --subject y --body z
m365 mail reply <id> --body "Thanks"

# Calendar
m365 calendar list                        # Next 7 days
m365 calendar create --subject "Sync" --start ... --end ...

# Drive
m365 drive list                           # Root folder
m365 drive search "report"               # Find files

# Contacts
m365 contacts search "Smith"             # Find contacts
```

## Adding commands

1. Create `src/commands/<group>/<subcommand>.ts`
2. Export a `CommandDefinition` object (see any existing command for the pattern)
3. Add the export to `src/commands/<group>/index.ts`
4. Add the import + push to `allCommands` in `src/commands/index.ts`

The command is automatically available as both a CLI subcommand and an MCP tool.

## Microsoft Graph API

Base URL: `https://graph.microsoft.com/v1.0`
Auth: `Authorization: Bearer <access_token>` (MSAL device code flow)
Docs: https://learn.microsoft.com/en-us/graph/api/overview

Key endpoints:
- Mail: `/me/messages`, `/me/mailFolders/{folder}/messages`, `/me/sendMail`
- Calendar: `/me/events`, `/me/calendarView`
- Drive: `/me/drive/root/children`, `/me/drive/items/{id}`
- Contacts: `/me/contacts`
