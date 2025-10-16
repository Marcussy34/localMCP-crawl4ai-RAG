# 📚 Marcus Local MCP Server

A Model Context Protocol (MCP) server that indexes documentation sites and local code repositories for semantic search by AI assistants.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)
![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![MCP](https://img.shields.io/badge/MCP-1.0-green)
![ChromaDB](https://img.shields.io/badge/ChromaDB-latest-orange)

## 🎯 What Is This?

This is a **local MCP server** that enables AI assistants (Cursor, Claude Desktop, ChatGPT) to semantically search through:
- **Documentation websites** - Crawled and indexed from any docs site
- **Local code repositories** - All text files from your projects

It uses OpenAI embeddings to create a vector database (ChromaDB) that AI assistants can query through the Model Context Protocol.

**Think of it as:** Giving your AI assistant instant access to searchable documentation and your entire codebase.

## 📋 How It Works

```
┌─────────────────┐
│  AI Assistant   │ (Cursor, Claude, ChatGPT, etc.)
│  (via MCP)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MCP Server    │ (Python - stdio)
│   main.py       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│   ChromaDB      │◄─────┤   OpenAI     │
│  (Vector Store) │      │  Embeddings  │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌──────────────────────┐
│   Indexed Sources    │
│  • Documentation     │
│    - Moca Network    │
│    - Your Docs       │
│  • Repositories      │
│    - Your Codebase   │
│    - Local Projects  │
└──────────────────────┘
```

**The Flow:**
1. **Index** - Crawl docs OR read local repo files
2. **Chunk** - Split content into 800-token chunks
3. **Embed** - Create OpenAI embeddings (batched for speed)
4. **Store** - Save in ChromaDB vector database
5. **Search** - AI assistant queries via MCP protocol
6. **Retrieve** - Return relevant chunks from docs/code

## 🚀 How to Run It

### 1. Setup

```bash
# Clone repository
git clone <your-repo>
cd crawl4ai_test

# Install Node.js dependencies
npm install

# Setup Python virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r mcp-docs-server/requirements.txt

# Install Crawl4AI
pip install -U crawl4ai
crawl4ai-setup
```

### 2. Configure

Create `.env` file in `mcp-docs-server/`:
```bash
OPENAI_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL=text-embedding-3-small
DEFAULT_RESULTS=5
```

### 3. Run the Web UI

```bash
# Start Next.js server
npm run dev

# Open browser
open http://localhost:3030
```

### 4. Connect to Cursor/Claude

Add to your AI assistant config:

**For Cursor** (`~/.cursor/mcp.json` or project config):
```json
{
  "mcpServers": {
    "marcus-mcp-server": {
      "command": "/path/to/your/venv/bin/python3",
      "args": ["/path/to/crawl4ai_test/mcp-docs-server/server/main.py"]
    }
  }
}
```

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "marcus-docs": {
      "command": "/path/to/your/venv/bin/python",
      "args": ["/path/to/crawl4ai_test/mcp-docs-server/server/main.py"]
    }
  }
}
```

## 📖 How to Use It

### Adding Documentation

**Via Web UI:**
1. Go to http://localhost:3030
2. Click **"Add New Docs"**
3. Enter:
   - **URL**: `https://docs.example.com`
   - **Source Name**: `Example Docs`
   - **Max Pages**: `50` (or unlimited)
4. Click **"Start Indexing"**
5. Wait for completion

**Via Command Line:**
```bash
cd mcp-docs-server
source ../venv/bin/activate

python scripts/crawler.py https://docs.example.com "Example Docs" 50
python scripts/indexer_multi.py "Example Docs"
```

### Adding Repositories

**Via Web UI:**
1. Go to http://localhost:3030
2. Click **"Add Repository"**
3. Enter:
   - **Repository Path**: Drag-and-drop folder OR paste path
   - **Source Name**: Auto-generated from folder name
4. Click **"Start Indexing"**
5. Watch live progress

**What gets indexed:**
- ✅ All text files (`.js`, `.py`, `.md`, `.tsx`, `.json`, `.css`, etc.)
- ✅ Auto-skips: `node_modules`, `.git`, `venv`, `build`, `.next`, etc.
- ✅ Batched embeddings (50-100x faster)

**Via Command Line:**
```bash
cd mcp-docs-server
source ../venv/bin/activate

python scripts/repo_indexer.py "/path/to/your/repo" "My Project"
```

### Searching

**From Web UI:**
1. Enter query: `"How do I initialize the SDK?"`
2. Select source (Docs, Repos, or All)
3. Click **"Search Documentation"**
4. View results

**From AI Assistant:**

Search all sources:
```
@marcus-mcp-server search for "authentication flow"
```

Filter by specific source:
```
@marcus-mcp-server search for "BorrowInterface component" 
with source="Credo Protocol"
```

Example usage in Cursor:
```
User: Using my marcus-mcp-server, show me how authentication 
      is implemented in the Credo Protocol repository

AI: [Searches indexed repository and returns relevant code chunks]
```

**Pro Tip:** Always filter by source name to get focused results and save context tokens.

### Managing Sources

**View Sources:**
- See all indexed docs and repos on the main page
- Filter by "Docs" or "Repos" tabs
- Expand to see individual pages/files

**Delete Sources:**
- Click trash icon next to any source
- Confirm deletion
- Source and all chunks are removed

## 📁 Project Structure

```
crawl4ai_test/
├── pages/                        # Next.js UI
│   ├── index.js                 # Main page (search + sources)
│   ├── add.js                   # Add documentation
│   ├── add-repo.js              # Add repository
│   └── api/                     # API routes
│       ├── mcp-search.js        # Search endpoint
│       ├── mcp-info.js          # Get index info
│       ├── add-docs-crawl.js    # Crawl docs
│       ├── add-docs-index.js    # Index docs
│       ├── add-repo-index.js    # Index repository
│       └── mcp-delete-source.js # Delete source
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── home/                    # Page components
├── mcp-docs-server/             # MCP Server
│   ├── server/
│   │   └── main.py             # MCP server (stdio)
│   ├── scripts/
│   │   ├── crawler.py          # Crawl docs with Crawl4AI
│   │   ├── indexer_multi.py    # Index docs
│   │   ├── repo_indexer.py     # Index repositories
│   │   ├── get_source_pages.py # Get pages/files
│   │   ├── search.py           # Search
│   │   └── delete_source.py    # Delete sources
│   ├── data/
│   │   ├── chroma_db/          # Vector database
│   │   ├── chunks/             # Metadata
│   │   └── raw/                # Crawled JSON
│   └── requirements.txt
└── venv/                        # Python environment
```

## 🎨 Built With

- **Frontend**: Next.js 15 + shadcn/ui + Tailwind CSS
- **Backend**: Python 3.13 + MCP Protocol
- **Crawler**: Crawl4AI
- **Vector DB**: ChromaDB
- **Embeddings**: OpenAI (text-embedding-3-small)

---

**Status**: ✅ Fully Operational | 🤖 MCP Ready | 🔍 Search Enabled
