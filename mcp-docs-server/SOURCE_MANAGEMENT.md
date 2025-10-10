# Source Management Guide

## Overview

The MCP Documentation Server now supports **viewing and deleting** documentation sources directly from the web interface.

---

## Features

### 1. **View Sources** 👀
Each indexed source displays:
- Source name with external link to original docs
- Statistics (pages, chunks, words)
- Indexed date
- Delete button

### 2. **Delete Sources** 🗑️
- One-click delete button for each source
- Confirmation dialog to prevent accidental deletion
- Shows number of chunks that will be removed
- Automatically updates the index after deletion
- Resets source filter if deleted source was selected

---

## How to Delete a Source

### From Web Interface

1. Go to the home page (MCP Documentation Server)
2. Find the source you want to delete in the "Indexed Sources" section
3. Click the red **trash icon** (🗑️) next to the source
4. A confirmation dialog will appear showing:
   - Source name
   - Number of chunks to be deleted
   - Warning that action cannot be undone
5. Click **"Delete"** to confirm or **"Cancel"** to abort
6. The index will automatically refresh after deletion

### From Command Line

You can also delete sources using the Python script:

```bash
cd /Users/marcus/Projects/crawl4ai_test
./venv/bin/python3 mcp-docs-server/scripts/delete_source.py "Source Name"
```

**Example:**
```bash
./venv/bin/python3 mcp-docs-server/scripts/delete_source.py "Solana"
```

---

## What Gets Deleted?

When you delete a source:

✅ All document chunks from ChromaDB (vector embeddings)  
✅ Source entry from metadata.json  
✅ Raw crawled data file from `data/raw/` directory  
✅ Total statistics are automatically recalculated  

---

## API Endpoint

### `POST /api/mcp-delete-source`

Delete a documentation source from the index.

**Request Body:**
```json
{
  "sourceName": "Moca Network"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully deleted source \"Moca Network\"",
  "deletedChunks": 237,
  "remainingSources": 1,
  "updatedMetadata": {
    "totalChunks": 57,
    "totalWords": 13110,
    "totalSources": 1
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Source \"Unknown\" not found in metadata"
}
```

---

## Safety Features

### Confirmation Dialog
- Prevents accidental deletion
- Shows exactly what will be deleted
- Requires explicit confirmation

### Automatic Cleanup
- Updates all metadata automatically
- Recalculates totals
- Maintains data consistency

### Error Handling
- Validates source exists before deletion
- Provides clear error messages
- Rolls back on failure

---

## Use Cases

### 1. **Remove Outdated Documentation**
Delete old versions before adding updated documentation:
```bash
# Delete old version
Click delete on "Project Docs v1"

# Add new version via /add page
```

### 2. **Remove Incorrect Sources**
If you accidentally indexed the wrong documentation:
```bash
# Immediately delete the incorrect source
Click delete on the unwanted source

# Index the correct documentation
```

### 3. **Manage Index Size**
Keep your index lean by removing unused sources:
```bash
# Review sources and remove unused ones
# Reduces search time and improves relevance
```

---

## Technical Details

### Backend Script
- **Location:** `mcp-docs-server/scripts/delete_source.py`
- **Function:** Deletes chunks from ChromaDB and updates metadata
- **Database:** ChromaDB with `where` clause filtering
- **Cleanup:** Removes raw data files

### Frontend Component
- **Location:** `pages/index.js`
- **Features:** Delete button, confirmation dialog, automatic refresh
- **State Management:** React hooks for loading states

### API Route
- **Location:** `pages/api/mcp-delete-source.js`
- **Method:** POST
- **Execution:** Spawns Python process to handle deletion

---

## Troubleshooting

### Error: "Source not found in metadata"
- Check the exact source name (case-sensitive)
- Verify the source exists in the index info

### Error: "Failed to delete source"
- Check that Python virtual environment is active
- Ensure ChromaDB database is accessible
- Check file permissions for metadata.json

### Source still appears after deletion
- Refresh the page
- The index info should reload automatically
- Check browser console for errors

---

## Best Practices

1. **Always confirm source name** before deleting
2. **Back up metadata.json** before major changes
3. **Delete one source at a time** to avoid confusion
4. **Re-index if needed** - you can always crawl again
5. **Monitor total chunks** to understand impact

---

## Future Enhancements

Potential improvements:
- [ ] Bulk delete multiple sources
- [ ] Export source before deletion (backup)
- [ ] Soft delete with restore option
- [ ] Delete history/audit log
- [ ] Preview affected search results before deletion

---

## Related Files

- `mcp-docs-server/scripts/delete_source.py` - Deletion script
- `pages/api/mcp-delete-source.js` - API endpoint
- `pages/index.js` - UI with delete buttons
- `mcp-docs-server/data/chunks/metadata.json` - Source metadata
- `mcp-docs-server/data/chroma_db/` - Vector database

---

**Last Updated:** October 10, 2025

