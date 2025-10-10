# Add Documentation - Web Interface Guide 🎨

The easiest way to add new documentation sources to your MCP server!

## 🚀 Access the Interface

Navigate to: **http://localhost:3000/add**

Or click the **"Add Documentation"** link from:
- Home page (/)
- MCP Search page (/mcp)

---

## ✨ Features

### 📝 Simple 4-Step Process

1. **Configure** - Enter URL, name, and options
2. **Crawl** - Automatically fetch all documentation pages
3. **Index** - Create embeddings and store in vector database
4. **Done** - Start searching immediately!

### 🎯 What You Can Do

✅ **Add any documentation site** - Just provide the URL  
✅ **Auto-generate source names** - Extracted from URL automatically  
✅ **Control crawl scope** - Set max pages or crawl everything  
✅ **Visual progress tracking** - See each step in real-time  
✅ **Immediate results** - Search your new docs right away  
✅ **Beautiful UI** - Matches your existing design  

---

## 📖 How to Use

### Step 1: Open the Add Documentation Page

```
http://localhost:3000/add
```

### Step 2: Fill in the Form

**Documentation URL:**
```
https://docs.solana.com/
```

**Source Name:** (auto-populated, but you can change it)
```
Solana
```

**Maximum Pages:**
```
50 (recommended for testing)
```

Options:
- ☑️ **Crawl all pages (unlimited)** - For complete documentation

### Step 3: Click "Start Crawling & Indexing"

The system will:
1. ✅ Crawl the documentation site
2. ✅ Extract all pages and content
3. ✅ Create semantic chunks
4. ✅ Generate OpenAI embeddings
5. ✅ Store in ChromaDB
6. ✅ Update metadata

### Step 4: Search Your New Docs!

Once complete, you can:
- Click **"Search Documentation"** to search immediately
- Click **"Add Another Source"** to add more

---

## 🎨 Interface Overview

### Progress Steps Indicator

```
[✓] Configure → [⏳] Crawl → [ ] Index → [ ] Done
```

Visual progress bar shows exactly where you are in the process.

### Configuration Screen

- **URL Input** - With validation
- **Source Name** - Auto-generated, editable
- **Max Pages** - Slider or unlimited option
- **Tips Card** - Helpful recommendations

### Crawling Screen

- **Loading Animation** - Beautiful spinner
- **Progress Message** - "Fetching pages from..."
- **Time Estimate** - Based on page count

### Indexing Screen

- **Crawl Results** - Pages, words, status
- **Indexing Progress** - Creating embeddings...
- **Real-time Updates** - See chunks being created

### Complete Screen

- **Success Message** - With stats
- **Detailed Stats** - Pages, chunks, words, cost
- **Total Index Stats** - Across all sources
- **Action Buttons** - Search or add more

---

## 💡 Examples

### Example 1: Adding Solana Docs

```
URL: https://docs.solana.com/
Source Name: Solana
Max Pages: 100

Result:
✅ 78 pages crawled
✅ 263 chunks created
✅ 52,548 words indexed
✅ $0.0105 cost
```

### Example 2: Adding Polygon Docs

```
URL: https://docs.polygon.technology/
Source Name: Polygon
Max Pages: Unlimited

Result:
✅ 156 pages crawled
✅ 487 chunks created
✅ 98,234 words indexed
✅ $0.0196 cost
```

### Example 3: Adding Next.js Docs

```
URL: https://nextjs.org/docs
Source Name: Next.js
Max Pages: 50

Result:
✅ 50 pages crawled
✅ 178 chunks created
✅ 35,672 words indexed
✅ $0.0071 cost
```

---

## 🎯 Best Practices

### 1. Start Small

```
Max Pages: 50-100 for first test
```

This lets you:
- ✅ See results quickly
- ✅ Verify quality
- ✅ Understand cost
- ✅ Then scale up

### 2. Use Descriptive Names

```
✅ Good Names:
- "Solana DeFi Guide"
- "Polygon zkEVM"
- "Next.js 14"

❌ Bad Names:
- "docs"
- "api"
- "test"
```

Names appear in search results, so make them clear!

### 3. Check the URL

Make sure you're using the **root documentation URL**:

```
✅ Good:
- https://docs.solana.com/
- https://docs.polygon.technology/
- https://nextjs.org/docs

❌ Bad:
- https://solana.com/ (not the docs)
- https://docs.polygon.technology/pos/get-started/ (too specific)
```

### 4. Choose Crawl Scope Wisely

| Scope | Use Case | Time | Cost |
|-------|----------|------|------|
| 20-50 pages | Quick test | 1-2 min | ~$0.005 |
| 50-100 pages | Good coverage | 2-5 min | ~$0.01 |
| 100-200 pages | Comprehensive | 5-10 min | ~$0.02 |
| Unlimited | Full site | 10-30 min | ~$0.05 |

---

