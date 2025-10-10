# MCP Documentation Server - Web Interface Guide 🎨

A beautiful, user-friendly web interface to search your indexed documentation!

## 🚀 Quick Start

### 1. Start Your Next.js Server

```bash
cd /Users/marcus/Projects/crawl4ai_test
npm run dev
```

### 2. Access the Interface

Open your browser and navigate to:
- **MCP Search Interface:** http://localhost:3000/mcp
- **Crawl4AI Interface:** http://localhost:3000/

## ✨ Features

### 📊 Index Information Display
- Shows source documentation site
- Total pages, chunks, and words indexed
- Embedding model and configuration details
- Last indexed timestamp

### 🔍 Semantic Search
- Natural language queries
- Configurable result count (1-20)
- Real-time search with loading states
- Example queries for quick testing

### 📄 Search Results
- Formatted documentation chunks
- Source page titles and URLs
- One-click copy functionality
- Clean, readable markdown display
- Direct links to original documentation

## 🎯 How to Use

### Basic Search

1. **Enter a Query**
   - Type your question naturally (e.g., "How do I initialize AIR Kit SDK?")
   - Press Enter or click "Search Documentation"

2. **View Results**
   - Results are ranked by semantic relevance
   - Each result shows:
     - Page title
     - Source URL (clickable)
     - Full content chunk
     - Copy button

3. **Use Example Queries**
   - Click any example query button to try it instantly

### Advanced Options

**Adjust Result Count:**
- Default: 5 results
- Range: 1-20 results
- More results = broader context, but more to read

## 🎨 Design Features

### Matching Your Existing Theme

The interface matches your Crawl4AI testing interface:
- ✅ Same gradient background
- ✅ Same color scheme (gray scale with blue accents)
- ✅ Same shadcn/ui components
- ✅ Same lucide-react icons
- ✅ Full dark mode support
- ✅ Responsive design
- ✅ Loading states and animations

### Components Used

- `Card` - Main content containers
- `Button` - Interactive elements
- `Input` / `Textarea` - Form fields
- `Badge` - Status indicators
- `Label` - Form labels
- Icons from `lucide-react`

## 📁 File Structure

```
pages/
├── mcp.js                     # Main MCP interface page
├── api/
│   ├── mcp-info.js           # Get index metadata
│   └── mcp-search.js         # Perform semantic search

mcp-docs-server/
├── scripts/
│   └── search.py             # Python search backend
└── data/
    ├── chunks/metadata.json  # Index metadata
    └── chroma_db/            # Vector database
```

## 🔧 API Endpoints

### GET `/api/mcp-info`
Returns index metadata:
```json
{
  "source": "https://docs.moca.network/",
  "totalPages": 72,
  "totalChunks": 237,
  "totalWords": 47452,
  "indexedAt": "2025-10-10T02:42:59.971578Z",
  "embeddingModel": "text-embedding-3-small",
  "chunkSize": 800,
  "chunkOverlap": 100
}
```

### POST `/api/mcp-search`
Performs semantic search:
```json
{
  "query": "How do I set up AIR Kit?",
  "maxResults": 5
}
```

Returns:
```json
{
  "success": true,
  "query": "How do I set up AIR Kit?",
  "results": [
    {
      "title": "Page Title",
      "url": "https://...",
      "content": "...",
      "metadata": {
        "wordCount": 243
      }
    }
  ],
  "totalResults": 5
}
```

## 🎯 Example Queries

Try these natural language queries:

### AIR Kit / SDK
- "How do I initialize AIR Kit SDK?"
- "What is AIR Kit used for?"
- "How to integrate AIR Kit in my app?"

### Moca Chain
- "What is Moca Chain consensus mechanism?"
- "How to connect to Moca Chain?"
- "What is the Moca Chain architecture?"

### Credentials
- "How to issue credentials?"
- "How to verify credentials?"
- "What are credential schemas?"

### Smart Accounts
- "What are smart accounts?"
- "How do smart accounts work?"
- "How to sponsor gas with paymaster?"

## 💡 Tips

### Best Practices

1. **Be Specific:** "How to initialize SDK?" is better than "SDK"
2. **Ask Questions:** Natural questions work best
3. **Try Variations:** If results aren't great, rephrase your query
4. **Adjust Results:** More results = more context, fewer = more focused

### Performance

- **First Search:** May take 2-3 seconds (cold start)
- **Subsequent Searches:** Usually < 1 second
- **Cost:** ~$0.0001 per search (minimal)

## 🔄 Updating Documentation

When documentation updates:

```bash
# 1. Re-crawl
cd mcp-docs-server/scripts
python3 crawler.py https://docs.moca.network/ -m 0 -o moca_network_docs.json

# 2. Re-index
python3 indexer.py moca_network_docs.json

# 3. Refresh the web page
# No server restart needed!
```

## 🐛 Troubleshooting

### Search Not Working?

**Error: "Search script not found"**
- The `search.py` script should be at `mcp-docs-server/scripts/search.py`
- Make sure it's executable: `chmod +x mcp-docs-server/scripts/search.py`

**Error: "Index not found"**
- Run the indexer: `python3 scripts/indexer.py moca_network_docs.json`
- Check that `data/chunks/metadata.json` exists

**Error: "Failed to load index information"**
- Check that `mcp-docs-server/data/chunks/metadata.json` exists
- Verify the JSON is valid

### No Results Found?

1. **Check your query:** Try more specific questions
2. **Verify index:** Make sure documentation is indexed
3. **Re-index:** Sometimes re-indexing helps with quality

### Slow Searches?

- **First search** is always slower (OpenAI API initialization)
- **Subsequent searches** should be fast
- **Check internet:** OpenAI API requires connection

## 🌟 Advanced Usage

### Testing the Search Script Directly

```bash
cd mcp-docs-server/scripts
python3 search.py "Your query here" 5
```

This outputs raw JSON results.

### Monitoring Costs

Each search uses the OpenAI embeddings API:
- Model: `text-embedding-3-small`
- Cost: ~$0.0001 per query
- 1,000 queries ≈ $0.10

### Adding More Documentation

You can index multiple documentation sites:

```bash
# Crawl another site
python3 crawler.py https://docs.example.com/ -o example_docs.json

# Index it (adds to existing index)
python3 indexer.py example_docs.json
```

The web interface will automatically search across all indexed documentation!

## 🎨 Customization

### Changing Colors

Edit `pages/mcp.js` and modify Tailwind classes:
- Background: `from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800`
- Accent: `text-blue-600 dark:text-blue-400`
- Cards: `bg-gray-50 dark:bg-gray-800`

### Adding Features

Some ideas:
- **Filters:** Filter by page, section, or topic
- **History:** Save recent searches
- **Export:** Export results to markdown/JSON
- **Highlights:** Highlight matching terms
- **Bookmarks:** Save favorite results

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [ChromaDB](https://docs.trychroma.com/)

---

**Enjoy your beautiful documentation search interface!** 🎉

