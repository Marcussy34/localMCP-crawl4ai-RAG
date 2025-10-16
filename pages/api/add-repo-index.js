import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repoPath, sourceName } = req.body;

  // Validate inputs
  if (!repoPath || !sourceName) {
    return res.status(400).json({ 
      error: 'Missing required fields: repoPath and sourceName' 
    });
  }

  // Check if repository path exists
  try {
    const stats = await fs.stat(repoPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ 
        error: 'Repository path is not a directory' 
      });
    }
  } catch (err) {
    return res.status(400).json({ 
      error: `Repository path does not exist: ${repoPath}` 
    });
  }

  // Get the Python script path
  const scriptPath = path.join(
    process.cwd(),
    'mcp-docs-server',
    'scripts',
    'repo_indexer.py'
  );

  // Get the venv Python path
  const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python');

  console.log('Starting repository indexing...');
  console.log('Repository:', repoPath);
  console.log('Source name:', sourceName);
  console.log('Mode: Index all text files');

  // Run the Python indexer script (no extensions = index all text files)
  return new Promise((resolve) => {
    const python = spawn(pythonPath, [
      scriptPath,
      repoPath,
      sourceName
    ]);

    let stdout = '';
    let stderr = '';

    // Capture stdout
    python.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output);
    });

    // Capture stderr
    python.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output);
    });

    // Handle completion
    python.on('close', async (code) => {
      if (code !== 0) {
        console.error('Indexing failed with code', code);
        console.error('stderr:', stderr);
        resolve(
          res.status(500).json({
            error: 'Indexing failed',
            details: stderr || stdout,
          })
        );
        return;
      }

      // Parse results from stdout
      try {
        // Extract statistics from the output
        const filesMatch = stdout.match(/Found (\d+) files/);
        const chunksMatch = stdout.match(/Successfully indexed (\d+) chunks/);
        const linesMatch = stdout.match(/Total lines: ([\d,]+)/);
        const costMatch = stdout.match(/Estimated cost: \$([\d.]+)/);

        const totalFiles = filesMatch ? parseInt(filesMatch[1]) : 0;
        const chunksCreated = chunksMatch ? parseInt(chunksMatch[1]) : 0;
        const totalLines = linesMatch ? parseInt(linesMatch[1].replace(/,/g, '')) : 0;
        const estimatedCost = costMatch ? parseFloat(costMatch[1]) : 0;

        // Read metadata to get total stats
        const metadataPath = path.join(
          process.cwd(),
          'mcp-docs-server',
          'data',
          'chunks',
          'metadata.json'
        );

        let totalStats = null;
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          if (metadata.sources) {
            const totalSources = metadata.sources.length;
            const totalChunks = metadata.sources.reduce((sum, s) => sum + (s.total_chunks || 0), 0);
            
            totalStats = {
              sources: totalSources,
              chunks: totalChunks,
            };
          }
        } catch (err) {
          console.warn('Could not read metadata:', err);
        }

        console.log('Indexing complete!');
        resolve(
          res.status(200).json({
            success: true,
            totalFiles,
            chunksCreated,
            totalLines,
            estimatedCost,
            totalStats,
            sourceName,
          })
        );
      } catch (err) {
        console.error('Error parsing results:', err);
        resolve(
          res.status(500).json({
            error: 'Failed to parse indexing results',
            details: err.message,
          })
        );
      }
    });

    // Handle errors
    python.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      resolve(
        res.status(500).json({
          error: 'Failed to start indexing process',
          details: err.message,
        })
      );
    });
  });
}

