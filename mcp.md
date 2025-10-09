# MCP Documentation Server Implementation Plan

**Goal:** Build a local MCP server that provides intelligent, context-aware documentation retrieval using OpenAI embeddings, without overwhelming token limits.

**Tech Stack:**
- Python 3.9+ (MCP Server)
- OpenAI Embeddings API (text-embedding-3-small)
- ChromaDB (Local vector database)
- Existing Crawl4AI setup (Data collection)
- MCP SDK (Cursor integration)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Project Setup](#phase-1-project-setup)
4. [Phase 2: Crawl & Prepare Documentation](#phase-2-crawl--prepare-documentation)
5. [Phase 3: Build Indexer with OpenAI Embeddings](#phase-3-build-indexer-with-openai-embeddings)
6. [Phase 4: Create MCP Server](#phase-4-create-mcp-server)
7. [Phase 5: Configure Cursor Integration](#phase-5-configure-cursor-integration)
8. [Phase 6: Testing & Validation](#phase-6-testing--validation)
9. [Phase 7: Usage & Maintenance](#phase-7-usage--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Cursor IDE]                                               │
│       ↓                                                      │
│  [MCP Client] ← stdio → [MCP Server (Python)]               │
│                              ↓                               │
│                         [Search Engine]                      │
│                              ↓                               │
│                   ┌──────────┴──────────┐                   │
│                   ↓                     ↓                    │
│            [ChromaDB]              [OpenAI API]             │
│            (Vectors)               (Embeddings)             │
│                   ↑                                          │
│                   │                                          │
│            [Indexer Script]                                  │
│                   ↑                                          │
│            [Crawl4AI Output]                                │
│            (Raw Markdown)                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Data Flow:
1. Crawl docs → Raw markdown files
2. Indexer chunks content → Sends to OpenAI → Stores vectors in ChromaDB
3. User queries in Cursor → MCP Server searches ChromaDB → Returns relevant chunks
```

### Key Components:

1. **Crawler** (Existing): Fetches documentation pages
2. **Indexer** (New): Chunks docs, creates embeddings, stores in vector DB
3. **MCP Server** (New): Handles queries, retrieves relevant chunks
4. **Vector Database** (ChromaDB): Stores embeddings locally
5. **OpenAI API**: Generates embeddings (one-time per doc update)

---

## Prerequisites

### Required Tools & Accounts:

- [x] Python 3.9+ installed
- [x] Node.js 18+ installed (for MCP)
- [x] Cursor IDE installed
- [x] OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- [x] Existing Crawl4AI setup (you have this)

### Required Python Packages:

```bash
pip install openai chromadb mcp python-dotenv
```

### Environment Variables:

```bash
OPENAI_API_KEY=sk-...your-key...
```

### Estimated Costs:

- **OpenAI Embeddings**: ~$0.01-0.02 per indexing (one-time per doc update)
- **Storage**: ~500MB local disk space
- **Total Monthly**: $0 (queries are free, only pay when re-indexing)

---

## Phase 1: Project Setup

### 1.1 Create Project Structure

```bash
cd /Users/marcus/Projects/crawl4ai_test
mkdir -p mcp-docs-server/{data,scripts,server}
```

**Directory structure:**
```
mcp-docs-server/
├── data/                    # Crawled and processed data
│   ├── raw/                # Raw markdown from Crawl4AI
│   ├── chunks/             # Chunked content (JSON)
│   └── chroma_db/          # ChromaDB storage
├── scripts/                # Utility scripts
│   ├── indexer.py         # Main indexing script
│   └── crawler.py         # Crawl automation wrapper
├── server/                 # MCP server
│   ├── main.py            # MCP server entry point
│   ├── retriever.py       # Search logic
│   └── config.py          # Configuration
├── .env                    # Environment variables
├── requirements.txt        # Python dependencies
└── README.md              # Documentation
```

### 1.2 Create Requirements File

**File: `mcp-docs-server/requirements.txt`**
```
openai>=1.0.0
chromadb>=0.4.0
mcp>=0.1.0
python-dotenv>=1.0.0
tiktoken>=0.5.0
```

### 1.3 Create Environment File

**File: `mcp-docs-server/.env`**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-key-here

# Embedding Model
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Chunk Settings
CHUNK_SIZE=800
CHUNK_OVERLAP=100

# Retrieval Settings
TOP_K_RESULTS=5
MIN_SIMILARITY_SCORE=0.7

# MCP Server
MCP_SERVER_NAME=local-docs
MCP_SERVER_VERSION=1.0.0
```

### 1.4 Install Dependencies

```bash
cd mcp-docs-server
pip install -r requirements.txt
```

**Validation:**
```bash
python -c "import openai, chromadb, mcp; print('All packages installed successfully!')"
```

---

## Phase 2: Crawl & Prepare Documentation

### 2.1 Crawl Documentation

Using your existing Crawl4AI setup, crawl the documentation site:

**Steps:**
1. Open your Crawl4AI web interface
2. Configure crawl:
   - URL: `https://docs.example.com` (your target docs)
   - Enable Deep Crawl: ✅
   - Strategy: BFS
   - Max Pages: 160 (or unlimited)
   - Extraction: Markdown
3. Click "Start Crawl"
4. Click "Copy All Pages"

### 2.2 Save Raw Documentation

**File: `mcp-docs-server/data/raw/docs.json`**

```json
{
  "source": "https://docs.example.com",
  "crawled_at": "2025-01-09T00:00:00Z",
  "total_pages": 160,
  "total_words": 260000,
  "pages": [
    {
      "url": "https://docs.example.com/getting-started",
      "title": "Getting Started",
      "content": "# Getting Started\n\n...",
      "wordCount": 1500
    }
  ]
}
```

**Alternative: Use API to automate**

**File: `mcp-docs-server/scripts/crawler.py`**
```python
#!/usr/bin/env python3
"""
Automated documentation crawler using Crawl4AI backend
"""
import json
import subprocess
import sys
from pathlib import Path

def crawl_docs(url: str, max_pages: int = 0, output_file: str = "docs.json"):
    """Crawl documentation and save to JSON"""
    
    # Prepare crawl configuration
    config = {
        "url": url,
        "extractionType": "markdown",
        "headless": True,
        "deepCrawl": True,
        "crawlStrategy": "bfs",
        "maxPages": max_pages
    }
    
    # Path to your existing crawl backend
    backend_path = Path(__file__).parent.parent.parent / "crawl_backend.py"
    venv_python = Path(__file__).parent.parent.parent / "venv" / "bin" / "python3"
    
    # Run crawler
    print(f"Crawling {url}...")
    result = subprocess.run(
        [str(venv_python), str(backend_path)],
        input=json.dumps(config),
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    
    # Parse and save result
    crawl_result = json.loads(result.stdout)
    
    # Save to file
    output_path = Path(__file__).parent.parent / "data" / "raw" / output_file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(crawl_result, f, indent=2)
    
    print(f"✅ Crawled {crawl_result.get('totalPages', 0)} pages")
    print(f"✅ Saved to {output_path}")
    
    return crawl_result

if __name__ == "__main__":
    # Example usage
    crawl_docs(
        url="https://docs.crawl4ai.com",
        max_pages=0,  # unlimited
        output_file="crawl4ai_docs.json"
    )
```

**Run crawler:**
```bash
cd mcp-docs-server/scripts
python crawler.py
```

---

## Phase 3: Build Indexer with OpenAI Embeddings

### 3.1 Create Chunking Logic

**File: `mcp-docs-server/scripts/indexer.py`**

```python
#!/usr/bin/env python3
"""
Documentation indexer with OpenAI embeddings and ChromaDB
"""
import json
import os
import sys
from pathlib import Path
from typing import List, Dict
import re

import chromadb
from chromadb.config import Settings
from openai import OpenAI
from dotenv import load_dotenv
import tiktoken

# Load environment variables
load_dotenv()

class DocIndexer:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        self.chunk_size = int(os.getenv("CHUNK_SIZE", 800))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", 100))
        
        # Initialize ChromaDB
        db_path = Path(__file__).parent.parent / "data" / "chroma_db"
        db_path.mkdir(parents=True, exist_ok=True)
        
        self.chroma_client = chromadb.PersistentClient(
            path=str(db_path),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Create or get collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="documentation",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Tokenizer for chunking
        self.tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
    
    def chunk_text(self, text: str, metadata: dict) -> List[Dict]:
        """Split text into overlapping chunks"""
        chunks = []
        
        # Tokenize
        tokens = self.tokenizer.encode(text)
        
        # Create chunks with overlap
        for i in range(0, len(tokens), self.chunk_size - self.chunk_overlap):
            chunk_tokens = tokens[i:i + self.chunk_size]
            chunk_text = self.tokenizer.decode(chunk_tokens)
            
            # Skip very small chunks
            if len(chunk_tokens) < 50:
                continue
            
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    **metadata,
                    "chunk_index": len(chunks),
                    "total_chunks": None,  # Will update after
                    "chunk_tokens": len(chunk_tokens)
                }
            })
        
        # Update total chunks
        for chunk in chunks:
            chunk["metadata"]["total_chunks"] = len(chunks)
        
        return chunks
    
    def create_embedding(self, text: str) -> List[float]:
        """Create embedding using OpenAI API"""
        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding
    
    def index_documents(self, docs_file: str):
        """Index documentation from JSON file"""
        
        # Load documents
        docs_path = Path(__file__).parent.parent / "data" / "raw" / docs_file
        with open(docs_path) as f:
            data = json.load(f)
        
        pages = data.get("pages", [])
        total_pages = len(pages)
        
        print(f"📄 Indexing {total_pages} pages...")
        
        all_chunks = []
        all_embeddings = []
        all_metadatas = []
        all_ids = []
        
        for page_idx, page in enumerate(pages):
            print(f"Processing page {page_idx + 1}/{total_pages}: {page['title']}")
            
            # Create chunks for this page
            chunks = self.chunk_text(
                text=page['content'],
                metadata={
                    "url": page['url'],
                    "title": page['title'],
                    "page_index": page_idx,
                    "source": data.get("source", "unknown")
                }
            )
            
            # Create embeddings for each chunk
            for chunk_idx, chunk in enumerate(chunks):
                chunk_id = f"page_{page_idx}_chunk_{chunk_idx}"
                
                # Create embedding
                embedding = self.create_embedding(chunk["text"])
                
                all_chunks.append(chunk["text"])
                all_embeddings.append(embedding)
                all_metadatas.append(chunk["metadata"])
                all_ids.append(chunk_id)
                
                # Progress indicator
                if (page_idx * len(chunks) + chunk_idx + 1) % 10 == 0:
                    print(f"  ✓ Embedded {len(all_chunks)} chunks so far...")
        
        # Store in ChromaDB
        print(f"\n💾 Storing {len(all_chunks)} chunks in ChromaDB...")
        
        # Clear existing collection
        self.chroma_client.delete_collection("documentation")
        self.collection = self.chroma_client.create_collection(
            name="documentation",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Add in batches (ChromaDB has limits)
        batch_size = 100
        for i in range(0, len(all_chunks), batch_size):
            end_idx = min(i + batch_size, len(all_chunks))
            
            self.collection.add(
                documents=all_chunks[i:end_idx],
                embeddings=all_embeddings[i:end_idx],
                metadatas=all_metadatas[i:end_idx],
                ids=all_ids[i:end_idx]
            )
            
            print(f"  ✓ Stored batch {i//batch_size + 1}/{(len(all_chunks) + batch_size - 1)//batch_size}")
        
        print(f"\n✅ Successfully indexed {len(all_chunks)} chunks from {total_pages} pages!")
        
        # Save metadata
        metadata_file = Path(__file__).parent.parent / "data" / "chunks" / "metadata.json"
        metadata_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(metadata_file, 'w') as f:
            json.dump({
                "total_pages": total_pages,
                "total_chunks": len(all_chunks),
                "source": data.get("source"),
                "indexed_at": data.get("crawled_at"),
                "embedding_model": self.embedding_model
            }, f, indent=2)
        
        print(f"📊 Metadata saved to {metadata_file}")

if __name__ == "__main__":
    indexer = DocIndexer()
    
    # Index the crawled documentation
    docs_file = sys.argv[1] if len(sys.argv) > 1 else "docs.json"
    indexer.index_documents(docs_file)
```

### 3.2 Run Indexer

```bash
cd mcp-docs-server/scripts
python indexer.py crawl4ai_docs.json
```

**Expected Output:**
```
📄 Indexing 160 pages...
Processing page 1/160: Getting Started
  ✓ Embedded 10 chunks so far...
Processing page 2/160: Installation
  ✓ Embedded 20 chunks so far...
...
💾 Storing 523 chunks in ChromaDB...
  ✓ Stored batch 1/6
  ✓ Stored batch 2/6
...
✅ Successfully indexed 523 chunks from 160 pages!
📊 Metadata saved to data/chunks/metadata.json
```

**Cost Calculation:**
- 260,000 words ≈ 350,000 tokens
- text-embedding-3-small: $0.00002 per 1K tokens
- Total cost: 350 × $0.00002 = **$0.007** (less than 1 cent!)

---

## Phase 4: Create MCP Server

### 4.1 Create Retriever Module

**File: `mcp-docs-server/server/retriever.py`**

```python
"""
Documentation retrieval with semantic search
"""
import os
from typing import List, Dict, Optional
from pathlib import Path

import chromadb
from chromadb.config import Settings
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class DocRetriever:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        self.top_k = int(os.getenv("TOP_K_RESULTS", 5))
        self.min_score = float(os.getenv("MIN_SIMILARITY_SCORE", 0.7))
        
        # Initialize ChromaDB
        db_path = Path(__file__).parent.parent / "data" / "chroma_db"
        
        if not db_path.exists():
            raise FileNotFoundError(
                f"ChromaDB not found at {db_path}. Please run indexer first."
            )
        
        self.chroma_client = chromadb.PersistentClient(
            path=str(db_path),
            settings=Settings(anonymized_telemetry=False)
        )
        
        self.collection = self.chroma_client.get_collection("documentation")
    
    def create_query_embedding(self, query: str) -> List[float]:
        """Create embedding for search query"""
        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=query
        )
        return response.data[0].embedding
    
    def search(self, query: str, top_k: Optional[int] = None) -> List[Dict]:
        """Search for relevant documentation chunks"""
        
        k = top_k or self.top_k
        
        # Create query embedding
        query_embedding = self.create_query_embedding(query)
        
        # Search in ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"]
        )
        
        # Format results
        formatted_results = []
        
        for i in range(len(results['documents'][0])):
            # Convert distance to similarity score (cosine)
            distance = results['distances'][0][i]
            similarity = 1 - distance
            
            # Filter by minimum score
            if similarity < self.min_score:
                continue
            
            formatted_results.append({
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "similarity": round(similarity, 4)
            })
        
        return formatted_results
    
    def get_stats(self) -> Dict:
        """Get indexer statistics"""
        metadata_file = Path(__file__).parent.parent / "data" / "chunks" / "metadata.json"
        
        if metadata_file.exists():
            import json
            with open(metadata_file) as f:
                return json.load(f)
        
        return {
            "total_chunks": self.collection.count(),
            "status": "indexed"
        }
```

### 4.2 Create MCP Server

**File: `mcp-docs-server/server/main.py`**

```python
#!/usr/bin/env python3
"""
MCP Server for local documentation search
"""
import asyncio
import os
from typing import Optional

from mcp.server import Server
from mcp.types import Resource, Tool, TextContent, EmbeddedResource
from dotenv import load_dotenv

from retriever import DocRetriever

load_dotenv()

# Initialize components
retriever = DocRetriever()
app = Server(os.getenv("MCP_SERVER_NAME", "local-docs"))

@app.list_resources()
async def list_resources() -> list[Resource]:
    """List available documentation resources"""
    stats = retriever.get_stats()
    
    return [
        Resource(
            uri="docs://local/stats",
            name="Documentation Statistics",
            mimeType="application/json",
            description=f"Index stats: {stats.get('total_chunks', 0)} chunks from {stats.get('total_pages', 0)} pages"
        )
    ]

@app.read_resource()
async def read_resource(uri: str) -> str:
    """Read a resource"""
    if uri == "docs://local/stats":
        import json
        stats = retriever.get_stats()
        return json.dumps(stats, indent=2)
    
    raise ValueError(f"Unknown resource: {uri}")

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="search_docs",
            description="Search local documentation using semantic search. Returns relevant chunks based on your query.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query describing what you're looking for"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Number of results to return (default: 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    
    if name == "search_docs":
        query = arguments.get("query")
        top_k = arguments.get("top_k", 5)
        
        # Search
        results = retriever.search(query, top_k)
        
        if not results:
            return [
                TextContent(
                    type="text",
                    text=f"No relevant documentation found for: {query}"
                )
            ]
        
        # Format results
        response_parts = [
            f"Found {len(results)} relevant documentation chunks:\n"
        ]
        
        for i, result in enumerate(results, 1):
            metadata = result['metadata']
            response_parts.append(
                f"\n## Result {i} - {metadata['title']} (Similarity: {result['similarity']})\n"
                f"**Source:** {metadata['url']}\n"
                f"**Chunk:** {metadata['chunk_index'] + 1}/{metadata['total_chunks']}\n\n"
                f"{result['content']}\n"
                f"\n---\n"
            )
        
        return [
            TextContent(
                type="text",
                text="".join(response_parts)
            )
        ]
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    """Run the MCP server"""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

### 4.3 Create Server Configuration

**File: `mcp-docs-server/server/config.py`**

```python
"""
MCP Server configuration
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
CHROMA_DB_PATH = DATA_DIR / "chroma_db"

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# Retrieval
TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", 5))
MIN_SIMILARITY_SCORE = float(os.getenv("MIN_SIMILARITY_SCORE", 0.7))

# MCP
MCP_SERVER_NAME = os.getenv("MCP_SERVER_NAME", "local-docs")
MCP_SERVER_VERSION = os.getenv("MCP_SERVER_VERSION", "1.0.0")
```

### 4.4 Make Server Executable

```bash
chmod +x mcp-docs-server/server/main.py
```

---

## Phase 5: Configure Cursor Integration

### 5.1 Test MCP Server Locally

```bash
cd mcp-docs-server/server
python main.py
```

**Test with MCP Inspector:**
```bash
npx @modelcontextprotocol/inspector python main.py
```

### 5.2 Configure Cursor Settings

**File: `~/.cursor/mcp.json` or Cursor Settings → MCP**

```json
{
  "mcpServers": {
    "local-docs": {
      "command": "python",
      "args": [
        "/Users/marcus/Projects/crawl4ai_test/mcp-docs-server/server/main.py"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here"
      }
    }
  }
}
```

**Alternative: Using venv Python:**
```json
{
  "mcpServers": {
    "local-docs": {
      "command": "/Users/marcus/Projects/crawl4ai_test/mcp-docs-server/venv/bin/python",
      "args": [
        "/Users/marcus/Projects/crawl4ai_test/mcp-docs-server/server/main.py"
      ]
    }
  }
}
```

### 5.3 Restart Cursor

1. Quit Cursor completely
2. Reopen Cursor
3. Check MCP status in bottom right corner
4. Should see "local-docs" connected

---

## Phase 6: Testing & Validation

### 6.1 Test Search Functionality

**Create test script:**

**File: `mcp-docs-server/scripts/test_search.py`**

```python
#!/usr/bin/env python3
"""
Test the retriever
"""
import sys
from pathlib import Path

# Add server to path
sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

from retriever import DocRetriever

def test_search():
    retriever = DocRetriever()
    
    # Test queries
    queries = [
        "How do I configure deep crawl?",
        "What are the different extraction strategies?",
        "How to use custom JavaScript?",
    ]
    
    for query in queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print('='*60)
        
        results = retriever.search(query, top_k=3)
        
        for i, result in enumerate(results, 1):
            print(f"\nResult {i} (Similarity: {result['similarity']}):")
            print(f"Title: {result['metadata']['title']}")
            print(f"URL: {result['metadata']['url']}")
            print(f"Content: {result['content'][:200]}...")

if __name__ == "__main__":
    test_search()
```

**Run test:**
```bash
cd mcp-docs-server/scripts
python test_search.py
```

### 6.2 Test in Cursor

**Method 1: Direct Tool Use**
1. Open Cursor
2. Open command palette (Cmd/Ctrl + Shift + P)
3. Search for "MCP: Call Tool"
4. Select `local-docs.search_docs`
5. Enter query: "How to configure deep crawl?"

**Method 2: In Chat**
```
@local-docs search for deep crawl configuration
```

**Method 3: Automatic Context**
When coding, Cursor will automatically query your docs based on context!

### 6.3 Validation Checklist

- [ ] ChromaDB contains indexed chunks
- [ ] Search returns relevant results
- [ ] Similarity scores are above threshold (0.7+)
- [ ] MCP server starts without errors
- [ ] Cursor shows "local-docs" as connected
- [ ] Can call `search_docs` tool from Cursor
- [ ] Results appear in chat/context

---

## Phase 7: Usage & Maintenance

### 7.1 Daily Usage

**In Cursor, you can:**

1. **Ask questions directly:**
   ```
   How do I use deep crawl with BFS strategy?
   ```
   _(Cursor will automatically search your docs)_

2. **Request specific context:**
   ```
   @local-docs find information about extraction strategies
   ```

3. **Get code examples:**
   ```
   Show me how to configure headless mode based on the docs
   ```

### 7.2 Update Documentation

**When docs are updated:**

```bash
# 1. Re-crawl
cd mcp-docs-server/scripts
python crawler.py

# 2. Re-index
python indexer.py crawl4ai_docs.json

# 3. Restart MCP server (Cursor will auto-restart)
```

**Cost per update:** ~$0.01 (only changed pages need re-embedding)

### 7.3 Add More Documentation Sources

**Edit `.env`:**
```bash
# Add multiple sources
DOC_SOURCES=crawl4ai,nextjs,react,python
```

**Index multiple sources:**
```bash
python crawler.py https://nextjs.org/docs nextjs_docs.json
python indexer.py nextjs_docs.json

python crawler.py https://react.dev react_docs.json
python indexer.py react_docs.json
```

ChromaDB will store all in the same collection with source metadata.

### 7.4 Maintenance Scripts

**File: `mcp-docs-server/scripts/maintenance.py`**

```python
#!/usr/bin/env python3
"""
Maintenance utilities
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "server"))

from retriever import DocRetriever

def show_stats():
    """Show index statistics"""
    retriever = DocRetriever()
    stats = retriever.get_stats()
    
    print("📊 Documentation Index Statistics")
    print("="*50)
    print(f"Total Pages: {stats.get('total_pages', 'N/A')}")
    print(f"Total Chunks: {stats.get('total_chunks', 'N/A')}")
    print(f"Source: {stats.get('source', 'N/A')}")
    print(f"Last Indexed: {stats.get('indexed_at', 'N/A')}")
    print(f"Embedding Model: {stats.get('embedding_model', 'N/A')}")

def clear_index():
    """Clear the entire index"""
    import chromadb
    from chromadb.config import Settings
    
    db_path = Path(__file__).parent.parent / "data" / "chroma_db"
    client = chromadb.PersistentClient(
        path=str(db_path),
        settings=Settings(anonymized_telemetry=False)
    )
    
    try:
        client.delete_collection("documentation")
        print("✅ Index cleared successfully")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "stats"
    
    if command == "stats":
        show_stats()
    elif command == "clear":
        confirm = input("Are you sure you want to clear the index? (yes/no): ")
        if confirm.lower() == "yes":
            clear_index()
```

---

## Troubleshooting

### Issue 1: "OpenAI API Key not found"

**Solution:**
```bash
# Check .env file
cat mcp-docs-server/.env

# Ensure key is set
export OPENAI_API_KEY=sk-your-key-here

# Or add to Cursor MCP config
```

### Issue 2: "ChromaDB not found"

**Solution:**
```bash
# Run indexer first
cd mcp-docs-server/scripts
python indexer.py docs.json
```

### Issue 3: "MCP server not connecting"

**Solution:**
```bash
# Test server standalone
cd mcp-docs-server/server
python main.py

# Check Cursor logs
# Cursor → Help → Show Logs → MCP

# Verify path in Cursor settings
```

### Issue 4: "Poor search results"

**Solution:**
```python
# Adjust in .env
MIN_SIMILARITY_SCORE=0.6  # Lower threshold
TOP_K_RESULTS=10          # More results

# Or adjust chunk size
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### Issue 5: "Rate limit error from OpenAI"

**Solution:**
- Free tier: 3 requests/min
- Paid tier: 500 requests/min
- Add delay in indexer:
```python
import time
time.sleep(0.5)  # After each embedding
```

---

## Quick Reference Commands

```bash
# Install dependencies
cd mcp-docs-server
pip install -r requirements.txt

# Crawl documentation
cd scripts
python crawler.py

# Index documentation
python indexer.py docs.json

# Test search
python test_search.py

# Run MCP server
cd ../server
python main.py

# Show stats
cd ../scripts
python maintenance.py stats

# Clear index
python maintenance.py clear
```

---

## Next Steps

After implementation:

1. ✅ Test with your actual documentation
2. ✅ Fine-tune chunk size and overlap
3. ✅ Adjust similarity threshold
4. ✅ Add more documentation sources
5. ✅ Create update automation (cron job)
6. ✅ Share with team (if desired)

---

## Cost Summary

| Item | One-time Cost | Monthly Cost |
|------|--------------|--------------|
| OpenAI Indexing (260k words) | $0.01 | - |
| OpenAI Queries | - | $0 (free) |
| ChromaDB Storage | - | $0 (local) |
| Server Hosting | - | $0 (local) |
| **Total** | **$0.01** | **$0** |

---

## Support

If you encounter issues:

1. Check logs: `mcp-docs-server/server/logs/`
2. Run diagnostics: `python scripts/maintenance.py stats`
3. Test retriever: `python scripts/test_search.py`
4. Check Cursor MCP logs: Cursor → Help → Show Logs

---

**You're all set! 🎉**

This MCP server will provide intelligent, context-aware documentation retrieval directly in Cursor, without overwhelming your token limits.

