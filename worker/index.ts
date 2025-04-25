import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { io } from 'socket.io-client';  // To notify students via Socket.IO

dotenv.config();

const db = new PrismaClient();

console.log("Worker running...")

// Redis connection configuration
const redisConnection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  };

// Function to update tutor availability (e.g., after finishing a session)
async function updateTutorAvailability(tutorId: number, available: boolean) {
    try {
      await db.tutor.update({
        where: { id: tutorId },
        data: { available },
      });
      console.log(`Tutor ${tutorId} availability updated to ${available ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error updating tutor availability:', error);
    }
}

async function handleMatchStudent(job: Job) {
    const { studentId } = job.data;
    console.log(`Matching student ${studentId}`);
  
    // Find an available tutor
    const availableTutor = await db.tutor.findFirst({
      where: { available: true },
    });

    console.log(`After the query ${availableTutor}`);
  
    if (availableTutor) {
      // Tutor found, now update their availability
      await updateTutorAvailability(availableTutor.id, false); // Set tutor as unavailable
  
      // Match the student with the tutor (you can store the assignment or notify the student)
      console.log(`Student ${studentId} matched with tutor ${availableTutor.id}`);
      return {
        tutor: availableTutor,
        student: studentId,
      };
    } else {
      console.log(`No available tutor found for student ${studentId}`);
    }
  }
  
  async function handleRemoveStudent(job: Job) {
    const { studentId, tutorId } = job.data;
    console.log(`Removing student ${studentId} from queue`);
    // Logic to remove student from Redis queue or internal tracking
  }
  

new Worker('student-queue', async (job: Job) => {

        console.log("In the student queue");
      try {
        switch (job.name) {
          case 'match-student':
            return await handleMatchStudent(job);
            break;
          case 'remove-student':
            await handleRemoveStudent(job);
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



