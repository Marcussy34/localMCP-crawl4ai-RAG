#!/usr/bin/env python3
"""
Get all pages for a specific documentation source
"""
import os
import sys
import json
from pathlib import Path
from collections import defaultdict

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
import chromadb
from chromadb.config import Settings

# Load environment
load_dotenv()

def get_source_pages(source_name: str):
    """
    Get all pages for a specific documentation source
    
    Args:
        source_name: Name of the source (e.g., "Moca Network", "Solana")
        
    Returns:
        JSON string with page information
    """
    try:
        # Initialize ChromaDB
        db_path = Path(__file__).parent.parent / "data" / "chroma_db"
        chroma_client = chromadb.PersistentClient(
            path=str(db_path),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get collection
        collection = chroma_client.get_collection(name="documentation")
        
        # Get all documents for this source
        results = collection.get(
            where={"source_name": source_name},
            include=["metadatas", "documents"]
        )
        
        if not results['ids']:
            return json.dumps({
                'success': False,
                'error': f'No documents found for source "{source_name}"'
            })
        
        # Group chunks by page URL
        pages_dict = defaultdict(lambda: {
            'title': '',
            'url': '',
            'chunks': [],
            'totalWords': 0
        })
        
        for i, (doc_id, metadata, content) in enumerate(zip(
            results['ids'],
            results['metadatas'],
            results['documents']
        )):
            url = metadata.get('url', '')
            title = metadata.get('title', 'Untitled')
            
            if url not in pages_dict:
                pages_dict[url]['title'] = title
                pages_dict[url]['url'] = url
            
            # Add chunk info
            chunk_words = len(content.split())
            pages_dict[url]['chunks'].append({
                'id': doc_id,
                'content': content,
                'wordCount': chunk_words,
                'chunkIndex': len(pages_dict[url]['chunks'])
            })
            pages_dict[url]['totalWords'] += chunk_words
        
        # Convert to list and sort by title
        pages = []
        for url, page_data in pages_dict.items():
            pages.append({
                'title': page_data['title'],
                'url': page_data['url'],
                'chunkCount': len(page_data['chunks']),
                'totalWords': page_data['totalWords'],
                'chunks': page_data['chunks']
            })
        
        # Sort by title
        pages.sort(key=lambda x: x['title'])
        
        output = {
            'success': True,
            'source': source_name,
            'totalPages': len(pages),
            'totalChunks': sum(p['chunkCount'] for p in pages),
            'totalWords': sum(p['totalWords'] for p in pages),
            'pages': pages
        }
        
        print(json.dumps(output))
        return 0
        
    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_output))
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: get_source_pages.py <source_name>'
        }))
        sys.exit(1)
    
    source_name = sys.argv[1]
    sys.exit(get_source_pages(source_name))

