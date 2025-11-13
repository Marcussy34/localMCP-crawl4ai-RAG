#!/usr/bin/env python3
"""
Standalone search script for MCP documentation
Called by Next.js API endpoint
"""
import os
import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings
from openai import OpenAI

# Load environment
load_dotenv()

def search_docs(query: str, max_results: int = 5, source_filter: str = None):
    """
    Search documentation using semantic search
    
    Args:
        query: Search query
        max_results: Maximum number of results
        source_filter: Optional source name to filter results
        
    Returns:
        JSON string with search results
    """
    try:
        # Initialize clients
        db_path = Path(__file__).parent.parent / "data" / "chroma_db"
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        chroma_client = chromadb.PersistentClient(
            path=str(db_path),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get collection
        collection = chroma_client.get_collection(name="documentation")
        
        # Load metadata to determine filter field
        metadata_path = Path(__file__).parent.parent / "data" / "chunks" / "metadata.json"
        metadata = {}
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
        
        # Generate embedding for query
        embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        response = openai_client.embeddings.create(
            model=embedding_model,
            input=query
        )
        query_embedding = response.data[0].embedding
        
        # Search with optional source filter
        search_params = {
            "query_embeddings": [query_embedding],
            "n_results": max_results
        }
        
        # Add source filter if specified
        if source_filter:
            # Determine which field to use for filtering
            # Documentation sources use "source_name", repositories use "source"
            filter_field = None
            
            # Check metadata to see if this is a documentation source
            for src in metadata.get("sources", []):
                if src.get("name") == source_filter:
                    # It's a documentation source, use source_name
                    if src.get("type") == "documentation":
                        filter_field = "source_name"
                    else:
                        # It's a repository, use source
                        filter_field = "source"
                    break
            
            # If not found in metadata, try source_name first (for documentation)
            # then fall back to source (for repositories or URLs)
            if filter_field is None:
                # Default to source_name for documentation sources
                filter_field = "source_name"
            
            search_params["where"] = {filter_field: source_filter}
        
        results = collection.query(**search_params)
        
        # Format results
        formatted_results = []
        if results['documents'][0]:
            for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
                # Check if this is a repository or documentation chunk
                is_repository = metadata.get('source_type') == 'repository'
                
                if is_repository:
                    # Repository chunk - use file path as title
                    formatted_results.append({
                        'title': metadata.get('file_path', 'Untitled'),
                        'url': metadata.get('full_path', ''),
                        'content': doc,
                        'metadata': {
                            'wordCount': len(doc.split()),
                            'source': metadata.get('source', ''),
                            'source_name': metadata.get('source', ''),
                            'source_type': 'repository',
                            'file_path': metadata.get('file_path', ''),
                            'full_path': metadata.get('full_path', ''),
                            'lines': metadata.get('lines', '')
                        }
                    })
                else:
                    # Documentation chunk - use page title
                    formatted_results.append({
                        'title': metadata.get('title', 'Untitled'),
                        'url': metadata.get('url', ''),
                        'content': doc,
                        'metadata': {
                            'wordCount': len(doc.split()),
                            'source': metadata.get('source', ''),
                            'source_name': metadata.get('source_name', metadata.get('source', '').replace("https://", "").replace("http://", "").split("/")[0]),
                            'source_type': 'documentation'
                        }
                    })
        
        # Return JSON
        output = {
            'success': True,
            'query': query,
            'results': formatted_results,
            'totalResults': len(formatted_results)
        }
        
        print(json.dumps(output))
        return 0
        
    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e),
            'query': query
        }
        print(json.dumps(error_output))
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: search.py <query> [max_results] [source_filter]'
        }))
        sys.exit(1)
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    source_filter = sys.argv[3] if len(sys.argv) > 3 else None
    
    sys.exit(search_docs(query, max_results, source_filter))

