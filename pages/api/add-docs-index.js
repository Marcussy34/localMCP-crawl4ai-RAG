/**
 * API endpoint to index crawled documentation
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, sourceName } = req.body;

  if (!filename || !sourceName) {
    return res.status(400).json({ 
      error: 'Filename and source name are required' 
    });
  }

  try {
    // Verify file exists
    const docsPath = path.join(
      process.cwd(),
      'mcp-docs-server',
      'data',
      'raw',
      filename
    );

    if (!fs.existsSync(docsPath)) {
      return res.status(404).json({
        error: 'Crawled documentation file not found',
        details: `File ${filename} does not exist`
      });
    }

    // Path to indexer script
    const indexerPath = path.join(
      process.cwd(),
      'mcp-docs-server',
      'scripts',
      'indexer_multi.py'
    );

    // Path to Python in venv
    const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3');

    console.log(`Starting indexing: ${filename} as "${sourceName}"`);

    // Execute indexer
    const result = await new Promise((resolve, reject) => {
      const args = [
        indexerPath,
        filename,
        '-n', sourceName
      ];

      const indexerProcess = spawn(pythonPath, args);

      let stdout = '';
      let stderr = '';

      indexerProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output);
      });

      indexerProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout (45 minutes for large indexes)
      const timeout = setTimeout(() => {
        indexerProcess.kill();
        reject(new Error('Indexing timeout (45 minutes exceeded)'));
      }, 45 * 60 * 1000);

      indexerProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code !== 0) {
          reject(new Error(`Indexer failed with code ${code}: ${stderr}`));
        } else {
          // Parse output to get stats
          const lines = stdout.split('\n');
          let chunksCreated = 0;
          let estimatedCost = 0;
          let totalSources = 0;
          let totalChunks = 0;
          let totalWords = 0;

          for (const line of lines) {
            if (line.includes('Successfully indexed')) {
              const match = line.match(/(\d+)\s+chunks/);
              if (match) chunksCreated = parseInt(match[1]);
            }
            if (line.includes('Estimated cost')) {
              const match = line.match(/\$(\d+\.\d+)/);
              if (match) estimatedCost = parseFloat(match[1]);
            }
            if (line.includes('Sources:')) {
              const match = line.match(/Sources:\s+(\d+)/);
              if (match) totalSources = parseInt(match[1]);
            }
            if (line.includes('Total Chunks:')) {
              const match = line.match(/Total Chunks:\s+([\d,]+)/);
              if (match) totalChunks = parseInt(match[1].replace(/,/g, ''));
            }
            if (line.includes('Total Words:')) {
              const match = line.match(/Total Words:\s+([\d,]+)/);
              if (match) totalWords = parseInt(match[1].replace(/,/g, ''));
            }
          }

          resolve({
            success: true,
            chunksCreated,
            estimatedCost,
            totalStats: {
              sources: totalSources,
              chunks: totalChunks,
              words: totalWords
            }
          });
        }
      });

      indexerProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    res.status(200).json(result);

  } catch (error) {
    console.error('Indexing error:', error);
    res.status(500).json({
      error: 'Failed to index documentation',
      details: error.message
    });
  }
}

// Increase timeout for large indexes
// Note: This config is for Vercel deployments. For local dev, the setTimeout handles timeout.
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 300, // 5 minutes API timeout (Vercel limit, ignored in local dev)
};

