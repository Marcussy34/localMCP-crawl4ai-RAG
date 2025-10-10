#!/usr/bin/env python3
"""
Multi-source documentation indexer with OpenAI embeddings and ChromaDB
Supports indexing multiple documentation sources into a single searchable collection
"""
import json
import os
import sys
from pathlib import Path
from typing import List, Dict
import re
from datetime import datetime, timezone

import chromadb
from chromadb.config import Settings
from openai import OpenAI
from dotenv import load_dotenv
import tiktoken

# Load environment variables
load_dotenv()

class MultiDocIndexer:
    def __init__(self, append_mode: bool = True):
        """
        Initialize the multi-source indexer
        
        Args:
            append_mode: If True, adds to existing docs. If False, replaces all.
        """
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
        self.chunk_size = int(os.getenv("CHUNK_SIZE", 800))
        self.chunk_overlap = int(os.getenv("CHUNK_OVERLAP", 100))
        self.append_mode = append_mode
        
        # Initialize ChromaDB
        db_path = Path(__file__).parent.parent / "data" / "chroma_db"
        db_path.mkdir(parents=True, exist_ok=True)
        
        self.chroma_client = chromadb.PersistentClient(
            path=str(db_path),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Load or create metadata
        self.metadata_file = Path(__file__).parent.parent / "data" / "chunks" / "metadata.json"
        self.metadata_file.parent.mkdir(parents=True, exist_ok=True)
        self.metadata = self.load_metadata()
        
        # Create or get collection
        if append_mode:
            self.collection = self.chroma_client.get_or_create_collection(
                name="documentation",
                metadata={"hnsw:space": "cosine"}
            )
        else:
            # Clear and recreate
            try:
                self.chroma_client.delete_collection("documentation")
                print("  🗑️  Cleared existing collection")
            except:
                pass
            self.collection = self.chroma_client.create_collection(
                name="documentation",
                metadata={"hnsw:space": "cosine"}
            )
            self.metadata = {"sources": [], "total_chunks": 0, "total_words": 0}
        
        # Tokenizer for chunking
        self.tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
    
    def load_metadata(self) -> dict:
        """Load existing metadata"""
        if self.metadata_file.exists():
            with open(self.metadata_file) as f:
                return json.load(f)
        return {
            "sources": [],
            "total_chunks": 0,
            "total_words": 0,
            "embedding_model": self.embedding_model,
            "chunk_size": self.chunk_size,
            "chunk_overlap": self.chunk_overlap
        }
    
    def save_metadata(self):
        """Save metadata to file"""
        self.metadata["embedding_model"] = self.embedding_model
        self.metadata["chunk_size"] = self.chunk_size
        self.metadata["chunk_overlap"] = self.chunk_overlap
        self.metadata["last_updated"] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
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
                    "total_chunks": None,
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
    
    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for multiple texts in one API call (much faster!)"""
        response = self.openai_client.embeddings.create(
            model=self.embedding_model,
            input=texts
        )
        return [item.embedding for item in response.data]
    
    def index_documents(self, docs_file: str, source_name: str = None):
        """
        Index documentation from JSON file
        
        Args:
            docs_file: JSON file with crawled documentation
            source_name: Custom name for this source (optional)
        """
        
        # Load documents
        docs_path = Path(__file__).parent.parent / "data" / "raw" / docs_file
        with open(docs_path) as f:
            data = json.load(f)
        
        pages = data.get("pages", [])
        total_pages = len(pages)
        source_url = data.get("source", "unknown")
        
        # Use custom source name or extract from URL
        if not source_name:
            # Extract domain name from source URL
            source_name = source_url.replace("https://", "").replace("http://", "").split("/")[0]
        
        print(f"📄 Indexing {total_pages} pages from {source_name}...")
        print(f"📊 Total words: {data.get('total_words', 0):,}")
        print(f"⚙️  Chunk size: {self.chunk_size} tokens, overlap: {self.chunk_overlap}")
        print(f"🔄 Mode: {'APPEND' if self.append_mode else 'REPLACE'}")
        print()
        
        # Check if this source already exists
        existing_source = None
        for src in self.metadata.get("sources", []):
            if src.get("url") == source_url or src.get("name") == source_name:
                existing_source = src
                break
        
        if existing_source and self.append_mode:
            print(f"⚠️  Source '{source_name}' already indexed. Removing old version...")
            # Remove old chunks from this source
            try:
                results = self.collection.get(where={"source": source_url})
                if results['ids']:
                    self.collection.delete(ids=results['ids'])
                    print(f"  ✓ Removed {len(results['ids'])} old chunks")
            except Exception as e:
                print(f"  ⚠️  Could not remove old chunks: {e}")
        
        all_chunks = []
        all_metadatas = []
        all_ids = []
        
        # Generate unique prefix for this indexing session
        session_prefix = source_name.replace(".", "_").replace("-", "_")[:20]
        
        # First pass: collect all chunks
        print("📝 Creating chunks from all pages...")
        for page_idx, page in enumerate(pages):
            if page_idx % 10 == 0:
                print(f"  Processing page {page_idx + 1}/{total_pages}...")
            
            # Create chunks for this page
            chunks = self.chunk_text(
                text=page['content'],
                metadata={
                    "url": page['url'],
                    "title": page['title'],
                    "page_index": page_idx,
                    "source": source_url,
                    "source_name": source_name,
                    "word_count": page.get('wordCount', 0)
                }
            )
            
            # Collect chunks
            for chunk_idx, chunk in enumerate(chunks):
                chunk_id = f"{session_prefix}_page_{page_idx}_chunk_{chunk_idx}"
                
                all_chunks.append(chunk["text"])
                all_metadatas.append(chunk["metadata"])
                all_ids.append(chunk_id)
        
        print(f"✅ Created {len(all_chunks)} chunks from {total_pages} pages")
        
        # Second pass: create embeddings in batches (MUCH FASTER!)
        print(f"\n🚀 Creating embeddings in batches (this is much faster)...")
        all_embeddings = []
        batch_size = 100  # OpenAI supports up to 2048, but 100 is safer
        
        for i in range(0, len(all_chunks), batch_size):
            end_idx = min(i + batch_size, len(all_chunks))
            batch_texts = all_chunks[i:end_idx]
            
            # Create embeddings for this batch
            batch_embeddings = self.create_embeddings_batch(batch_texts)
            all_embeddings.extend(batch_embeddings)
            
            print(f"  ✓ Embedded {len(all_embeddings)}/{len(all_chunks)} chunks ({(len(all_embeddings)/len(all_chunks)*100):.1f}%)")
        
        # Store in ChromaDB
        print(f"\n💾 Storing {len(all_chunks)} chunks in ChromaDB...")
        
        # Add in batches
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
        
        # Update metadata
        new_source_info = {
            "name": source_name,
            "url": source_url,
            "pages": total_pages,
            "chunks": len(all_chunks),
            "words": data.get('total_words', 0),
            "indexed_at": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "file": docs_file
        }
        
        # Remove old source info if exists
        if existing_source:
            self.metadata["sources"] = [s for s in self.metadata.get("sources", []) 
                                        if s.get("url") != source_url and s.get("name") != source_name]
        
        # Add new source info
        self.metadata.setdefault("sources", []).append(new_source_info)
        
        # Update totals
        self.metadata["total_chunks"] = sum(s["chunks"] for s in self.metadata["sources"])
        self.metadata["total_words"] = sum(s["words"] for s in self.metadata["sources"])
        self.metadata["total_sources"] = len(self.metadata["sources"])
        
        self.save_metadata()
        print(f"📊 Metadata saved to {self.metadata_file}")
        
        # Show cost estimate
        total_tokens = sum(m['chunk_tokens'] for m in all_metadatas)
        cost_estimate = (total_tokens / 1000) * 0.00002
        print(f"\n💰 Estimated cost for this source: ${cost_estimate:.4f}")
        
        # Show total stats
        print(f"\n📚 Total Documentation Stats:")
        print(f"   Sources: {self.metadata['total_sources']}")
        print(f"   Total Chunks: {self.metadata['total_chunks']}")
        print(f"   Total Words: {self.metadata['total_words']:,}")
        print(f"\n   Indexed sources:")
        for src in self.metadata["sources"]:
            print(f"   • {src['name']} ({src['pages']} pages, {src['chunks']} chunks)")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Index documentation with support for multiple sources')
    parser.add_argument('docs_file', help='JSON file with crawled documentation')
    parser.add_argument('-n', '--name', help='Custom name for this documentation source')
    parser.add_argument('-r', '--replace', action='store_true', 
                       help='Replace all existing documentation (default: append)')
    
    args = parser.parse_args()
    
    indexer = MultiDocIndexer(append_mode=not args.replace)
    indexer.index_documents(args.docs_file, source_name=args.name)

