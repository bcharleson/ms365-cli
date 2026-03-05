# m365-drive — OneDrive Skill

Browse, search, and manage OneDrive files via the `m365` CLI.

## install

```bash
npm install -g ms365-cli
m365 login --client-id <id> --tenant-id <id>
```

## commands

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

## output

```bash
# List files — name + size only
m365 drive list | jq '.value[] | {name, size}'

# Find all PDFs
m365 drive search "pdf" | jq '.value[] | select(.name | endswith(".pdf")) | {name, id}'

# Get download URL for a file
m365 drive get <id> | jq '."@microsoft.graph.downloadUrl"'
```

## openclaw agent usage

```bash
# Find a specific document
m365 drive search "candidate resume Smith" --pretty

# Check what's in the Documents folder
m365 drive list --folder-id <documents-folder-id> --pretty

# Get a file's details before downloading
m365 drive get --path "/Documents/pipeline.xlsx" --pretty
```
