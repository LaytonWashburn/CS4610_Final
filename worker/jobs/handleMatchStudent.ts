import { PrismaClient } from "@prisma/client";
import { Job } from "bullmq";
import { updateTutorAvailability } from "./updateTutorAvailbility";

interface MatchResult {
    tutor: {
        id: number;
        user: {
            firstName: string;
            lastName: string;
        };
    } | null;
    student: number;
    matched: boolean;
    queue: boolean;
    queuePosition?: number;
}

export async function handleMatchStudent(job: Job, db: PrismaClient, queue: any): Promise<MatchResult> {
    const { studentId } = job.data;
  
    // Find an available tutor
    const availableTutor = await db.tutor.findFirst({
        where: { available: true },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    });
  
    if (availableTutor) {
        // Tutor found, now update their availability
        await updateTutorAvailability(availableTutor.id, false, db);
  
        return {
            tutor: {
                id: availableTutor.id,
                user: {
                    firstName: availableTutor.user.firstName,
                    lastName: availableTutor.user.lastName
                }
            },
            student: studentId,
            matched: true,
            queue: false
        };
    } else {
        // Get queue position
        const waitingJobs = await queue.getJobs(['waiting']);
        const position = waitingJobs.findIndex((j: Job) => j.id === job.id) + 1;

        return {
            tutor: null,
            student: studentId,
            matched: false,
            queue: true,
            queuePosition: position
        };
    }
}