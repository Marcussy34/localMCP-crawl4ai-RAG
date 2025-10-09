// API endpoint for Crawl4AI
// Connects the frontend to the Python Crawl4AI backend

import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, extractionType, jsCode, cssSelector, llmPrompt, headless, deepCrawl, crawlStrategy, maxPages, sessionId } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Start timing
    const startTime = Date.now();

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
      sessionId: sessionId || null
    });

    // Call Python backend
    const result = await new Promise((resolve, reject) => {
      const python = spawn(pythonPath, [scriptPath]);
      
      let stdoutData = '';
      let stderrData = '';

      // Collect stdout
      python.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      // Collect stderr
      python.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      // Handle process completion
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
        } else {
          try {
            const parsedResult = JSON.parse(stdoutData);
            resolve(parsedResult);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${e.message}`));
          }
        }
      });

      // Handle errors
      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Send input data to Python script
      python.stdin.write(inputData);
      python.stdin.end();
    });

    // Calculate timing
    const timing = Date.now() - startTime;

    // Add timing and config to result
    const response = {
      ...result,
      timing,
      config: {
        url,
        extractionType,
        headless,
        hasJsCode: !!jsCode,
        hasCssSelector: !!cssSelector,
        hasLlmPrompt: !!llmPrompt
      }
    };

    // Return successful response
    return res.status(200).json(response);

  } catch (error) {
    console.error("Crawl error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
}
