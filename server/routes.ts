import { Router } from 'express';
import { QueueController } from './controllers/queue_controller';
import { createSession } from './controllers/session_controller';
import { authenticateToken } from './middleware/auth';

const router = Router();

// Queue routes
router.post('/queue/join', authenticateToken, QueueController.joinQueue);
router.post('/queue/remove', authenticateToken, QueueController.removeFromQueue);
router.get('/queue/status', authenticateToken, QueueController.queueStatus);
router.get('/queue/entries', authenticateToken, QueueController.getUserQueueEntries);

// Session routes
router.post('/api/sessions/create', authenticateToken, createSession);

export default router; 