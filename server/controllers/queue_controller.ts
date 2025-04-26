import { EndpointBuilder, controller } from "./controller";
import { Queue, QueueEvents } from 'bullmq';
import { PrismaClient } from "@prisma/client";

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

  // Assuming studentQueue is your BullMQ queue instance
  const job = await studentQueue.add('match-student', { studentId });

  // Wait for the job to be processed and get the result
  const result = await job.waitUntilFinished(queueEvents); // ✨ MAGIC LINE

  console.log('Job result:', result);
  res.status(201).json({ message: `Student ${studentId} matched`, result });
  // const result = await studentQueue.add('match-student', { studentId });
  // console.log(`Here's the result from the match-student ${result?.student}`);
  // console.log(result);
  // res.status(201).json({ message: `Student ${studentId} added to the queue` });
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
  { method: "post", path: "/join", builder: joinQueue },
  { method: "post", path: "/remove", builder: removeFromQueue },
  { method: "get", path: "/status", builder: queueStatus }
]);
