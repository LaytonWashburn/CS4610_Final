import { PrismaClient, QueueStatus, Urgency } from '@prisma/client';

interface QueueEntry {
    id: number;
    studentId: number;
    subject: string | null;
    urgency: Urgency;
    description: string | null;
    estimatedTime: number | null;
    status: QueueStatus;
    createdAt: Date;
    position: number | null;
    tutorId?: number | null;
    studentName?: string | null;
}

export class QueueService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    getPrismaClient(): PrismaClient {
        return this.prisma;
    }

    async joinQueue(
        studentId: number,
        subject: string,
        urgency: Urgency,
        description: string,
        estimatedTime: number
    ): Promise<QueueEntry> {
        // Get current queue length to determine position
        const queueLength = await this.prisma.queueEntry.count({
            where: { status: QueueStatus.WAITING }
        });

        const position = queueLength + 1;

        // Get student's name
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            select: { firstName: true, lastName: true }
        });

        let studentName: string | null = null;
        if (student) {
            studentName = `${student.firstName} ${student.lastName}`;
        }

        // Create new queue entry
        const entry = await this.prisma.queueEntry.create({
            data: {
                studentId,
                subject,
                urgency,
                description,
                estimatedTime,
                status: QueueStatus.WAITING,
                position,
                studentName
            }
        });

        return entry;
    }

    async getQueuePosition(studentId: number): Promise<QueueEntry | null> {
        const entry = await this.prisma.queueEntry.findFirst({
            where: {
                studentId,
                status: QueueStatus.WAITING
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return entry;
    }

    async removeFromQueue(studentId: number): Promise<void> {
        await this.prisma.queueEntry.updateMany({
            where: {
                studentId,
                status: QueueStatus.WAITING
            },
            data: {
                status: QueueStatus.CANCELLED
            }
        });

        // Recalculate positions for remaining entries
        await this.recalculatePositions();
    }

    async getUserQueueEntries(studentId: number): Promise<QueueEntry[]> {
        return await this.prisma.queueEntry.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getNextStudent(): Promise<QueueEntry | null> {
        return await this.prisma.queueEntry.findFirst({
            where: { status: QueueStatus.WAITING },
            orderBy: { position: 'asc' }
        });
    }

    async recalculatePositions(): Promise<void> {
        const waitingEntries = await this.prisma.queueEntry.findMany({
            where: { status: QueueStatus.WAITING },
            orderBy: { createdAt: 'asc' }
        });

        for (let i = 0; i < waitingEntries.length; i++) {
            await this.prisma.queueEntry.update({
                where: { id: waitingEntries[i].id },
                data: { position: i + 1 }
            });
        }
    }

    async assignTutor(studentId: number, tutorId: number): Promise<void> {
        // Update queue entry status to indicate tutor is assigned
        await this.prisma.queueEntry.updateMany({
            where: {
                studentId,
                status: QueueStatus.WAITING
            },
            data: {
                status: QueueStatus.IN_PROGRESS
            }
        });

        // Recalculate positions for remaining entries
        await this.recalculatePositions();
    }

    async completeSession(studentId: number): Promise<void> {
        await this.prisma.queueEntry.updateMany({
            where: {
                studentId,
                status: QueueStatus.IN_PROGRESS
            },
            data: {
                status: QueueStatus.COMPLETED
            }
        });

        // Update the session status
        await this.prisma.session.updateMany({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            data: {
                status: 'ENDED'
            }
        });
    }

    async getWaitingQueue(): Promise<QueueEntry[]> {
        return await this.prisma.queueEntry.findMany({
            where: { status: QueueStatus.WAITING },
            orderBy: { position: 'asc' }
        });
    }
} 