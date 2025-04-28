import { Server, Socket } from 'socket.io';
import { QueueService } from './queueService';
import { PrismaClient, Urgency, SessionStatus, QueueStatus } from '@prisma/client';

interface QueueEntry {
    id: number;
    studentId: number;
    subject: string;
    urgency: Urgency;
    description: string;
    estimatedTime: number;
    position: number;
    studentName: string;
}

interface MatchData {
    studentId: number;
    tutorId: number;
    sessionId: number;
    subject: string;
    urgency: Urgency;
    description: string;
    estimatedTime: number;
    studentName: string;
}

export class SocketService {
    private io: Server;
    private queueService: QueueService;
    private availableTutors: Map<number, Socket> = new Map();
    private waitingStudents: Map<number, Socket> = new Map();
    private matchedPairs: Map<number, MatchData> = new Map();
    private prisma: PrismaClient;

    constructor(io: Server, queueService: QueueService) {
        this.io = io;
        this.queueService = queueService;
        this.prisma = this.queueService.getPrismaClient();
        this.setupSocketHandlers();
    }

    private setupSocketHandlers() {
        this.io.on('connection', (socket: Socket) => {
            console.log('New client connected:', socket.id);

            // Handle session ending
            socket.on('end_session', async (data: { tutorId: number, chatRoomId: number }) => {
                try {
                    console.log('Starting session end process:', data);
                    const { tutorId, chatRoomId } = data;
                    
                    // Start a transaction for atomic updates
                    const result = await this.prisma.$transaction(async (prisma: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
                        // Find the session with all related data
                        const session = await prisma.session.findFirst({
                            where: { 
                                chatRoomId: chatRoomId,
                                OR: [
                                    { status: SessionStatus.ACTIVE },
                                    { status: SessionStatus.ENDED },
                                    { status: SessionStatus.CANCELLED }
                                ]
                            },
                            include: {
                                tutor: {
                                    select: {
                                        id: true,
                                        available: true
                                    }
                                }
                            }
                        });

                        if (!session) {
                            throw new Error('Session not found or in invalid state');
                        }

                        // Validate session state transition
                        if (session.status === SessionStatus.CANCELLED) {
                            throw new Error('Cannot end a cancelled session');
                        }

                        // Verify tutor is actually in this session
                        if (session.tutorId !== tutorId) {
                            throw new Error(`Tutor ${tutorId} not associated with session ${session.id}`);
                        }

                        // Check if session is already ended
                        if (session.status === SessionStatus.ENDED) {
                            return { session, alreadyEnded: true };
                        }

                        // Update session status
                        const updatedSession = await prisma.session.update({
                            where: { id: session.id },
                            data: { 
                                status: SessionStatus.ENDED,
                                endTime: new Date()
                            }
                        });

                        // Find and update the associated queue entry
                        const queueEntry = await prisma.queueEntry.findFirst({
                            where: {
                                studentId: session.studentId,
                                OR: [
                                    { status: QueueStatus.IN_PROGRESS },
                                    { status: QueueStatus.WAITING }
                                ]
                            }
                        });

                        if (queueEntry) {
                            await prisma.queueEntry.update({
                                where: { id: queueEntry.id },
                                data: { 
                                    status: QueueStatus.COMPLETED
                                }
                            });
                        }

                        // Update tutor availability
                        await prisma.tutor.update({
                            where: { id: tutorId },
                            data: { 
                                available: true
                            }
                        });

                        return { session: updatedSession, alreadyEnded: false };
                    }, {
                        timeout: 10000,
                        maxWait: 5000,
                        isolationLevel: 'Serializable'
                    });

                    const { session, alreadyEnded } = result;

                    if (alreadyEnded) {
                        console.log('Session already ended, handling cleanup only');
                        await this.handleSessionCleanup(session, tutorId, socket);
                        return;
                    }

                    // Handle cleanup and matching
                    await this.handleSessionCleanup(session, tutorId, socket);
                    this.matchNextPair();

                    console.log(`Session ${session.id} ended successfully, tutor ${tutorId} is now available`);
                } catch (error) {
                    console.error('Error ending session:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to end session';
                    socket.emit('session_ended', { 
                        success: false, 
                        error: errorMessage 
                    });
                }
            });

            // Handle tutor availability
            socket.on('tutor_available', (data: { tutorId: number, isAvailable: boolean }) => {
                try {
                    if (data.isAvailable) {
                        console.log(`Tutor ${data.tutorId} is now available`);
                        this.availableTutors.set(data.tutorId, socket);
                        this.matchNextPair();
                    } else {
                        console.log(`Tutor ${data.tutorId} is no longer available`);
                        this.availableTutors.delete(data.tutorId);
                    }
                } catch (error) {
                    console.error('Error handling tutor availability:', error);
                }
            });

            // Handle student joining queue
            socket.on('join_queue', async (data: { studentId: number }) => {
                try {
                    console.log(`Student ${data.studentId} joined the queue`);
                    this.waitingStudents.set(data.studentId, socket);
                    this.matchNextPair();
                } catch (error) {
                    console.error('Error handling student join queue:', error);
                }
            });

            // Handle tutor accepting student
            socket.on('tutor_assigned', async (data: MatchData) => {
                try {
                    console.log(`Tutor ${data.tutorId} accepted student ${data.studentId}`);
                    await this.handleMatch(data);
                } catch (error) {
                    console.error('Error handling tutor assignment:', error);
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                try {
                    console.log('Client disconnected:', socket.id);
                    // Remove from available tutors
                    for (const [tutorId, tutorSocket] of this.availableTutors.entries()) {
                        if (tutorSocket === socket) {
                            this.availableTutors.delete(tutorId);
                            console.log(`Tutor ${tutorId} removed from available tutors`);
                            // Update tutor availability in database
                            this.prisma.tutor.update({
                                where: { id: tutorId },
                                data: { available: false }
                            }).catch(error => {
                                console.error(`Error updating tutor ${tutorId} availability:`, error);
                            });
                        }
                    }
                    // Remove from waiting students
                    for (const [studentId, studentSocket] of this.waitingStudents.entries()) {
                        if (studentSocket === socket) {
                            this.waitingStudents.delete(studentId);
                            console.log(`Student ${studentId} removed from waiting students`);
                            // Update queue entry status
                            this.prisma.queueEntry.updateMany({
                                where: {
                                    studentId: studentId,
                                    status: QueueStatus.WAITING
                                },
                                data: {
                                    status: QueueStatus.CANCELLED
                                }
                            }).catch(error => {
                                console.error(`Error updating queue entries for student ${studentId}:`, error);
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error handling disconnection:', error);
                }
            });
        });
    }

    private async handleSessionCleanup(
        session: any, // TODO: Add proper type
        tutorId: number,
        socket: Socket
    ) {
        try {
            // Remove from matched pairs
            this.matchedPairs.delete(tutorId);
            console.log('Removed tutor from matched pairs:', tutorId);

            // Handle tutor cleanup with socket validation
            const tutorSocket = this.availableTutors.get(tutorId);
            if (tutorSocket?.connected) {
                console.log('Found existing tutor socket, sending session_ended');
                tutorSocket.emit('session_ended', { 
                    success: true,
                    navigateTo: '/tutor-queue'
                });
            } else {
                console.log(`Adding tutor ${tutorId} back to available tutors`);
                this.availableTutors.set(tutorId, socket);
                socket.emit('session_ended', { 
                    success: true,
                    navigateTo: '/tutor-queue'
                });
            }

            // Handle student cleanup with socket validation
            const studentId = session.studentId;
            const studentSocket = this.waitingStudents.get(studentId);
            if (studentSocket?.connected) {
                studentSocket.emit('session_ended', { 
                    success: true,
                    navigateTo: '/dashboard/queue'
                });
                this.waitingStudents.delete(studentId);
            }
        } catch (error) {
            console.error('Error in session cleanup:', error);
            throw error;
        }
    }

    private async matchNextPair() {
        try {
            console.log('Starting matchNextPair...');
            // Get all available tutors
            const availableTutors = Array.from(this.availableTutors.entries())
                .filter(([tutorId]) => !this.matchedPairs.has(tutorId));
            console.log('Available tutors:', availableTutors.map(([id]) => id));

            // If no tutors available, nothing to do
            if (availableTutors.length === 0) {
                console.log('No available tutors found');
                return;
            }

            // Get all waiting students in queue order
            const queueEntries = await this.queueService.getWaitingQueue();
            console.log('Full queue state:', {
                totalEntries: queueEntries?.length || 0,
                entries: queueEntries?.map(entry => ({
                    id: entry.id,
                    studentId: entry.studentId,
                    status: entry.status,
                    subject: entry.subject,
                    position: entry.position
                })) || []
            });

            if (!queueEntries || queueEntries.length === 0) {
                console.log('No students in queue');
                // No students in queue, notify tutors they're waiting
                for (const [tutorId, tutorSocket] of availableTutors) {
                    tutorSocket.emit('waiting_for_requests', { message: 'Waiting for student requests...' });
                }
                return;
            }

            // For each available tutor, try to match with the next student
            for (const [tutorId, tutorSocket] of availableTutors) {
                console.log(`Processing tutor ${tutorId}`);
                // Find next unmatched student
                const nextStudent = queueEntries.find(entry => 
                    entry.status === QueueStatus.WAITING &&
                    !Array.from(this.matchedPairs.values()).some(match => match.studentId === entry.studentId)
                );

                if (!nextStudent) {
                    console.log(`No unmatched students found for tutor ${tutorId}`);
                    tutorSocket.emit('waiting_for_requests', { message: 'Waiting for student requests...' });
                    continue;
                }

                const studentSocket = this.waitingStudents.get(nextStudent.studentId);
                if (!studentSocket) {
                    console.log(`Student ${nextStudent.studentId} not connected, skipping`);
                    continue;
                }

                console.log(`Matching tutor ${tutorId} with student ${nextStudent.studentId}`, {
                    studentDetails: {
                        id: nextStudent.id,
                        studentId: nextStudent.studentId,
                        subject: nextStudent.subject,
                        position: nextStudent.position
                    }
                });

                // Create the match data
                const matchData: MatchData = {
                    studentId: nextStudent.studentId,
                    tutorId: tutorId,
                    sessionId: 0, // Will be set when session is created
                    subject: nextStudent.subject || '',
                    urgency: nextStudent.urgency || Urgency.LOW,
                    description: nextStudent.description || '',
                    estimatedTime: nextStudent.estimatedTime || 0,
                    studentName: nextStudent.studentName || ''
                };

                // Store the match
                this.matchedPairs.set(tutorId, matchData);

                // Notify tutor
                tutorSocket.emit('student_assigned', matchData);
            }
        } catch (error) {
            console.error('Error in matchNextPair:', error);
        }
    }

    private async handleMatch(matchData: MatchData) {
        const { studentId, tutorId, subject, urgency, description, estimatedTime, studentName } = matchData;
        
        try {
            // Create chatroom first
            const chatRoom = await this.prisma.chatRoom.create({
                data: {
                    name: `Tutor Session - ${subject}`,
                    isPrivate: true
                }
            });

            // Create session
            const session = await this.prisma.session.create({
                data: {
                    studentId,
                    tutorId,
                    subject,
                    urgency,
                    description,
                    estimatedTime,
                    status: SessionStatus.ACTIVE,
                    chatRoomId: chatRoom.id,
                    name: `Tutor Session - ${subject} - ${new Date().toISOString()}`
                }
            });

            // Add both users to the chatroom
            await this.prisma.chatRoomParticipant.createMany({
                data: [
                    { userId: studentId, chatRoomId: chatRoom.id },
                    { userId: tutorId, chatRoomId: chatRoom.id }
                ]
            });

            // Update queue entry status
            await this.prisma.queueEntry.updateMany({
                where: {
                    studentId: studentId,
                    status: QueueStatus.WAITING
                },
                data: {
                    status: QueueStatus.IN_PROGRESS
                }
            });

            // Get sockets before removing from maps
            const studentSocket = this.waitingStudents.get(studentId);
            const tutorSocket = this.availableTutors.get(tutorId);

            // Update the match with session ID
            this.matchedPairs.set(tutorId, {
                ...matchData,
                sessionId: session.id
            });
            
            // Notify both parties
            if (studentSocket) {
                console.log(`Notifying student ${studentId} of match with tutor ${tutorId}`);
                studentSocket.emit('tutor_assigned', {
                    ...matchData,
                    sessionId: session.id,
                    chatRoomId: chatRoom.id
                });
            }
            if (tutorSocket) {
                console.log(`Notifying tutor ${tutorId} of match with student ${studentId}`);
                tutorSocket.emit('tutor_assigned', {
                    ...matchData,
                    sessionId: session.id,
                    chatRoomId: chatRoom.id
                });
            }

            // Remove from available tutors and waiting students after notifications
            this.availableTutors.delete(tutorId);
            this.waitingStudents.delete(studentId);
            console.log(`Match completed: Tutor ${tutorId} and Student ${studentId} in session ${session.id}`);
        } catch (error) {
            console.error('Error creating session and chatroom:', error);
            // Notify both parties of the error
            const studentSocket = this.waitingStudents.get(studentId);
            const tutorSocket = this.availableTutors.get(tutorId);
            
            if (studentSocket) {
                studentSocket.emit('match-error', { error: 'Failed to create session' });
            }
            if (tutorSocket) {
                tutorSocket.emit('match-error', { error: 'Failed to create session' });
            }
        }
    }

    public getWaitingStudentsCount(): number {
        return this.waitingStudents.size;
    }

    public getAvailableTutorsCount(): number {
        return this.availableTutors.size;
    }
}