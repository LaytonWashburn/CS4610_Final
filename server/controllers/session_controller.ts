import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSession = async (req: Request, res: Response) => {
    try {
        const { studentId, subject, urgency, description, estimatedTime } = req.body;
        const tutorId = req.user?.id; // Assuming user ID is attached by auth middleware

        if (!tutorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Create chatroom first
        const chatRoom = await prisma.chatRoom.create({
            data: {
                name: `Tutor Session - ${subject}`,
                isPrivate: true
            }
        });

        // Create session
        const session = await prisma.session.create({
            data: {
                studentId,
                tutorId,
                subject,
                urgency,
                description,
                estimatedTime,
                status: 'IN_PROGRESS',
                chatRoomId: chatRoom.id
            }
        });

        // Add both users to the chatroom
        await prisma.chatRoom.update({
            where: { id: chatRoom.id },
            data: {
                users: {
                    connect: [
                        { id: studentId },
                        { id: tutorId }
                    ]
                }
            }
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