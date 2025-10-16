#!/usr/bin/env python3
"""
Delete a documentation source from the index
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

# Load environment
load_dotenv()

def delete_source(source_name: str):
    """
    Delete a documentation source from ChromaDB and metadata
    
    Args:
        source_name: Name of the source to delete (e.g., "Moca Network", "Solana")
        
    Returns:
        JSON string with deletion results
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
        
        # Load metadata
        metadata_path = Path(__file__).parent.parent / "data" / "chunks" / "metadata.json"
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Find the source in metadata
        source_to_delete = None
        for source in metadata.get('sources', []):
            if source['name'] == source_name:
                source_to_delete = source
                break
        
        if not source_to_delete:
            return json.dumps({
                'success': False,
                'error': f'Source "{source_name}" not found in metadata'
            })
        
        # Delete all documents from ChromaDB
        # Try both "source" (repositories) and "source_name" (documentation)
        deleted_count = 0
        
        # Try deleting with "source" field (for repositories)
        try:
            results = collection.get(where={"source": source_name})
            if len(results['ids']) > 0:
                collection.delete(where={"source": source_name})
                deleted_count += len(results['ids'])
        except:
            pass
        
        # Try deleting with "source_name" field (for documentation)
        try:
            results = collection.get(where={"source_name": source_name})
            if len(results['ids']) > 0:
                collection.delete(where={"source_name": source_name})
                deleted_count += len(results['ids'])
        except:
            pass
        
        # Update metadata
        metadata['sources'] = [s for s in metadata['sources'] if s['name'] != source_name]
        
        # Recalculate totals (handle both docs and repos)
        total_chunks = sum(
            s.get('chunks', 0) or s.get('total_chunks', 0) 
            for s in metadata['sources']
        )
        total_words = sum(
            s.get('words', 0) or s.get('total_lines', 0) 
            for s in metadata['sources']
        )
        
        metadata['total_chunks'] = total_chunks
        metadata['total_words'] = total_words
        metadata['total_sources'] = len(metadata['sources'])
        
        # Save updated metadata
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Optionally delete the raw data file (only for documentation sources)
        raw_filename = source_to_delete.get('file')
        if raw_filename:  # Only if there's actually a file specified
            raw_file = Path(__file__).parent.parent / "data" / "raw" / raw_filename
            if raw_file.exists() and raw_file.is_file():
                raw_file.unlink()
        
        output = {
            'success': True,
            'message': f'Successfully deleted source "{source_name}"',
            'chunks_removed': deleted_count,
            'remaining_sources': len(metadata['sources']),
            'updated_metadata': {
                'total_chunks': total_chunks,
                'total_words': total_words,
                'total_sources': len(metadata['sources'])
            }
        }
        
        print(json.dumps(output))
        return 0
        
    except Exception as e:
        import traceback
        error_output = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_output), file=sys.stderr)
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: delete_source.py <source_name>'
        }))
        sys.exit(1)
    
    source_name = sys.argv[1]
    sys.exit(delete_source(source_name))

