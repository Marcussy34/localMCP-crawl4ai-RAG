# Multi-Source Documentation Guide 📚

Your MCP Documentation Server now supports **multiple documentation sources** in a single searchable index!

## 🎯 Quick Start: Adding Another Documentation Source

### Example: Adding Solana Docs

```bash
cd /Users/marcus/Projects/crawl4ai_test/mcp-docs-server/scripts

# Step 1: Crawl the new documentation
python3 crawler.py https://docs.solana.com/ -m 0 -o solana_docs.json

# Step 2: Index it (appends to existing docs)
python3 indexer_multi.py solana_docs.json -n "Solana"

# Step 3: Done! Refresh your browser
# Both Moca and Solana docs are now searchable!
```

That's it! Your web interface will now show **multiple sources** and search across both.

---

## 🆚 Single-Source vs Multi-Source Indexer

### Original Indexer (`indexer.py`)
- ❌ Replaces all documentation each time
- ❌ Only tracks one source
- ✅ Simple and straightforward
- **Use for:** Single documentation source only

### Multi-Source Indexer (`indexer_multi.py`)
- ✅ Appends new documentation sources
- ✅ Tracks multiple sources
- ✅ Can replace individual sources
- ✅ Shows all sources in web interface
- **Use for:** Multiple documentation sources

---

## 📖 Usage Guide

### Adding Your First Source (Moca Network)

If you haven't indexed Moca yet with the new indexer:

```bash
cd mcp-docs-server/scripts

# Index Moca Network docs
python3 indexer_multi.py moca_network_docs.json -n "Moca Network"
```

### Adding Additional Sources

```bash
# Example: Polygon Docs
python3 crawler.py https://docs.polygon.technology/ -m 0 -o polygon_docs.json
python3 indexer_multi.py polygon_docs.json -n "Polygon"

# Example: Arbitrum Docs
python3 crawler.py https://docs.arbitrum.io/ -m 0 -o arbitrum_docs.json
python3 indexer_multi.py arbitrum_docs.json -n "Arbitrum"

# Example: Uniswap Docs
python3 crawler.py https://docs.uniswap.org/ -m 0 -o uniswap_docs.json
python3 indexer_multi.py uniswap_docs.json -n "Uniswap"
```

### Updating an Existing Source

When documentation updates, re-index with the same name:

```bash
# Re-crawl
python3 crawler.py https://docs.moca.network/ -m 0 -o moca_network_docs.json

# Re-index (replaces old Moca chunks)
python3 indexer_multi.py moca_network_docs.json -n "Moca Network"
```

The indexer automatically:
1. Detects existing source by name/URL
2. Removes old chunks
3. Adds new chunks
4. Updates metadata

---

## 🎨 Web Interface Features

### Multiple Sources Display

When you have multiple sources indexed, the web interface shows:

1. **Overall Stats**
   - Total pages across all sources
   - Total chunks
   - Total words

2. **Per-Source Breakdown**
   - Each source listed separately
   - Individual stats (pages, chunks, words)
   - Last indexed timestamp
   - Clickable links to original docs

3. **Search Results**
   - Source name badge on each result
   - Easy to see which doc the result came from
   - Seamless search across all sources

### Example Interface (2+ Sources)

