import { Job } from "bullmq";

export async function handleRemoveStudent(job: Job) {
    const { studentId, tutorId } = job.data;
    console.log(`Removing student ${studentId} from queue`);
    // Logic to remove student from Redis queue or internal tracking
  }