import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { addClient, removeClient } from '../lib/sse.js';

const router = express.Router();

router.get('/subscribe', protectRoute, (req, res) => {
  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const userId = String(req.user._id || req.user.id);
  addClient(userId, res);

  // Send an initial ping with current subscription state
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ userId })}\n\n`);

  req.on('close', () => {
    removeClient(userId, res);
  });
});

export default router;
