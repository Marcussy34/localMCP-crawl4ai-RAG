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
        return res.status(500).json({
          error: 'Failed to delete source',
          details: errorOutput || 'Unknown error',
        });
      }

      try {
        const result = JSON.parse(output);
        
        if (!result.success) {
          return res.status(400).json(result);
        }

        return res.status(200).json(result);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Output:', output);
        return res.status(500).json({
          error: 'Failed to parse deletion result',
          details: output,
        });
      }
    });
  } catch (error) {
    console.error('Error deleting source:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

