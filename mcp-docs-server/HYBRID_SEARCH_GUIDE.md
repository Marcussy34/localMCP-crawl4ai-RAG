# Hybrid Search Guide

## Overview

The MCP server now supports **hybrid search** - you can search across all documentation sources OR filter by a specific source.

## How It Works

### Current Sources
Based on your `metadata.json`:
- **Moca Network** (237 chunks, 72 pages)
- **Solana** (57 chunks, 10 pages)

### Search Modes

#### 1. **Broad Search (Default)** 🌐
Search across ALL documentation sources simultaneously.

```json
{
  "query": "What are the transaction fees?"
}
```

**Use when:**
- You want comprehensive results
- The topic might span multiple docs
- You're not sure which doc contains the answer

**Example results:** Mix of Moca and Solana documentation

---

#### 2. **Source-Filtered Search** 🎯
Search within a specific documentation source.

```json
{
  "query": "What are the transaction fees?",
  "source": "Solana"
}
```

**Use when:**
- You know which documentation to search
- You want precise, focused results
- You're working with a specific product/platform

**Example results:** Only Solana documentation

---

## MCP Tool Parameters

### `search-docs`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ Yes | Natural language search query |
| `max_results` | integer | ❌ No | Number of results (default: 5) |
| `source` | string | ❌ No | Filter by source name (e.g., "Moca Network", "Solana") |

### `get-index-info`

Returns information about all indexed sources, including:
- Total pages, chunks, and words
- Individual source breakdowns
- Embedding model and chunk settings

---

## Usage Examples

### Example 1: Broad Search
**Query:** "How do I set up a wallet?"

**Result:** Gets results from both Moca Network AND Solana docs, showing wallet setup for both platforms.

### Example 2: Filtered Search
**Query:** "How do I set up a wallet?"  
**Source:** "Moca Network"

**Result:** Only gets Moca Network wallet setup information.

---

## Benefits of Hybrid Approach

✅ **Fast by default** - Single query for most cases  
✅ **Precise when needed** - Filter to specific docs  
✅ **Scalable** - Easy to add more documentation sources  
✅ **Flexible** - AI can choose the best approach per query  
✅ **Cross-source insights** - Can discover related concepts across platforms

---

## Adding New Sources

When you add new documentation sources using the indexer, they'll automatically:
1. Appear in `get-index-info` tool
2. Be searchable via broad search
3. Be filterable using the `source` parameter

The source name is automatically extracted from the URL or can be specified with the `--name` flag:

```bash
python scripts/indexer_multi.py \
  data/raw/my_docs.json \
  --name "My Custom Docs"
```

---

## Technical Details

- **Search Method:** Semantic search using OpenAI embeddings
- **Embedding Model:** `text-embedding-3-small`
- **Vector DB:** ChromaDB with cosine similarity
- **Filter Implementation:** ChromaDB `where` clause on `source_name` metadata field
- **Performance:** ~same speed for filtered vs. broad search (embedding generation is the bottleneck)

---

## Best Practices

1. **Let the AI decide** - The AI assistant can analyze the query and choose whether to filter
2. **Start broad** - If unsure, search all sources first
3. **Filter for precision** - Use source filtering when you know the context
4. **Check available sources** - Use `get-index-info` to see what's indexed

---

## Future Enhancements

Potential improvements:
- **Auto-routing:** AI automatically detects which source to search based on query
- **Multi-source filtering:** Search multiple (but not all) sources
- **Source ranking:** Prioritize certain sources in results
- **Metadata filtering:** Filter by page type, section, etc.

