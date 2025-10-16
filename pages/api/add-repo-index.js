import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repoPath, sourceName } = req.body;
  
  // Set up SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Prevent compression
  res.socket.setNoDelay(true);
  res.flushHeaders();

  // Helper to send SSE message
  const sendProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush(); // Force flush if available
  };

  // Validate inputs
  if (!repoPath || !sourceName) {
    sendProgress({ type: 'error', message: 'Missing required fields: repoPath and sourceName' });
    res.end();
    return;
  }

  // Check if repository path exists
  try {
    const stats = await fs.stat(repoPath);
    if (!stats.isDirectory()) {
      sendProgress({ type: 'error', message: 'Repository path is not a directory' });
      res.end();
      return;
    }
  } catch (err) {
    sendProgress({ type: 'error', message: `Repository path does not exist: ${repoPath}` });
    res.end();
    return;
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

  sendProgress({ type: 'start', message: 'Starting repository indexing...' });
  sendProgress({ type: 'info', message: `Repository: ${repoPath}` });
  sendProgress({ type: 'info', message: `Source name: ${sourceName}` });

  // Run the Python indexer script (no extensions = index all text files)
  return new Promise((resolve) => {
    const python = spawn(pythonPath, [
      scriptPath,
      repoPath,
      sourceName
    ], {
      env: { ...process.env, PYTHONUNBUFFERED: '1' } // Disable Python buffering
    });

    let stdout = '';
    let stderr = '';

    // Capture stdout and stream to browser
    python.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      // Stream each line to browser
      const lines = output.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        console.log('Sending progress:', line); // Debug log
        sendProgress({ type: 'progress', message: line });
      });
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
        sendProgress({ 
          type: 'error', 
          message: 'Indexing failed',
          details: stderr || stdout
        });
        res.end();
        resolve();
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
        
        // Send final result
        sendProgress({
          type: 'complete',
          data: {
            success: true,
            totalFiles,
            chunksCreated,
            totalLines,
            estimatedCost,
            totalStats,
            sourceName,
          }
        });
        
        res.end();
        resolve();
      } catch (err) {
        console.error('Error parsing results:', err);
        sendProgress({
          type: 'error',
          message: 'Failed to parse indexing results',
          details: err.message,
        });
        res.end();
        resolve();
      }
    });

    // Handle errors
    python.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      sendProgress({
        type: 'error',
        message: 'Failed to start indexing process',
        details: err.message,
      });
      res.end();
      resolve();
    });
  });
}

