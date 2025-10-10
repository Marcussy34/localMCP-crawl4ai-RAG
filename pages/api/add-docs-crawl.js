/**
 * API endpoint to crawl new documentation
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, maxPages = 50, sourceName } = req.body;

  if (!url || !sourceName) {
    return res.status(400).json({ 
      error: 'URL and source name are required' 
    });
  }

  try {
    // Generate filename from source name
    const safeFileName = sourceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const filename = `${safeFileName}_docs.json`;

    // Path to crawler script
    const crawlerPath = path.join(
      process.cwd(),
      'mcp-docs-server',
      'scripts',
      'crawler.py'
    );

    // Path to Python in venv
    const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3');

    console.log(`Starting crawl: ${url} (max: ${maxPages || 'unlimited'} pages)`);

    // Execute crawler
    const result = await new Promise((resolve, reject) => {
      const args = [
        crawlerPath,
        url,
        '-m', maxPages.toString(),
        '-o', filename
      ];

      const crawlerProcess = spawn(pythonPath, args);

      let stdout = '';
      let stderr = '';

      crawlerProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output);
      });

      crawlerProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout (30 minutes for large crawls)
      const timeout = setTimeout(() => {
        crawlerProcess.kill();
        reject(new Error('Crawl timeout (30 minutes exceeded)'));
      }, 30 * 60 * 1000);

      crawlerProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code !== 0) {
          reject(new Error(`Crawler failed with code ${code}: ${stderr}`));
        } else {
          // Parse output to get stats
          const lines = stdout.split('\n');
          let totalPages = 0;
          let totalWords = 0;

          for (const line of lines) {
            // Match "✅ Crawled X pages" or "Successfully crawled X pages"
            if (line.includes('Crawled') && line.includes('pages')) {
              const match = line.match(/Crawled\s+(\d+)\s+pages/i);
              if (match) totalPages = parseInt(match[1]);
            }
            // Match "✅ Total words: X,XXX"
            if (line.includes('Total words:')) {
              const match = line.match(/Total words:\s+([\d,]+)/);
              if (match) totalWords = parseInt(match[1].replace(/,/g, ''));
            }
          }

          // Read the JSON file to get accurate stats
          const outputPath = path.join(
            process.cwd(),
            'mcp-docs-server',
            'data',
            'raw',
            filename
          );
          
          try {
            const fileData = fs.readFileSync(outputPath, 'utf8');
            const jsonData = JSON.parse(fileData);
            
            // Use file data if available, fallback to parsed stdout
            totalPages = jsonData.total_pages || totalPages;
            totalWords = jsonData.total_words || totalWords;
          } catch (fileError) {
            console.warn('Could not read output file, using parsed stdout:', fileError.message);
          }

          resolve({
            success: true,
            filename,
            totalPages,
            totalWords,
            url,
            sourceName
          });
        }
      });

      crawlerProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    res.status(200).json(result);

  } catch (error) {
    console.error('Crawl error:', error);
    res.status(500).json({
      error: 'Failed to crawl documentation',
      details: error.message
    });
  }
}

// Increase timeout for large crawls
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 300, // 5 minutes API timeout (Vercel limit)
};

