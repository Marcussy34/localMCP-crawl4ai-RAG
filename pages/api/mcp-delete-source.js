import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sourceName } = req.body;

  if (!sourceName) {
    return res.status(400).json({ error: 'Source name is required' });
  }

  try {
    // Path to Python script and venv
    const scriptPath = path.join(
      process.cwd(),
      'mcp-docs-server',
      'scripts',
      'delete_source.py'
    );
    const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3');

    // Wrap in Promise to handle async process properly
    const result = await new Promise((resolve, reject) => {
      // Execute Python deletion script
      const pythonProcess = spawn(pythonPath, [scriptPath, sourceName]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python error:', errorOutput);
          reject({
            status: 500,
            error: 'Failed to delete source',
            details: errorOutput || 'Unknown error',
          });
          return;
        }

        try {
          const parsedResult = JSON.parse(output);
          resolve(parsedResult);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          console.error('Output:', output);
          reject({
            status: 500,
            error: 'Failed to parse deletion result',
            details: output,
          });
        }
      });

      pythonProcess.on('error', (err) => {
        reject({
          status: 500,
          error: 'Failed to spawn Python process',
          details: err.message,
        });
      });
    });

    // Check if deletion was successful
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting source:', error);
    
    // Handle both Error objects and our custom error objects
    if (error.status) {
      return res.status(error.status).json({
        error: error.error,
        details: error.details,
      });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

