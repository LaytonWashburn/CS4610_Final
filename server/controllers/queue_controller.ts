import { EndpointBuilder, controller } from "./controller";
import { Queue } from 'bullmq';
import { PrismaClient } from "@prisma/client";

const studentQueue = new Queue('student-queue', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export const joinQueue: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'Student ID is required' });
  
  await studentQueue.add('match-student', { studentId });
  res.status(201).json({ message: `Student ${studentId} added to the queue` });
};

export const removeFromQueue: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { studentId, tutorId } = req.body;
  if (!studentId || !tutorId) {
    return res.status(400).json({ error: 'Student ID and Tutor ID are required' });
  }

  await studentQueue.add('remove-student', { studentId, tutorId });
  res.status(200).json({ message: `Student ${studentId} removed from the queue` });
};

export const queueStatus: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { waiting } = await studentQueue.getJobCounts();
  res.json({ queueLength: waiting });
};

export const QueueController = controller([
  { method: "post", path: "/queue/join", builder: joinQueue },
  { method: "post", path: "/queue/remove", builder: removeFromQueue },
  { method: "get", path: "/queue", builder: queueStatus }
]);
