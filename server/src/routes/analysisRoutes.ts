import express, { Router } from 'express';
import { analyzeVideoComments } from '../controllers/analysisController.js';

const router: Router = express.Router();

router.post('/analyze', async (req, res) => {
    await analyzeVideoComments(req, res);
  });

export default router;

