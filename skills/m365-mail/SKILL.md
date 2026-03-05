# m365-mail — Microsoft 365 Mail Skill

Read, search, send, reply to, and manage Outlook email via the `m365` CLI.

## install

```bash
npm install -g ms365-cli
m365 login --client-id <id> --tenant-id <id>
```

## commands

```bash
# Check unread count
m365 mail unread-count
m365 mail unread-count --folder inbox

# List inbox
m365 mail list
m365 mail list --top 25 --pretty
m365 mail list --folder sentitems
m365 mail list --filter "isRead eq false"
m365 mail list --filter "receivedDateTime ge 2026-03-01T00:00:00Z"
m365 mail list --select "id,subject,from,receivedDateTime,isRead"

# Get a specific message (full body included)
m365 mail get <id>
m365 mail get <id> --pretty

# Search across all folders (KQL)
m365 mail search "from:alice@company.com"
m365 mail search "subject:invoice" --top 20
m365 mail search "received>=2026-01-01 AND from:boss@co.com"

# Send email
m365 mail send --to recipient@example.com --subject "Hello" --body "Message here"
m365 mail send --to "a@b.com,c@d.com" --subject "Team" --cc boss@co.com --body "Update"
m365 mail send --to a@b.com --subject "Hi" --body "<h1>Hello</h1>" --content-type html

# Reply to a message
m365 mail reply <id> --body "Thanks!"
m365 mail reply <id> --body "Looping everyone in" --reply-all

# Move a message
m365 mail move <id> --destination archive
m365 mail move <id> --destination deleteditems

# Delete a message
m365 mail delete <id>
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
# Get unread count only
m365 mail unread-count | jq '.unread'

# List unread — subject + sender only
m365 mail list --filter "isRead eq false" \
  | jq '.value[] | {id, subject, from: .from.emailAddress.address}'

# Get message body text
m365 mail get <id> | jq '.body.content'
```

## openclaw agent usage

When used inside an OpenClaw agent via the `exec` tool:

```bash
# Check inbox
m365 mail unread-count

# List unread emails
m365 mail list --filter "isRead eq false" --top 10 --select "id,subject,from,receivedDateTime" --pretty

# Read a specific email (use the id from list output)
m365 mail get <id> --pretty

# Reply
m365 mail reply <id> --body "Thank you for reaching out. I'll follow up shortly."

# Send new outreach email
m365 mail send \
  --to prospect@hospital.org \
  --subject "GP Physician Opportunity — [Location]" \
  --body "Hi Dr. [Name], I wanted to reach out about an exciting Family Medicine opportunity..."
```

## common patterns

```bash
# Full inbox triage workflow
m365 mail unread-count
m365 mail list --filter "isRead eq false" --select "id,subject,from,receivedDateTime" --pretty
m365 mail get <id> --pretty
m365 mail reply <id> --body "Response here"

# Send HTML email
m365 mail send \
  --to client@example.com \
  --subject "Candidate Submittal — Dr. Jane Smith" \
  --body "<h2>Candidate Overview</h2><p>Please see below...</p>" \
  --content-type html

# Find all emails from a contact
m365 mail search "from:mark.johnson@cardiobase.com" --top 50 --pretty

# Archive all read emails older than 30 days (pipe + loop)
m365 mail list --filter "isRead eq true" --top 100 \
  | jq -r '.value[].id' \
  | while read id; do m365 mail move "$id" --destination archive; done
```
