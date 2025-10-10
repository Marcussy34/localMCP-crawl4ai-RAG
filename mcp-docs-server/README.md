# MCP Documentation Server

A local MCP server that provides intelligent, context-aware documentation retrieval using OpenAI embeddings.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure your OpenAI API key in `.env`:
   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. Crawl documentation (see Phase 2 in main implementation plan)

4. Index documentation:
   ```bash
   cd scripts
   python indexer.py docs.json
   ```

5. Run MCP server:
   ```bash
   cd server
   python main.py
   ```

## Directory Structure

- `data/raw/` - Raw markdown from Crawl4AI
- `data/chunks/` - Chunked content metadata
- `data/chroma_db/` - ChromaDB vector storage
- `scripts/` - Utility scripts (indexer, crawler, maintenance)
- `server/` - MCP server implementation

## Cost

- One-time indexing: ~$0.01
- Ongoing queries: $0 (local retrieval)
- Storage: Local (free)

## Usage

Once configured in Cursor, you can:
- Ask questions: "How do I configure deep crawl?"
- Request context: `@local-docs find extraction strategies`
- Get automatic context while coding

