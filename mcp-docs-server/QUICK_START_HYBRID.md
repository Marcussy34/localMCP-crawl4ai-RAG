# Quick Start: Hybrid Search

## TL;DR

Your MCP server now supports **optional source filtering**!

```python
# Search everything (default)
{"query": "How do I stake tokens?"}

# Search specific source (new!)
{"query": "How do I stake tokens?", "source": "Solana"}
```

---

## Visual Comparison

### Before (Single-Step Only)
```
┌─────────────────┐
│  User Query     │
│ "What is SOL?"  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Search ALL Documentation      │
│  ┌─────────────────────────┐   │
│  │  Moca Network (237)     │   │
│  │  Solana (57)            │   │
│  └─────────────────────────┘   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│       Mixed Results             │
│  - Moca result (maybe)          │
│  - Solana result ✓              │
│  - Moca result (maybe)          │
│  - Solana result ✓              │
│  - Moca result (maybe)          │
└─────────────────────────────────┘
```

### After (Hybrid Approach)
```
┌─────────────────────────────┐
│  User Query                 │
│ "What is SOL?"              │
│ + source: "Solana"          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Search FILTERED Documentation │
│  ┌─────────────────────────┐   │
│  │  ❌ Moca Network (237)  │   │
│  │  ✅ Solana (57)         │   │
│  └─────────────────────────┘   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│      Precise Results            │
│  - Solana result ✓              │
│  - Solana result ✓              │
│  - Solana result ✓              │
│  - Solana result ✓              │
│  - Solana result ✓              │
└─────────────────────────────────┘
```

---

## When to Use Each Mode

### 🌐 Broad Search (No Filter)

**Good for:**
- Exploratory queries
- Cross-platform concepts
- Don't know which doc has the answer
- Want comprehensive overview

**Example queries:**
- "What are gas fees?"
- "How does staking work?"
- "What is a smart contract?"

---

### 🎯 Filtered Search (With Source)

**Good for:**
- Platform-specific questions
- Known context
- Precision over breadth
- Working on specific project

**Example queries:**
- "How do I deploy on Moca Chain?" → source: "Moca Network"
- "What is Solana's consensus mechanism?" → source: "Solana"
- "AIR Kit integration steps?" → source: "Moca Network"

---

## Available Sources

Your current index has:

| Source | Pages | Chunks | Words |
|--------|-------|--------|-------|
| **Moca Network** | 72 | 237 | 47,452 |
| **Solana** | 10 | 57 | 13,110 |
| **Total** | 82 | 294 | 60,562 |

---

## Command Line Usage

### Search All (Python)
```bash
python scripts/search.py "What is Moca Network?" 5
```

### Search Filtered (Python)
```bash
python scripts/search.py "What is Solana?" 5 "Solana"
```

---

## MCP Server Usage (Cursor)

### In Cursor Chat

**Broad search:**
```
@marcus-mcp-server What are the transaction fees?
```

**Filtered search:**
```
@marcus-mcp-server Search Moca Network docs for transaction fees
```

The AI will automatically use the appropriate mode!

---

## Getting Started

1. **Restart MCP Server** (if running)
   - Command Palette → "MCP: Restart Server"
   - Select "marcus-mcp-server"

2. **Check Index Info**
   - Use `get-index-info` tool to see available sources

3. **Try it out!**
   - Start with broad searches
   - Add source filtering when you need precision

---

## Pro Tips

💡 **Let the AI decide** - The AI assistant can analyze your query and choose the best search mode

💡 **Start broad, then narrow** - If broad search returns too many results, add a source filter

💡 **Check source names** - Use exact names: "Moca Network" or "Solana"

💡 **Combine with max_results** - Adjust number of results for better control

---

## Example Conversations

### Example 1: Broad to Filtered
```
You: How do I set up a wallet?
AI: [Searches all docs, finds results from both Moca and Solana]

You: Show me only Moca Network wallet setup
AI: [Searches with source: "Moca Network", shows filtered results]
```

### Example 2: Direct Filtered
```
You: Explain Solana's account model
AI: [Automatically searches source: "Solana" since query is platform-specific]
```

---

## Need Help?

- 📖 **Full Guide:** See `HYBRID_SEARCH_GUIDE.md`
- 📝 **Changes:** See `CHANGELOG_HYBRID_SEARCH.md`
- 🐛 **Issues:** Check the metadata has `source_name` field
- 💬 **Questions:** Ask in chat with @marcus-mcp-server

---

**Enjoy your new hybrid search! 🚀**

