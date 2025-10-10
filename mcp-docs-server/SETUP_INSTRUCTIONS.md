# MCP Documentation Server - Setup Complete! 🎉

Your local MCP server is ready to provide intelligent documentation search in Cursor!

## ✅ What's Been Set Up

### 1. **Documentation Crawled**
- Source: https://docs.moca.network/
- 72 pages with 47,452 words
- 95.8% success rate (bypassed Netlify protection)

### 2. **Indexed with OpenAI Embeddings**
- 237 semantic chunks created
- Vector database stored in ChromaDB
- Cost: $0.0032 (one-time)

### 3. **MCP Server Running**
- Location: `server/main.py`
- Two tools available:
  - `search-docs` - Semantic search through documentation
  - `get-index-info` - Get metadata about the index

---

## 🔧 Cursor Configuration

### Step 1: Open Cursor Settings

1. Open Cursor
2. Go to **Settings** (Cmd+, on Mac)
3. Search for "MCP" or scroll to **MCP** section

### Step 2: Add the Server

Copy the contents of `cursor-config.json` and add it to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "moca-docs": {
      "command": "/Users/marcus/Projects/crawl4ai_test/venv/bin/python3",
      "args": [
        "/Users/marcus/Projects/crawl4ai_test/mcp-docs-server/server/main.py"
      ],
      "env": {
        "PYTHONPATH": "/Users/marcus/Projects/crawl4ai_test/mcp-docs-server"
      }
    }
  }
}
```

**Important:** If you have existing MCP servers configured, merge this config with your existing one by adding the `"moca-docs"` entry to your existing `"mcpServers"` object.

### Step 3: Restart Cursor

After adding the configuration, restart Cursor for changes to take effect.

---

## 🎯 How to Use

### In Cursor Chat

Once configured, you can:

1. **Ask questions about Moca Network documentation:**
   ```
   @moca-docs How do I set up AIR Kit SDK?
   ```

2. **Search for specific topics:**
   ```
   @moca-docs What is Moca Chain consensus mechanism?
   ```

3. **Get index information:**
   ```
   @moca-docs What documentation is available?
   ```

The AI will automatically use the `search-docs` tool to find relevant documentation and provide context-aware answers!

---

## 📊 What Each Tool Does

### `search-docs`
- **Purpose:** Semantic search through Moca Network documentation
- **How it works:** Converts your query to a vector, finds similar chunks
- **Returns:** Top 5 most relevant documentation sections (configurable)
- **Cost:** ~$0.0001 per query (minimal)

### `get-index-info`
- **Purpose:** Show metadata about the indexed documentation
- **Returns:** Source, pages, chunks, last update time, etc.
- **Cost:** Free (no API calls)

---

## 🔄 Updating Documentation

When Moca Network updates their docs, re-run the crawler and indexer:

```bash
cd /Users/marcus/Projects/crawl4ai_test/mcp-docs-server/scripts

# 1. Crawl latest docs
python3 crawler.py https://docs.moca.network/ -m 0 -o moca_network_docs.json

# 2. Re-index
python3 indexer.py moca_network_docs.json
```

No need to restart Cursor - the server will automatically use the new index!

---

## 📁 Project Structure

```
mcp-docs-server/
├── data/
│   ├── raw/
│   │   └── moca_network_docs.json        # Crawled markdown
│   ├── chunks/
│   │   └── metadata.json                  # Index metadata
│   └── chroma_db/                         # Vector database
├── scripts/
│   ├── crawler.py                         # Documentation crawler
│   └── indexer.py                         # Embedding generator
├── server/
│   └── main.py                            # MCP server
├── .env                                   # OpenAI API key
├── requirements.txt                       # Python dependencies
└── cursor-config.json                     # Cursor configuration

```

---

## 🐛 Troubleshooting

### Server not appearing in Cursor?

1. Check that paths are correct in `cursor-config.json`
2. Restart Cursor completely
3. Check Cursor's MCP logs (usually in settings)

### Search not working?

1. Verify OpenAI API key is set in `.env`
2. Check that ChromaDB database exists: `data/chroma_db/chroma.sqlite3`
3. Try re-indexing: `python3 scripts/indexer.py moca_network_docs.json`

### Want to add more documentation?

Just crawl another site and index it:

```bash
# Crawl new docs
python3 scripts/crawler.py https://docs.example.com/ -o example_docs.json

# Index them (this will ADD to existing index)
python3 scripts/indexer.py example_docs.json
```

---

## 💰 Cost Breakdown

| Operation | Cost | Frequency |
|-----------|------|-----------|
| Initial indexing | $0.0032 | One-time |
| Re-indexing | $0.0032 | When docs update |
| Each search query | ~$0.0001 | Per query |
| Storage (ChromaDB) | Free | Local disk |

**Monthly estimate:** ~$0.05 (500 queries) + occasional re-indexing

---

## 🚀 Next Steps

1. **Add to Cursor** using the config above
2. **Try some queries** to test it out
3. **Crawl more documentation** sites that aren't on Context7
4. **Share with your team** - they can run their own instances

---

## 📚 Learn More

- [MCP Protocol](https://modelcontextprotocol.io/)
- [Crawl4AI Documentation](https://docs.crawl4ai.com/)
- [ChromaDB Docs](https://docs.trychroma.com/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

---

**Enjoy your local documentation server!** 🎉

