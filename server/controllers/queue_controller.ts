import { EndpointBuilder, controller } from "./controller";
import { Queue, QueueEvents } from 'bullmq';
import { PrismaClient } from "@prisma/client";
import { getIo } from '../socket/socketManager';

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

const studentQueue = new Queue('student-queue', {
  connection: redisConnection,
});

const queueEvents = new QueueEvents('student-queue', {
  connection: redisConnection,
});

export const joinQueue: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Student ID is required' });

  try {
    // Check if student is already in queue
    const activeJobs = await studentQueue.getJobs(['active', 'waiting']);
    const isInQueue = activeJobs.some(job => job.data.studentId === studentId);
    
    if (isInQueue) {
      return res.status(400).json({ error: 'Student is already in queue' });
    }

    // Find and delete any existing active session for this student
    const existingSession = await db.session.findFirst({
      where: {
        studentId: studentId,
        status: 'ACTIVE'
      }
    });

    if (existingSession) {
      await db.session.delete({
        where: { id: existingSession.id }
      });
    }

    // Add student to queue
    const job = await studentQueue.add('match-student', { studentId });
    
    // Get queue position
    const waitingJobs = await studentQueue.getJobs(['waiting']);
    const position = waitingJobs.findIndex(job => job.id === job.id) + 1;

    // Find an available tutor
    const availableTutor = await db.tutor.findFirst({
      where: {
        online: true
      }
    });

    if (!availableTutor) {
      return res.status(400).json({ error: 'No available tutors' });
    }

    console.log('Available tutor found');
    const io = getIo();

    // Create a chat room for the student
    const session = await db.session.create({
      data: {
        name: `Student ${studentId} Chat Room`,
        studentId: studentId,
        tutorId: availableTutor?.tutorId,
        status: 'ACTIVE'
      }
    });

    io.emit('test', {
      message: 'Hello from the server'
    });
  
    // Emit tutor-session-request event using tutorId (which is the user's ID)
    io.to(`tutor-${availableTutor.tutorId}`).emit('tutor-session-request', {
      studentId,
      tutorId: availableTutor.id,
      chatRoomId: session.id
    });

    res.status(201).json({ 
      message: `Student ${studentId} added to queue`,
      result: {
        queuePosition: position,
        chatRoomId: session.id
      }
    });
  } catch (error) {
    console.error('Error in joinQueue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeFromQueue: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId, tutorId } = req.body;
  if (!studentId || !tutorId) {
    return res.status(400).json({ error: 'Student ID and Tutor ID are required' });
  }

  try {
    await studentQueue.add('remove-student', { studentId, tutorId });
    res.status(200).json({ message: `Student ${studentId} removed from the queue` });
  } catch (error) {
    console.error('Error in removeFromQueue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const queueStatus: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  try {
    const { waiting } = await studentQueue.getJobCounts();
    const activeJobs = await studentQueue.getJobs(['waiting']);
    
    res.json({ 
      queueLength: waiting,
      positions: activeJobs.map(job => job.data.studentId)
    });
  } catch (error) {
    console.error('Error in queueStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const QueueController = controller([
  { method: "post", path: "/join", builder: joinQueue },
  { method: "post", path: "/remove", builder: removeFromQueue },
  { method: "get", path: "/status", builder: queueStatus }
]);
