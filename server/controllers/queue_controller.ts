import { EndpointBuilder, controller } from "./controller";
import { PrismaClient } from "@prisma/client";
import { QueueService } from '../services/queueService';

// Create a single instance of QueueService
let queueService: QueueService | null = null;

export const joinQueue: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId, subject, urgency, description, estimatedTime } = req.body;
  
  if (!studentId || !subject || !urgency || !description || !estimatedTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Initialize QueueService if it doesn't exist
    if (!queueService) {
      queueService = new QueueService();
    }

    const queueEntry = await queueService.joinQueue(
      studentId,
      subject,
      urgency,
      description,
      estimatedTime
    );
    res.status(201).json({ 
      message: 'Joined queue successfully',
      position: queueEntry.position,
      entry: queueEntry
    });
  } catch (error) {
    console.error('Error joining queue:', error);
    res.status(500).json({ error: 'Failed to join queue' });
  }
};

export const removeFromQueue: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  try {
    // Initialize QueueService if it doesn't exist
    if (!queueService) {
      queueService = new QueueService();
    }

    await queueService.removeFromQueue(studentId);
    res.status(200).json({ message: 'Left queue successfully' });
  } catch (error) {
    console.error('Error leaving queue:', error);
    res.status(500).json({ error: 'Failed to leave queue' });
  }
};

export const queueStatus: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId } = req.query;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  try {
    // Initialize QueueService if it doesn't exist
    if (!queueService) {
      queueService = new QueueService();
    }

    const position = await queueService.getQueuePosition(parseInt(studentId as string));
    res.json({ position });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
};

export const getUserQueueEntries: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId } = req.query;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  try {
    // Initialize QueueService if it doesn't exist
    if (!queueService) {
      queueService = new QueueService();
    }

    const entries = await queueService.getUserQueueEntries(parseInt(studentId as string));
    res.json({ entries });
  } catch (error) {
    console.error('Error getting queue entries:', error);
    res.status(500).json({ error: 'Failed to get queue entries' });
  }
};

export const testQueue: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  try {
    // Initialize QueueService if it doesn't exist
    if (!queueService) {
      queueService = new QueueService();
    }

    // Test student ID (you can change this to any valid student ID)
    const testStudentId = 1;

    // Step 1: Join the queue
    console.log('Step 1: Joining queue...');
    const queueEntry = await queueService.joinQueue(
      testStudentId,
      'Mathematics',
      'MEDIUM',
      'Test question',
      30
    );
    console.log('Joined queue successfully:', queueEntry);

    // Step 2: Get position
    console.log('Step 2: Getting position...');
    const position = await queueService.getQueuePosition(testStudentId);
    console.log('Current position:', position);

    // Step 3: Remove from queue
    console.log('Step 3: Removing from queue...');
    await queueService.removeFromQueue(testStudentId);
    console.log('Removed from queue successfully');

    res.status(200).json({
      message: 'Queue test completed successfully',
      steps: [
        { action: 'join', result: queueEntry },
        { action: 'getPosition', result: position },
        { action: 'remove', result: 'success' }
      ]
    });
  } catch (error) {
    console.error('Error in queue test:', error);
    res.status(500).json({ 
      error: 'Queue test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const QueueController = controller([
  { method: "post", path: "/join", builder: joinQueue },
  { method: "post", path: "/remove", builder: removeFromQueue },
  { method: "get", path: "/status", builder: queueStatus },
  { method: "get", path: "/entries", builder: getUserQueueEntries },
  { method: "get", path: "/test", builder: testQueue }
]);
