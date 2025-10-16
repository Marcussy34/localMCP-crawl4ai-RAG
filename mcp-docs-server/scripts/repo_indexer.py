#!/usr/bin/env python3
"""
Repository indexer - Index local code files with OpenAI embeddings and ChromaDB
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

class RepoIndexer:
    def __init__(self):
        """Initialize the repository indexer"""
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
        
        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="documentation",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Tokenizer for chunking
        self.tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
    
    def read_file_safely(self, file_path: Path) -> str:
        """Read file content, skipping binary files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except (UnicodeDecodeError, PermissionError):
            # Skip binary files or files without read permission
            return None
    
    def should_ignore_path(self, path: Path, repo_root: Path) -> bool:
        """Check if path should be ignored"""
        # Common directories to ignore
        ignore_dirs = {
            'node_modules', '.git', '__pycache__', 'venv', 'env',
            'dist', 'build', '.next', '.vscode', '.idea', 'coverage',
            '.pytest_cache', '.mypy_cache', 'vendor', 'target'
        }
        
        # Check if any parent directory is in ignore list
        rel_path = path.relative_to(repo_root)
        for part in rel_path.parts:
            if part in ignore_dirs or part.startswith('.'):
                return True
        
        return False
    
    def collect_files(self, repo_path: str, file_extensions: List[str] = None) -> List[Dict]:
        """Collect all text files from repository"""
        repo_root = Path(repo_path).resolve()
        
        if not repo_root.exists():
            raise FileNotFoundError(f"Repository path does not exist: {repo_path}")
        
        if not repo_root.is_dir():
            raise NotADirectoryError(f"Path is not a directory: {repo_path}")
        
        print(f"📁 Scanning repository: {repo_root}")
        if file_extensions:
            print(f"🔍 Looking for files with extensions: {', '.join(file_extensions)}")
        else:
            print(f"🔍 Indexing all text files (binary files will be skipped)")
        print()
        
        files_data = []
        
        # Walk through all files
        for file_path in repo_root.rglob('*'):
            # Skip if it's a directory
            if file_path.is_dir():
                continue
            
            # Skip if path should be ignored
            if self.should_ignore_path(file_path, repo_root):
                continue
            
            # Check if file extension matches (if extensions specified)
            if file_extensions and file_path.suffix not in file_extensions:
                continue
            
            # Read file content (will skip binary files automatically)
            content = self.read_file_safely(file_path)
            if content is None:
                continue
            
            # Skip empty files
            if not content.strip():
                continue
            
            # Get relative path from repo root
            rel_path = file_path.relative_to(repo_root)
            
            # Count lines
            lines = content.count('\n') + 1
            
            files_data.append({
                'path': str(rel_path),
                'full_path': str(file_path),
                'content': content,
                'lines': lines,
                'extension': file_path.suffix
            })
            
            print(f"  ✓ {rel_path} ({lines} lines)")
        
        print(f"\n📊 Found {len(files_data)} text files")
        return files_data
    
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
    
    def index_repository(self, repo_path: str, source_name: str, file_extensions: List[str] = None):
        """Index repository files"""
        
        # Collect files
        files = self.collect_files(repo_path, file_extensions or [])
        
        if not files:
            raise ValueError("No files found to index")
        
        total_files = len(files)
        total_lines = sum(f['lines'] for f in files)
        
        print(f"\n📄 Indexing {total_files} files...")
        print(f"📊 Total lines: {total_lines:,}")
        print(f"⚙️  Chunk size: {self.chunk_size} tokens, overlap: {self.chunk_overlap}")
        print()
        
        all_chunks = []
        all_embeddings = []
        all_metadatas = []
        all_ids = []
        
        # Get existing sources to generate unique IDs
        existing_data = self.collection.get()
        existing_sources = set()
        if existing_data and existing_data['metadatas']:
            existing_sources = {m.get('source') for m in existing_data['metadatas']}
        
        # Check if source already exists
        if source_name in existing_sources:
            print(f"⚠️  Source '{source_name}' already exists. Removing old data...")
            # Delete old chunks for this source
            old_ids = [
                existing_data['ids'][i] 
                for i, m in enumerate(existing_data['metadatas']) 
                if m.get('source') == source_name
            ]
            if old_ids:
                self.collection.delete(ids=old_ids)
                print(f"🗑️  Removed {len(old_ids)} old chunks")
        
        # Process each file
        for file_idx, file_data in enumerate(files):
            print(f"Processing file {file_idx + 1}/{total_files}: {file_data['path']}...")
            
            # Create chunks for this file
            chunks = self.chunk_text(
                text=file_data['content'],
                metadata={
                    "file_path": file_data['path'],
                    "full_path": file_data['full_path'],
                    "file_extension": file_data['extension'],
                    "file_index": file_idx,
                    "source": source_name,
                    "source_type": "repository",
                    "lines": file_data['lines']
                }
            )
            
            # Create embeddings for each chunk
            for chunk_idx, chunk in enumerate(chunks):
                chunk_id = f"{source_name}_file_{file_idx}_chunk_{chunk_idx}"
                
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
        
        print(f"\n✅ Successfully indexed {len(all_chunks)} chunks from {total_files} files!")
        
        # Update metadata file
        metadata_file = Path(__file__).parent.parent / "data" / "chunks" / "metadata.json"
        metadata_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing metadata or create new
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                all_metadata = json.load(f)
        else:
            all_metadata = {"sources": []}
        
        # Update or add this source
        source_meta = {
            "name": source_name,
            "type": "repository",
            "total_files": total_files,
            "total_chunks": len(all_chunks),
            "total_lines": total_lines,
            "repo_path": repo_path,
            "file_extensions": file_extensions,
            "indexed_at": None,  # Will be set by API
            "embedding_model": self.embedding_model,
            "chunk_size": self.chunk_size,
            "chunk_overlap": self.chunk_overlap
        }
        
        # Find and update or append
        found = False
        for i, src in enumerate(all_metadata.get("sources", [])):
            if src.get("name") == source_name:
                all_metadata["sources"][i] = source_meta
                found = True
                break
        
        if not found:
            if "sources" not in all_metadata:
                all_metadata["sources"] = []
            all_metadata["sources"].append(source_meta)
        
        with open(metadata_file, 'w') as f:
            json.dump(all_metadata, f, indent=2)
        
        print(f"📊 Metadata saved to {metadata_file}")
        
        # Show cost estimate
        total_tokens = sum(m['chunk_tokens'] for m in all_metadatas)
        cost_estimate = (total_tokens / 1000) * 0.00002  # $0.00002 per 1K tokens
        print(f"\n💰 Estimated cost: ${cost_estimate:.4f}")
        
        return {
            "totalFiles": total_files,
            "chunksCreated": len(all_chunks),
            "totalLines": total_lines,
            "estimatedCost": cost_estimate
        }

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Index a local repository for MCP')
    parser.add_argument('repo_path', help='Path to repository')
    parser.add_argument('source_name', help='Source name for this repository')
    parser.add_argument('-e', '--extensions', default=None,
                       help='Comma-separated file extensions (default: all text files)')
    
    args = parser.parse_args()
    
    # Parse extensions if provided
    extensions = None
    if args.extensions:
        extensions = [ext.strip() for ext in args.extensions.split(',')]
    
    indexer = RepoIndexer()
    result = indexer.index_repository(
        repo_path=args.repo_path,
        source_name=args.source_name,
        file_extensions=extensions
    )
    
    print(f"\n✅ Done! Indexed {result['totalFiles']} files into {result['chunksCreated']} chunks")

if __name__ == "__main__":
    main()

