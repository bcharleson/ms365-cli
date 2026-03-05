# m365-calendar — Microsoft 365 Calendar Skill

List, create, update, and delete Outlook calendar events via the `m365` CLI.

## install

```bash
npm install -g microsoft365-cli
m365 auth login
```

## commands

```bash
# List events (default: next 7 days)
m365 calendar list
m365 calendar list --top 20 --pretty
m365 calendar list --start 2026-03-01T00:00:00Z --end 2026-03-31T23:59:59Z

# Get a specific event
m365 calendar get <id>

# Create an event
m365 calendar create --subject "Team Sync" --start 2026-03-10T14:00:00 --end 2026-03-10T15:00:00
m365 calendar create \
  --subject "Client Call" \
  --start 2026-03-10T09:00:00 \
  --end 2026-03-10T10:00:00 \
  --timezone "America/New_York" \
  --attendees "client@example.com,pm@company.com" \
  --location "Zoom" \
  --online-meeting

# Update an event
m365 calendar update <id> --subject "Updated Title"
m365 calendar update <id> --start 2026-03-10T15:00:00 --end 2026-03-10T16:00:00

# Delete an event
m365 calendar delete <id>
```

## output

All commands output JSON:

```bash
# List today's events, show just subject + start time
m365 calendar list --start $(date -u +%Y-%m-%dT00:00:00Z) --end $(date -u +%Y-%m-%dT23:59:59Z) \
  | jq '.value[] | {subject, start: .start.dateTime}'
```

## common patterns

```bash
# Create a Teams meeting with attendees
m365 calendar create \
  --subject "Discovery Call" \
  --start 2026-03-15T13:00:00 \
  --end 2026-03-15T14:00:00 \
  --timezone "America/Chicago" \
  --attendees "prospect@company.com" \
  --body "Looking forward to connecting" \
  --online-meeting

# Check this week's schedule
m365 calendar list \
  --start $(date -u +%Y-%m-%dT00:00:00Z) \
  --top 50 \
  --select "subject,start,end,location,attendees" \
  --pretty
```
