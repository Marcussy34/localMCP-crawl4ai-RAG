/**
 * API endpoint to search MCP documentation using OpenAI embeddings
 */
import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, maxResults = 5 } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (maxResults < 1 || maxResults > 20) {
    return res.status(400).json({ error: 'maxResults must be between 1 and 20' });
  }

  try {
    // Path to the search script
    const searchScriptPath = path.join(
      process.cwd(),
      'mcp-docs-server',
      'scripts',
      'search.py'
    );

    // Path to Python in venv
    const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3');

    // Create search script if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(searchScriptPath)) {
      return res.status(500).json({
        error: 'Search script not found',
        hint: 'The search.py script needs to be created'
      });
    }

    // Execute Python search script
    const result = await new Promise((resolve, reject) => {
      const process = spawn(pythonPath, [
        searchScriptPath,
        query,
        maxResults.toString()
      ]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Search failed: ${stderr}`));
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch (err) {
            reject(new Error('Failed to parse search results'));
          }
        }
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      details: error.message
    });
  }
}

