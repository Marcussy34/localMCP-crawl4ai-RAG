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

def search_docs(query: str, max_results: int = 5):
    """
    Search documentation using semantic search
    
    Args:
        query: Search query
        max_results: Maximum number of results
        
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
        
        # Generate embedding for query
        embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        response = openai_client.embeddings.create(
            model=embedding_model,
            input=query
        )
        query_embedding = response.data[0].embedding
        
        # Search
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=max_results
        )
        
        # Format results
        formatted_results = []
        if results['documents'][0]:
            for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
                formatted_results.append({
                    'title': metadata.get('title', 'Untitled'),
                    'url': metadata.get('url', ''),
                    'content': doc,
                    'metadata': {
                        'wordCount': len(doc.split()),
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
            'error': 'Usage: search.py <query> [max_results]'
        }))
        sys.exit(1)
    
    query = sys.argv[1]
    max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    sys.exit(search_docs(query, max_results))

