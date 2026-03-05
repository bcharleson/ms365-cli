# m365-mail — Microsoft 365 Mail Skill

Read, search, send, and manage Outlook email via the `m365` CLI.

## install

```bash
npm install -g microsoft365-cli
m365 auth login
```

## commands

```bash
# List inbox
m365 mail list
m365 mail list --top 25 --pretty
m365 mail list --folder sentitems
m365 mail list --filter "isRead eq false"

# Get a specific message (full body)
m365 mail get <id>

# Search across all folders (KQL)
m365 mail search "from:alice@company.com"
m365 mail search "subject:invoice" --top 20
m365 mail search "received>=2026-01-01"

# Send email
m365 mail send --to recipient@example.com --subject "Hello" --body "Message here"
m365 mail send --to "a@b.com,c@d.com" --subject "Team" --body "<p>Hi</p>" --content-type html

# Reply to a message
m365 mail reply <id> --body "Thanks!"
m365 mail reply <id> --body "Looping everyone in" --reply-all

# Move a message
m365 mail move <id> --destination archive
m365 mail move <id> --destination deleteditems

# Delete a message
m365 mail delete <id>

# Unread count
m365 mail unread-count
m365 mail unread-count --folder inbox
```

## output

All commands output JSON. Pipe to `jq` for filtering:

```bash
m365 mail list --filter "isRead eq false" | jq '.value[] | {id, subject, from: .from.emailAddress.address}'
m365 mail unread-count | jq '.unread'
```

## common patterns

```bash
# Read last 10 unread emails, show subject + sender
m365 mail list --filter "isRead eq false" --select "id,subject,from,receivedDateTime" --pretty

# Send HTML email with CC
m365 mail send \
  --to client@example.com \
  --cc manager@example.com \
  --subject "Project Update" \
  --body "<h2>Update</h2><p>All on track.</p>" \
  --content-type html

# Find all emails from a domain this week
m365 mail search "from:@recruitmentprofessionals.com received>=2026-03-01"
```
