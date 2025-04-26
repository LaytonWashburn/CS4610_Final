import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { io } from 'socket.io-client';  // To notify students via Socket.IO
import { updateTutorAvailability } from "./jobs/updateTutorAvailbility";
import { handleMatchStudent } from "./jobs/handleMatchStudent";
import { handleRemoveStudent } from "./jobs/handleRemoveStudent";

dotenv.config();

const db = new PrismaClient();

console.log("Worker running...")

// Redis connection configuration
const redisConnection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
};

new Worker('student-queue', async (job: Job) => {

        console.log("In the student queue");
      try {
        switch (job.name) {
          case 'match-student':
            console.log("In the match student from index.ts");
            const result = await handleMatchStudent(job, db);
            console.log(`Hello ${result?.student}`);
            console.log(`Hello ${result?.tutor}`);
            const studentId = result?.student;
            const availableTutor = result?.tutor;
            return result;
            break;
          case 'remove-student':
            return await handleRemoveStudent(job);
            break;
          default:
            console.warn(`Unhandled job type: ${job.name}`);
        }
      } catch (error) {
        console.error('Error handling job:', error);
      }
    },
    {
      connection: redisConnection
    }
  );



