# m365-drive — OneDrive Skill

Browse, search, and manage OneDrive files via the `m365` CLI.

## install

```bash
npm install -g microsoft365-cli
m365 auth login
```

## commands

```bash
# List root folder
m365 drive list
m365 drive list --top 50

# List a specific folder
m365 drive list --folder-id <id>

# Get file/folder metadata
m365 drive get <id>
m365 drive get --path "/Documents/report.pdf"

# Search files
m365 drive search "quarterly report"
m365 drive search "invoice" --top 20

# Delete a file or folder
m365 drive delete <id>
```

## output

```bash
# Find all PDFs, show name + size
m365 drive search "pdf" | jq '.value[] | {name, size}'

# Get download URL for a file
m365 drive get <id> | jq '."@microsoft.graph.downloadUrl"'
```
