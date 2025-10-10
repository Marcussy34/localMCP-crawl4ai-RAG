#!/usr/bin/env python3
"""
MCP Documentation Server
Provides semantic search over indexed documentation via MCP protocol
"""
import os
import sys
from pathlib import Path
from typing import Optional
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
from openai import OpenAI
import mcp.server.stdio
import mcp.types as types
from mcp.server import NotificationOptions, Server

# Load environment
load_dotenv()

# Configuration
DB_PATH = Path(__file__).parent.parent / "data" / "chroma_db"
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
DEFAULT_RESULTS = int(os.getenv("DEFAULT_RESULTS", 5))

# Initialize clients
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
chroma_client = chromadb.PersistentClient(
    path=str(DB_PATH),
    settings=Settings(anonymized_telemetry=False)
)

# Load metadata
metadata_path = Path(__file__).parent.parent / "data" / "chunks" / "metadata.json"
with open(metadata_path, 'r') as f:
    metadata = json.load(f)

# Format metadata for compatibility (support both single and multi-source)
index_metadata = {
    "total_pages": metadata.get("total_pages", 0) or sum(s.get("pages", 0) for s in metadata.get("sources", [])),
    "total_chunks": metadata.get("total_chunks", 0),
    "total_words": metadata.get("total_words", 0),
    "source": metadata.get("source") or (metadata["sources"][0]["url"] if metadata.get("sources") else "Unknown"),
    "sources": metadata.get("sources", []),
    "indexed_at": metadata.get("indexed_at") or metadata.get("last_updated"),
    "embedding_model": metadata.get("embedding_model", "text-embedding-3-small"),
    "chunk_size": metadata.get("chunk_size", 800),
    "chunk_overlap": metadata.get("chunk_overlap", 100)
}

# Get collection
try:
    collection = chroma_client.get_collection(name="documentation")
except Exception as e:
    print(f"Error loading collection: {e}", file=sys.stderr)
    sys.exit(1)

# Create MCP server
server = Server("marcus-mcp-server")

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available tools"""
    return [
        types.Tool(
            name="search-docs",
            description=(
                f"Search through {index_metadata['source']} documentation using semantic search. "
                f"Returns relevant documentation chunks with context. "
                f"Indexed: {index_metadata['total_pages']} pages, "
                f"{index_metadata['total_chunks']} chunks, "
                f"{index_metadata['total_words']:,} words."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language search query (e.g., 'How do I set up AIR Kit?', 'What is Moca Chain?')"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": f"Maximum number of results to return (default: {DEFAULT_RESULTS})",
                        "default": DEFAULT_RESULTS
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="get-index-info",
            description="Get information about the indexed documentation including source, pages, chunks, and last update time.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, 
    arguments: dict
) -> list[types.TextContent]:
    """Handle tool calls"""
    
    if name == "get-index-info":
        info = (
            f"📚 **Documentation Index Information**\n\n"
            f"**Source:** {index_metadata['source']}\n"
            f"**Indexed:** {index_metadata['indexed_at']}\n"
            f"**Total Pages:** {index_metadata['total_pages']}\n"
            f"**Total Chunks:** {index_metadata['total_chunks']}\n"
            f"**Total Words:** {index_metadata['total_words']:,}\n"
            f"**Embedding Model:** {index_metadata['embedding_model']}\n"
            f"**Chunk Size:** {index_metadata['chunk_size']} tokens\n"
            f"**Chunk Overlap:** {index_metadata['chunk_overlap']} tokens\n"
        )
        return [types.TextContent(type="text", text=info)]
    
    elif name == "search-docs":
        query = arguments.get("query")
        max_results = arguments.get("max_results", DEFAULT_RESULTS)
        
        if not query:
            return [types.TextContent(
                type="text",
                text="Error: query parameter is required"
            )]
        
        try:
            # Generate embedding for query
            response = openai_client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=query
            )
            query_embedding = response.data[0].embedding
            
            # Search
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=max_results
            )
            
            if not results['documents'][0]:
                return [types.TextContent(
                    type="text",
                    text=f"No results found for query: '{query}'"
                )]
            
            # Format results
            output = f"# Search Results for: \"{query}\"\n\n"
            output += f"Found {len(results['documents'][0])} relevant results:\n\n"
            output += "---\n\n"
            
            for i, (doc, metadata) in enumerate(zip(
                results['documents'][0], 
                results['metadatas'][0]
            ), 1):
                output += f"## Result {i}\n\n"
                output += f"**Page:** {metadata['title']}\n\n"
                output += f"**URL:** {metadata['url']}\n\n"
                output += f"**Content:**\n\n{doc}\n\n"
                output += "---\n\n"
            
            return [types.TextContent(type="text", text=output)]
            
        except Exception as e:
            return [types.TextContent(
                type="text",
                text=f"Error performing search: {str(e)}"
            )]
    
    else:
        return [types.TextContent(
            type="text",
            text=f"Unknown tool: {name}"
        )]

async def main():
    """Run the MCP server"""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

