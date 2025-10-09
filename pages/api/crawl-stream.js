// Streaming API endpoint for real-time crawl progress
import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, extractionType, jsCode, cssSelector, llmPrompt, headless, deepCrawl, crawlStrategy, maxPages } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Path to Python script and venv
    const projectRoot = process.cwd();
    const pythonPath = path.join(projectRoot, 'venv', 'bin', 'python3');
    const scriptPath = path.join(projectRoot, 'crawl_backend.py');

    // Prepare input data for Python script
    const inputData = JSON.stringify({
      url,
      extractionType,
      jsCode,
      cssSelector,
      llmPrompt,
      headless,
      deepCrawl,
      crawlStrategy,
      maxPages,
      streamProgress: true  // Enable progress streaming
    });

    // Call Python backend
    const python = spawn(pythonPath, [scriptPath]);
    
    let stdoutData = '';
    let stderrData = '';

    // Send progress updates from stderr (where progress logs go)
    python.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim().startsWith('PROGRESS:')) {
          try {
            // Parse progress line (already JSON)
            const progressData = line.replace('PROGRESS:', '').trim();
            // Re-stringify to ensure it's properly escaped for SSE
            const progressObj = JSON.parse(progressData);
            res.write(`data: ${JSON.stringify(progressObj)}\n\n`);
          } catch (e) {
            // Skip malformed progress lines
            console.error('Failed to parse progress:', e.message);
          }
        }
      });
      stderrData += data.toString();
    });

    // Collect stdout for final result
    python.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    // Handle process completion
    python.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = JSON.stringify({ 
          error: `Process exited with code ${code}`,
          details: stderrData.slice(-500) // Last 500 chars of error
        });
        res.write(`data: ${errorMsg}\n\n`);
      } else {
        try {
          // Parse the result
          const result = JSON.parse(stdoutData);
          
          // For large results, send a summary instead of full content
          if (result.deepCrawl && result.pages) {
            // Send metadata first
            const summary = {
              success: result.success,
              deepCrawl: result.deepCrawl,
              totalPages: result.totalPages,
              totalWords: result.totalWords,
              status: result.status,
              done: true,
              hasPages: true
            };
            res.write(`data: ${JSON.stringify(summary)}\n\n`);
            
            // Store full result in response (client will fetch it)
            // For now, we'll just send the summary and client shows results
          } else {
            // Single page result - send directly
            res.write(`data: ${JSON.stringify({ ...result, done: true })}\n\n`);
          }
        } catch (e) {
          console.error('Parse error:', e);
          const errorMsg = JSON.stringify({ 
            error: `Failed to parse result: ${e.message}`,
            position: e.message.match(/position (\d+)/)?.[1]
          });
          res.write(`data: ${errorMsg}\n\n`);
        }
      }
      res.end();
    });

    // Handle errors
    python.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ error: `Failed to start process: ${error.message}` })}\n\n`);
      res.end();
    });

    // Send input data to Python script
    python.stdin.write(inputData);
    python.stdin.end();

  } catch (error) {
    console.error("Crawl error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