## ⚡ Tips & Tricks

### Tip 1: Test First

Always start with a limited crawl (50 pages) to:
- Check if the site works well
- Verify content quality
- See if it's worth indexing fully

### Tip 2: Watch the Output

The interface shows:
- ✅ Pages crawled
- ✅ Words extracted
- ✅ Chunks created
- ✅ Estimated cost

Use this to decide if you want to expand the crawl.

### Tip 3: Multiple Sources

You can add as many sources as you want:

```
1. Add Moca Network (72 pages)
2. Add Solana (78 pages)
3. Add Polygon (156 pages)
4. Add Next.js (50 pages)
...

Total: 356 pages, ~1000 chunks, searchable together!
```

### Tip 4: Update Existing Sources

To update a source:
1. Use the **exact same name**
2. The system will detect and replace old chunks
3. New version is indexed automatically

---

## 🚨 Troubleshooting

### Problem: "Crawl timeout"

**Cause:** Site is too large or slow

**Solution:**
```
1. Reduce max pages
2. Try again with unlimited but expect long wait
3. Check if site has bot protection
```

### Problem: "No pages found"

**Cause:** URL might be wrong or site blocks crawlers

**Solution:**
```
1. Verify URL is correct documentation root
2. Check if site is accessible in browser
3. Try a different URL from the same site
```

### Problem: "Indexing failed"

**Cause:** OpenAI API issue or malformed data

**Solution:**
```
1. Check your OpenAI API key in .env
2. Verify you have API credits
3. Check crawled data in mcp-docs-server/data/raw/
```

### Problem: "Source name already exists"

**This is not an error!**

The system will:
- Remove old chunks from that source
- Add new chunks
- Update metadata

This is how you update documentation!

---

## 💰 Cost Breakdown

### Crawling
- **Free** - Uses Crawl4AI locally

### Indexing
- **$0.00002 per 1K tokens** (OpenAI text-embedding-3-small)
- Average: ~$0.01 per 50K words

### Searching
- **$0.0001 per search** (same cost regardless of # sources)

### Example Total Costs

| Scenario | Pages | Words | Initial Cost | Monthly (500 searches) |
|----------|-------|-------|--------------|----------------------|
| Small | 50 | 25K | $0.005 | $0.05 |
| Medium | 100 | 50K | $0.010 | $0.05 |
| Large | 200 | 100K | $0.020 | $0.05 |
| Enterprise | 500 | 250K | $0.050 | $0.05 |

**Key insight:** Adding more sources barely increases search cost!

---

## 📊 What Happens Behind the Scenes

### Step 1: Crawl (2-10 minutes)
```bash
# Automatic execution:
cd mcp-docs-server/scripts
python3 crawler.py <url> -m <maxPages> -o <filename>.json
```

Results saved to: `mcp-docs-server/data/raw/<filename>.json`

### Step 2: Index (1-5 minutes)
```bash
# Automatic execution:
python3 indexer_multi.py <filename>.json -n "<SourceName>"
```

- Creates semantic chunks (~800 tokens each)
- Generates OpenAI embeddings
- Stores in ChromaDB
- Updates metadata.json

### Step 3: Done!
```
Updated metadata: mcp-docs-server/data/chunks/metadata.json
Vector DB: mcp-docs-server/data/chroma_db/
Ready to search: http://localhost:3000/mcp
```

---

## 🔄 Updating Documentation

When documentation updates:

### Option 1: Use Web Interface (Easiest)

1. Go to http://localhost:3000/add
2. Enter **same URL** and **same source name**
3. Click "Start Crawling & Indexing"
4. Old version is automatically replaced!

### Option 2: Use Command Line

```bash
cd mcp-docs-server/scripts

# Re-crawl
python3 crawler.py https://docs.example.com/ -o example_docs.json

# Re-index (uses same name = replaces old)
python3 indexer_multi.py example_docs.json -n "Example"
```

---

## 🎉 Summary

The Add Documentation web interface makes it **incredibly easy** to:

✅ Add new documentation sources  
✅ No command line needed  
✅ Visual progress tracking  
✅ Real-time feedback  
✅ Automatic indexing  
✅ Immediate searchability  
✅ Beautiful design  

### Quick Start

```
1. Open http://localhost:3000/add
2. Enter URL: https://docs.yoursite.com
3. Enter Name: Your Docs
4. Click "Start Crawling & Indexing"
5. Wait 2-10 minutes
6. Search your new docs!
```

**That's it!** No Python commands, no terminal, just a beautiful web interface. 🚀

---

## 📚 Related Guides

- **`MULTI_SOURCE_GUIDE.md`** - Manual multi-source indexing
- **`WEB_INTERFACE_GUIDE.md`** - MCP search interface
- **`SETUP_INSTRUCTIONS.md`** - Cursor MCP setup

---

**Happy documentation indexing!** 📖✨

