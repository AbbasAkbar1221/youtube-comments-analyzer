import express, { Router } from 'express';
import { analyzeVideoComments } from '../controllers/analysisController.js';

// Create a router instance
const router: Router = express.Router();

// Define route for analyzing YouTube video comments

router.post('/analyze', async (req, res) => {
    await analyzeVideoComments(req, res);
  });

// Export the router
export default router;

