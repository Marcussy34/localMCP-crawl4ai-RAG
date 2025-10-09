// Endpoint to check crawl progress
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Read progress file
    const progressFile = path.join('/tmp', `crawl_progress_${sessionId}.json`);
    
    if (fs.existsSync(progressFile)) {
      const progressData = fs.readFileSync(progressFile, 'utf8');
      const progress = JSON.parse(progressData);
      res.status(200).json(progress);
    } else {
      res.status(200).json({ status: 'not_found' });
    }
  } catch (error) {
    console.error('Progress check error:', error);
    res.status(500).json({ error: error.message });
  }
}
