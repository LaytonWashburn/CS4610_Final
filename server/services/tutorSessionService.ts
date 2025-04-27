import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

export class TutorSessionService {
    private static instance: TutorSessionService;
    private prisma: PrismaClient;
    private io: Server;

    private constructor(prisma: PrismaClient, io: Server) {
        this.prisma = prisma;
        this.io = io;
    }

    public static getInstance(prisma: PrismaClient, io: Server): TutorSessionService {
        if (!TutorSessionService.instance) {
            TutorSessionService.instance = new TutorSessionService(prisma, io);
        }
        return TutorSessionService.instance;
    }

    public async createSession(studentId: number, tutorId: number): Promise<void> {
        console.log("In the createSession");
        // try {
        //     // Create a new session
        //     const session = await this.prisma.session.create({
        //         data: {
        //             studentId,
        //             tutorId,
        //             status: 'ACTIVE'
        //         }
        //     });

        //     // Emit join signals for both tutor and student
        //     this.io.emit('tutor-join-session', { 
        //         sessionId: session.id, 
        //         tutorId: tutorId 
        //     });

        //     this.io.emit('student-join-session', { 
        //         sessionId: session.id, 
        //         studentId: studentId 
        //     });

        //     console.log(`Created session ${session.id} between student ${studentId} and tutor ${tutorId}`);
        // } catch (error) {
        //     console.error('Error creating session:', error);
        //     throw error;
        // }
    }

    public async deleteSession(sessionId: number): Promise<void> {
        try {
            await this.prisma.session.delete({
                where: { id: sessionId }
            });
            console.log(`Deleted session ${sessionId}`);
        } catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    }
}
