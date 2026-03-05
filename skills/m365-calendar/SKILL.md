# m365-calendar — Microsoft 365 Calendar Skill

List, create, update, and delete Outlook calendar events via the `m365` CLI.

## install

```bash
npm install -g ms365-cli
m365 login --client-id <id> --tenant-id <id>
```

## commands

```bash
# List events (default: next 7 days)
m365 calendar list
m365 calendar list --top 20 --pretty
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
  --body "Agenda: intro, needs assessment, next steps" \
  --online-meeting

# Update event
m365 calendar update <id> --subject "New Title"
m365 calendar update <id> --start 2026-03-10T15:00:00 --end 2026-03-10T16:00:00
m365 calendar update <id> --location "Conference Room A"

# Delete event
m365 calendar delete <id>
```

## output

```bash
# Today's events — subject + start time
m365 calendar list \
  --start $(date -u +%Y-%m-%dT00:00:00Z) \
  --end $(date -u +%Y-%m-%dT23:59:59Z) \
  | jq '.value[] | {subject, start: .start.dateTime}'

# Get Teams meeting join URL from event
m365 calendar get <id> | jq '.onlineMeeting.joinUrl'
```

## openclaw agent usage

When used inside an OpenClaw agent via the `exec` tool:

```bash
# Check today's schedule
m365 calendar list \
  --start $(date -u +%Y-%m-%dT00:00:00Z) \
  --end $(date -u +%Y-%m-%dT23:59:59Z) \
  --select "subject,start,end,location,attendees" \
  --pretty

# Schedule a candidate phone screen
m365 calendar create \
  --subject "Phone Screen — Dr. Jane Smith (Family Medicine)" \
  --start 2026-03-15T14:00:00 \
  --end 2026-03-15T14:30:00 \
  --timezone "America/Chicago" \
  --attendees "dr.smith@email.com" \
  --body "Physician phone screen for GP opportunity in Iowa. Dial-in details to follow." \
  --online-meeting

# Schedule a client intake call
m365 calendar create \
  --subject "Search Intake — [Hospital Name]" \
  --start 2026-03-16T10:00:00 \
  --end 2026-03-16T11:00:00 \
  --timezone "America/New_York" \
  --attendees "hr@hospital.org" \
  --body "Intake call to discuss open physician search requirements." \
  --online-meeting
```

## common patterns

```bash
# This week's schedule
m365 calendar list --top 50 --select "subject,start,end,attendees" --pretty

# Create a Teams meeting with multiple attendees
m365 calendar create \
  --subject "Discovery Call" \
  --start 2026-03-15T13:00:00 \
  --end 2026-03-15T14:00:00 \
  --timezone "America/Chicago" \
  --attendees "prospect@company.com,colleague@mycompany.com" \
  --online-meeting

# Reschedule an event
m365 calendar update <id> \
  --start 2026-03-16T14:00:00 \
  --end 2026-03-16T15:00:00

# Cancel / delete
m365 calendar delete <id>
```
