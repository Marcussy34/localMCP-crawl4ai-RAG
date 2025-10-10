/**
 * API endpoint to get MCP documentation index information
 */
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read metadata file
    const metadataPath = path.join(
      process.cwd(),
      'mcp-docs-server',
      'data',
      'chunks',
      'metadata.json'
    );

    // Check if file exists
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({
        error: 'Index not found. Please run the indexer first.',
        hint: 'Run: cd mcp-docs-server/scripts && python3 indexer.py moca_network_docs.json'
      });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Format response - support both single and multi-source formats
    const response = {
      // Multi-source format
      sources: metadata.sources || [],
      totalSources: metadata.total_sources || (metadata.sources ? metadata.sources.length : 1),
      
      // Single source backward compatibility
      source: metadata.source || (metadata.sources && metadata.sources.length > 0 ? metadata.sources[0].url : 'Unknown'),
      
      // Totals
      totalPages: metadata.total_pages || metadata.sources?.reduce((sum, s) => sum + s.pages, 0) || 0,
      totalChunks: metadata.total_chunks,
      totalWords: metadata.total_words,
      
      // Metadata
      indexedAt: metadata.indexed_at || metadata.last_updated,
      embeddingModel: metadata.embedding_model,
      chunkSize: metadata.chunk_size,
      chunkOverlap: metadata.chunk_overlap,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error loading index info:', error);
    res.status(500).json({
      error: 'Failed to load index information',
      details: error.message
    });
  }
}