```
Index Information                                    [2 Sources]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: 150 pages • 500 chunks • 100,000 words

Indexed Sources:
┌─────────────────────────────────────────────────────────┐
│ Moca Network            docs.moca.network           10/10│
│ 72 pages • 237 chunks • 47,452 words                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Solana                  docs.solana.com             10/11│
│ 78 pages • 263 chunks • 52,548 words                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Advanced Options

### Custom Source Names

```bash
# Use custom name instead of auto-extracted domain
python3 indexer_multi.py my_docs.json -n "My Company Docs"
```

### Replace All Documentation

Start fresh and replace everything:

```bash
# This removes ALL existing documentation and starts over
python3 indexer_multi.py new_docs.json -n "New Docs" --replace
```

### Viewing Current Index

Check what's currently indexed:

```bash
cat mcp-docs-server/data/chunks/metadata.json
```

Example output:
```json
{
  "sources": [
    {
      "name": "Moca Network",
      "url": "https://docs.moca.network/",
      "pages": 72,
      "chunks": 237,
      "words": 47452,
      "indexed_at": "2025-10-10T02:42:59.971578Z",
      "file": "moca_network_docs.json"
    },
    {
      "name": "Solana",
      "url": "https://docs.solana.com/",
      "pages": 78,
      "chunks": 263,
      "words": 52548,
      "indexed_at": "2025-10-11T10:15:30.123456Z",
      "file": "solana_docs.json"
    }
  ],
  "total_sources": 2,
  "total_chunks": 500,
  "total_words": 100000,
  "embedding_model": "text-embedding-3-small",
  "chunk_size": 800,
  "chunk_overlap": 100,
  "last_updated": "2025-10-11T10:15:35.654321Z"
}
```

---

## 💡 Use Cases

### Scenario 1: Web3 Developer

Index all the chains you're building on:

```bash
# Ethereum ecosystem
python3 indexer_multi.py ethereum_docs.json -n "Ethereum"

# Layer 2s
python3 indexer_multi.py arbitrum_docs.json -n "Arbitrum"
python3 indexer_multi.py optimism_docs.json -n "Optimism"
python3 indexer_multi.py polygon_docs.json -n "Polygon"

# Identity/Gaming
python3 indexer_multi.py moca_docs.json -n "Moca Network"

# Search: "How do I bridge assets?"
# Results from all chains!
```

### Scenario 2: Multi-Framework Developer

Index all your frameworks:

```bash
python3 indexer_multi.py nextjs_docs.json -n "Next.js"
python3 indexer_multi.py react_docs.json -n "React"
python3 indexer_multi.py tailwind_docs.json -n "Tailwind"
python3 indexer_multi.py typescript_docs.json -n "TypeScript"
```

### Scenario 3: Company Internal Docs

Index multiple internal documentation sites:

```bash
python3 indexer_multi.py api_docs.json -n "Company API"
python3 indexer_multi.py style_guide.json -n "Style Guide"
python3 indexer_multi.py onboarding.json -n "Onboarding"
```

---

## 📊 Cost Implications

### Per Source
- **One-time indexing:** ~$0.01 per 100,000 words
- **Re-indexing (updates):** Same as initial

### Per Query
- **Search cost:** ~$0.0001 (regardless of # of sources)
- **Searches all sources simultaneously**

### Example Costs

| Sources | Total Words | Initial Cost | Monthly (500 queries) |
|---------|-------------|--------------|----------------------|
| 1 | 50K | $0.005 | $0.05 |
| 3 | 150K | $0.015 | $0.05 |
| 5 | 250K | $0.025 | $0.05 |
| 10 | 500K | $0.050 | $0.05 |

**Key insight:** Query cost stays the same! Vector search is efficient.

---

## 🔍 How Search Works Across Sources

### Semantic Search
When you search "How do I deploy a smart contract?":

1. **Query → Embedding** (OpenAI API)
2. **Vector Search** (ChromaDB searches ALL sources)
3. **Top N Results** (ranked by semantic similarity)
4. **Source Attribution** (each result tagged with source)

Results might include:
- Result 1: From Ethereum docs
- Result 2: From Solana docs
- Result 3: From Polygon docs
- Result 4: From Moca Chain docs

All ranked by **relevance**, regardless of source!

---

## 🎯 Best Practices

### 1. Use Descriptive Source Names

```bash
# ✅ Good
python3 indexer_multi.py docs.json -n "Moca Network"
python3 indexer_multi.py docs.json -n "Solana DeFi Guide"

# ❌ Bad (too generic)
python3 indexer_multi.py docs.json -n "docs"
python3 indexer_multi.py docs.json -n "api"
```

### 2. Keep Sources Updated

Set a reminder to re-index important docs monthly:

```bash
#!/bin/bash
# update_docs.sh

