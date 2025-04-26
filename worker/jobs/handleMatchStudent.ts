import { PrismaClient } from "@prisma/client";
import { Job } from "bullmq";
import { updateTutorAvailability } from "./updateTutorAvailbility";

export async function handleMatchStudent(job: Job, db:PrismaClient) {
    const { studentId } = job.data;
    console.log(`Matching student ${studentId}`);
  
    // Find an available tutor
    const availableTutor = await db.tutor.findFirst({
      where: { available: true },
    });

    console.log(`After the query ${availableTutor}`);
  
    if (availableTutor) {
      // Tutor found, now update their availability
      await updateTutorAvailability(availableTutor.id, false, db); // Set tutor as unavailable
  
      // Match the student with the tutor (you can store the assignment or notify the student)
      console.log(`Student ${studentId} matched with tutor ${availableTutor.id}`);
      return {
        tutor: availableTutor,
        student: studentId,
        matched: true,
        queue: false,
      };
    } else {
      console.log(`No available tutor found for student ${studentId}`);
      return {
        tutor: null,
        student: studentId,
        matched: false,
        queue: true
      };
    }
  }