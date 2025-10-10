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
        print(f"📊 Total words: {data.get('total_words', 0):,}")
        print(f"⚙️  Chunk size: {self.chunk_size} tokens, overlap: {self.chunk_overlap}")
        print()
        
        all_chunks = []
        all_embeddings = []
        all_metadatas = []
        all_ids = []
        
        for page_idx, page in enumerate(pages):
            print(f"Processing page {page_idx + 1}/{total_pages}: {page['title'][:60]}...")
            
            # Create chunks for this page
            chunks = self.chunk_text(
                text=page['content'],
                metadata={
                    "url": page['url'],
                    "title": page['title'],
                    "page_index": page_idx,
                    "source": data.get("source", "unknown"),
                    "word_count": page.get('wordCount', 0)
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
                if len(all_chunks) % 10 == 0:
                    print(f"  ✓ Embedded {len(all_chunks)} chunks so far...")
        
        # Store in ChromaDB
        print(f"\n💾 Storing {len(all_chunks)} chunks in ChromaDB...")
        
        # Clear existing collection
        try:
            self.chroma_client.delete_collection("documentation")
            print("  🗑️  Cleared existing collection")
        except:
            pass
        
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
                "total_words": data.get('total_words', 0),
                "source": data.get("source"),
                "indexed_at": data.get("crawled_at"),
                "embedding_model": self.embedding_model,
                "chunk_size": self.chunk_size,
                "chunk_overlap": self.chunk_overlap
            }, f, indent=2)
        
        print(f"📊 Metadata saved to {metadata_file}")
        
        # Show cost estimate
        total_tokens = sum(m['chunk_tokens'] for m in all_metadatas)
        cost_estimate = (total_tokens / 1000) * 0.00002  # $0.00002 per 1K tokens
        print(f"\n💰 Estimated cost: ${cost_estimate:.4f}")

if __name__ == "__main__":
    indexer = DocIndexer()
    
    # Index the crawled documentation
    docs_file = sys.argv[1] if len(sys.argv) > 1 else "moca_network_docs.json"
    indexer.index_documents(docs_file)

