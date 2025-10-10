# View Pages Feature Guide

## Overview

The MCP Documentation Server now supports **viewing and expanding all indexed pages** for each documentation source. This allows you to explore exactly what content is indexed before searching or deleting.

---

## Features

### 1. **Expandable Source View** 📂
- Click the chevron (>) next to any source to expand
- See all indexed pages from that source
- Shows page count, chunk count, and word count

### 2. **Page Details** 📄
Each page displays:
- Page title
- Direct link to original documentation
- Number of chunks
- Total word count
- Clickable to expand individual chunks

### 3. **Chunk Viewer** 📝
- Expand any page to see all its chunks
- Each chunk shows:
  - Chunk number
  - Word count
  - Full content in a readable text area

---

## How to Use

### Step 1: Expand a Source
1. Go to the home page
2. Find the source in "Indexed Sources"
3. Click the **blue chevron icon** (▶) next to the source name
4. The chevron changes to down (▼) and pages load

### Step 2: View Pages
- A list of all pages from that source appears below
- Each page shows:
  - Title and URL
  - Number of chunks
  - Word count
- Pages are sorted alphabetically by title

### Step 3: Expand Individual Pages
1. Click on any page row to expand it
2. All chunks for that page will be displayed
3. Each chunk shows its content in a text area
4. Scroll through chunks to see the full page content

### Step 4: Collapse
- Click the source chevron again to collapse all pages
- Click a page row again to collapse its chunks

---

## Visual Guide

```
📚 Moca Network [▶]  🗑️              ← Click chevron to expand
   72 pages • 237 chunks • 47,452 words

📚 Moca Network [▼]  🗑️              ← Expanded view
   72 pages • 237 chunks • 47,452 words
   
   ▶ What Is Moca Network?           ← Click to expand page
     https://docs.moca.network/...
     3 chunks • 450 words
     
   ▼ What Is AIR Kit?                ← Expanded page
     https://docs.moca.network/...
     2 chunks • 320 words
     
     Chunk 1                          ← Individual chunks
     200 words
     [Content displayed here...]
     
     Chunk 2
     120 words
     [Content displayed here...]
```

---

## Use Cases

### 1. **Content Verification** ✅
Verify what was actually indexed:
```
1. Expand source
2. Check if all expected pages are present
3. Expand specific pages to verify content quality
```

### 2. **Debugging Search Issues** 🔍
If search returns unexpected results:
```
1. Expand the source
2. Find the relevant page
3. View its chunks to understand how content was split
4. Adjust search query based on actual indexed content
```

### 3. **Before Deletion** ⚠️
Review content before deleting a source:
```
1. Expand source to see all pages
2. Check which pages will be lost
3. Make informed decision about deletion
```

### 4. **Content Quality Check** 📊
Ensure chunking worked correctly:
```
1. Expand pages with many chunks
2. Verify chunks aren't cut off mid-sentence
3. Check that important content is captured
```

---

## API Endpoint

### `POST /api/mcp-source-pages`

Get all pages for a specific documentation source.

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
  "source": "Moca Network",
  "totalPages": 72,
  "totalChunks": 237,
  "totalWords": 47452,
  "pages": [
    {
      "title": "What Is Moca Network?",
      "url": "https://docs.moca.network/learn/",
      "chunkCount": 3,
      "totalWords": 450,
      "chunks": [
        {
          "id": "Moca Network_page_0_chunk_0",
          "content": "...",
          "wordCount": 200,
          "chunkIndex": 0
        },
        {
          "id": "Moca Network_page_0_chunk_1",
          "content": "...",
          "wordCount": 150,
          "chunkIndex": 1
        }
      ]
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No documents found for source \"Unknown\""
}
```

---

## Technical Details

### Backend Script
- **Location:** `mcp-docs-server/scripts/get_source_pages.py`
- **Function:** Fetches all documents for a source from ChromaDB
- **Grouping:** Groups chunks by page URL
- **Sorting:** Pages sorted alphabetically by title

### Frontend Component
- **Location:** `pages/index.js`
- **State Management:** 
  - `expandedSources` - tracks which sources are expanded
  - `sourcePages` - stores loaded pages per source
  - `loadingPages` - loading state per source
  - `expandedPages` - tracks which pages are expanded
- **Lazy Loading:** Pages only loaded when source is expanded

### Data Flow
1. User clicks expand chevron
2. Frontend checks if pages already loaded
3. If not, API call to `/api/mcp-source-pages`
4. Python script queries ChromaDB
5. Chunks grouped by URL and returned
6. Frontend displays pages in expandable list

---

## Performance Considerations

### Lazy Loading
- Pages are **not loaded** until source is expanded
- Reduces initial page load time
- Saves API calls for unused sources

### Caching
- Once loaded, pages are cached in state
- Re-expanding a source doesn't trigger new API call
- Cache cleared when page refreshes

### Memory Usage
- Each page includes all its chunks
- Large sources (100+ pages) may use significant memory
- Consider implementing pagination if needed

---

## Keyboard Shortcuts

Current:
- Click source chevron to expand/collapse
- Click page row to expand/collapse chunks

Future enhancements could add:
- Arrow keys to navigate pages
- Spacebar to expand/collapse
- Escape to collapse all

---

## Troubleshooting

### Pages Not Loading
**Symptom:** Clicked chevron but nothing happens

**Solutions:**
- Check browser console for errors
- Verify ChromaDB is accessible
- Check that source name matches exactly
- Refresh page and try again

### Slow Loading
**Symptom:** Takes long time to load pages

**Possible Causes:**
- Large source with many pages
- ChromaDB database is large
- Network latency

**Solutions:**
- Normal for sources with 100+ pages
- Consider pagination if needed
- Check backend logs for performance issues

### Chunks Not Displaying
**Symptom:** Page expands but no chunks visible

**Solutions:**
- Check that page has chunks (shouldn't happen)
- Look for JavaScript errors in console
- Verify chunk data structure in API response

---

## Best Practices

1. **Expand only when needed** - Reduces API calls and memory usage
2. **Close after viewing** - Keep interface clean
3. **Use search when possible** - Faster than browsing all pages
4. **Check before deletion** - Always expand and review before deleting

---

## Future Enhancements

Potential improvements:
- [ ] Search within source pages
- [ ] Filter pages by title or URL
- [ ] Copy chunk content button
- [ ] Pagination for large sources (100+ pages)
- [ ] Export pages as JSON or Markdown
- [ ] Highlight matching keywords in chunks
- [ ] Show chunk similarity scores
- [ ] Bulk operations on pages

---

## Related Features

- **Delete Source:** Remove entire source with all pages
- **Search Documentation:** Search across all indexed content
- **Add Documentation:** Index new sources
- **Hybrid Search:** Filter search by source

---

## Files

- `mcp-docs-server/scripts/get_source_pages.py` - Backend script
- `pages/api/mcp-source-pages.js` - API endpoint
- `pages/index.js` - Frontend UI with expansion logic
- `mcp-docs-server/data/chroma_db/` - Vector database

---

**Last Updated:** October 10, 2025

