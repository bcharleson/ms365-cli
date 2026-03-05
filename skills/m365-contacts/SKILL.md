# m365-contacts — Microsoft 365 Contacts Skill

List, search, get, and create Outlook contacts via the `m365` CLI.

## install

```bash
npm install -g ms365-cli
m365 login --client-id <id> --tenant-id <id>
```

## commands

```bash
# List contacts
m365 contacts list
m365 contacts list --top 50
m365 contacts list --select "displayName,emailAddresses,mobilePhone,companyName,jobTitle"
m365 contacts list --orderby "displayName asc"

# Get a specific contact
m365 contacts get <id>

# Search contacts
m365 contacts search "Alice"
m365 contacts search "smith" --top 20

# Create a contact
m365 contacts create --given "Jane" --surname "Doe" --email jane@example.com
m365 contacts create \
  --given "John" \
  --surname "Smith" \
  --email john@co.com \
  --phone "+1-555-0100" \
  --company "Acme Corp" \
  --job-title "VP Sales" \
  --notes "Met at conference. Interested in GP recruitment services."
```

## output

```bash
# List all contacts — name + email only
m365 contacts list --top 100 \
  | jq '.value[] | {name: .displayName, email: .emailAddresses[0].address}'

# Find a contact's phone number
m365 contacts search "Smith" | jq '.value[] | {name: .displayName, phone: .mobilePhone}'
```

## openclaw agent usage

```bash
# Look up a contact before emailing
m365 contacts search "Mark Johnson" --pretty

# Add a new candidate or client contact after a call
m365 contacts create \
  --given "Dr. Sarah" \
  --surname "Williams" \
  --email dr.williams@gmail.com \
  --phone "+1-555-0142" \
  --company "Currently unaffiliated" \
  --job-title "Family Medicine Physician" \
  --notes "GP candidate. Board certified. Open to relocation. Spoke 2026-03-05."

# Add a new client contact
m365 contacts create \
  --given "Mark" \
  --surname "Johnson" \
  --email mark.johnson@cardiobase.com \
  --company "Cardiobase" \
  --job-title "Director of Physician Recruitment" \
  --notes "Primary client contact at Cardiobase. Recruiting GPs for Iowa clinic."
```
