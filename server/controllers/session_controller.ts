import { Request, Response } from 'express';
import { PrismaClient, SessionStatus, QueueStatus } from '@prisma/client';
import { controller, EndpointBuilder  } from './controller';

const prisma = new PrismaClient();

export const createSession: EndpointBuilder = (db: PrismaClient) => async (req: Request, res: Response) => {
    try {
        const { studentId, subject, urgency, description, estimatedTime } = req.body;
        const tutorId = req.user?.id; // Assuming user ID is attached by auth middleware

        if (!tutorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Create chatroom first
        const chatRoom = await db.chatRoom.create({
            data: {
                name: `Tutor Session - ${subject}`,
                isPrivate: true
            }
        });

        // Create session
        const session = await db.session.create({
            data: {
                name: `Tutor Session - ${subject} - ${new Date().toISOString()}`,
                studentId,
                tutorId,
                subject,
                urgency,
                description,
                estimatedTime,
                status: SessionStatus.ACTIVE,
                chatRoomId: chatRoom.id
            }
        });

        // Add both users to the chatroom
        await db.chatRoomParticipant.createMany({
            data: [
                { userId: studentId, chatRoomId: chatRoom.id },
                { userId: tutorId, chatRoomId: chatRoom.id }
            ]
        });

        res.json({
            sessionId: session.id,
            chatRoomId: chatRoom.id
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
}; 

export const endSessionByRoomId: EndpointBuilder = (db: PrismaClient) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Find the active session for this chat room
        const session = await db.session.findFirst({
            where: { 
                chatRoomId: parseInt(id),
                status: SessionStatus.ACTIVE
            },
            include: {
                tutor: true,
                student: true
            }
        });

        if (!session) {
            return res.status(404).json({ error: 'No active session found for this chat room' });
        }

        // Update the session status
        const updatedSession = await db.session.update({
            where: { id: session.id },
            data: { 
                status: status || SessionStatus.ENDED,
                endTime: new Date()
            }
        });

        // Update tutor's availability to true
        await db.tutor.update({
            where: { id: session.tutorId },
            data: { available: true }
        });

        // Find and update the associated queue entry
        const queueEntry = await db.queueEntry.findFirst({
            where: {
                studentId: session.studentId,
                status: QueueStatus.IN_PROGRESS
            }
        });

        if (queueEntry) {
            await db.queueEntry.update({
                where: { id: queueEntry.id },
                data: { status: QueueStatus.COMPLETED }
            });
        }

        res.json({ 
            message: 'Session ended successfully',
            session: updatedSession
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
};

export const SessionController = controller([
    { method: "patch", path: "/end/chat/:id", builder: endSessionByRoomId }
]);