# Re-crawl all sources
cd mcp-docs-server/scripts

python3 crawler.py https://docs.moca.network/ -o moca.json
python3 indexer_multi.py moca.json -n "Moca Network"

python3 crawler.py https://docs.solana.com/ -o solana.json
python3 indexer_multi.py solana.json -n "Solana"

echo "✅ All documentation updated!"
```

### 3. Organize Your Raw Files

Keep crawled files organized:

```
mcp-docs-server/data/raw/
├── moca_network_docs.json
├── solana_docs.json
├── polygon_docs.json
├── arbitrum_docs.json
└── ...
```

### 4. Monitor Total Size

Check your index size periodically:

```bash
# View index size
du -sh mcp-docs-server/data/chroma_db/

# View chunk count
cat mcp-docs-server/data/chunks/metadata.json | grep total_chunks
```

---

## 🚨 Troubleshooting

### Problem: Source not showing in web interface

**Solution:** Make sure you used `indexer_multi.py` not `indexer.py`

```bash
# ❌ This replaces everything
python3 indexer.py new_docs.json

# ✅ This appends
python3 indexer_multi.py new_docs.json -n "New Docs"
```

### Problem: Duplicate sources appearing

**Solution:** Use exact same name when re-indexing

```bash
# First time
python3 indexer_multi.py moca.json -n "Moca Network"

# Update (use EXACT same name)
python3 indexer_multi.py moca_new.json -n "Moca Network"  # ✅ Replaces
python3 indexer_multi.py moca_new.json -n "moca network"  # ❌ Creates duplicate!
```

### Problem: Search returning too many results from one source

**Solution:** This is expected! Results are ranked by relevance, not distributed evenly.

If one source has much more relevant content, it will dominate results. This is correct behavior.

### Problem: Want to remove a specific source

**Solution:**

```bash
# Option 1: Replace all (start fresh)
python3 indexer_multi.py docs.json -n "MyDocs" --replace

# Option 2: Manual (advanced)
# Edit metadata.json to remove source entry
# Then manually delete chunks from ChromaDB (requires code)
```

---

## 🔄 Migration from Single-Source

If you already used the original `indexer.py`:

```bash
# Your current setup has ONE source
# To migrate to multi-source:

# Step 1: Re-index with multi-source indexer
python3 indexer_multi.py moca_network_docs.json -n "Moca Network" --replace

# Step 2: Add more sources
python3 indexer_multi.py solana_docs.json -n "Solana"
python3 indexer_multi.py polygon_docs.json -n "Polygon"

# Done! Now you have 3 sources
```

---

## 📚 Quick Reference

### Commands Cheatsheet

```bash
# Add new source (append mode - default)
python3 indexer_multi.py <file.json> -n "Source Name"

# Replace all documentation
python3 indexer_multi.py <file.json> -n "Source Name" --replace

# Re-index existing source (auto-detected and replaced)
python3 indexer_multi.py <file.json> -n "Exact Same Name"

# View current sources
cat mcp-docs-server/data/chunks/metadata.json | jq '.sources'

# Check index size
du -sh mcp-docs-server/data/chroma_db/
```

### File Locations

- **Multi-source indexer:** `scripts/indexer_multi.py`
- **Single-source indexer:** `scripts/indexer.py` (legacy)
- **Metadata file:** `data/chunks/metadata.json`
- **Vector database:** `data/chroma_db/`
- **Raw docs:** `data/raw/*.json`

---

## 🎉 Summary

With the multi-source indexer, you can:

✅ Index unlimited documentation sources  
✅ Search across all sources simultaneously  
✅ See which source each result came from  
✅ Update individual sources independently  
✅ Beautiful web interface shows all sources  
✅ Same low search cost regardless of # sources  

**Start adding more documentation sources today!** 🚀

```bash
cd mcp-docs-server/scripts
python3 crawler.py https://your-docs-site.com/ -o your_docs.json
python3 indexer_multi.py your_docs.json -n "Your Docs"
```

Then refresh your browser at http://localhost:3000/mcp and search across everything!

