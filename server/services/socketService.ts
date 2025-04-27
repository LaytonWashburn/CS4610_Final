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
    private matchedPairs: Map<number, MatchData> = new Map(); // Track matched pairs
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
                    const { tutorId, chatRoomId } = data;
                    
                    // Find the session by chat room ID
                    const session = await this.prisma.session.findFirst({
                        where: { chatRoomId: chatRoomId }
                    });

                    if (!session) {
                        throw new Error('Session not found');
                    }

                    // Update session status
                    await this.prisma.session.update({
                        where: { id: session.id },
                        data: { 
                            status: SessionStatus.ENDED,
                            endTime: new Date()
                        }
                    });

                    // Update queue entry status to COMPLETED
                    await this.prisma.queueEntry.updateMany({
                        where: { 
                            studentId: session.studentId,
                            status: QueueStatus.IN_PROGRESS
                        },
                        data: { 
                            status: QueueStatus.COMPLETED
                        }
                    });

                    // Update tutor availability
                    await this.prisma.tutor.update({
                        where: { id: tutorId },
                        data: { available: true }
                    });

                    // Remove from matched pairs
                    this.matchedPairs.delete(tutorId);

                    // Get tutor socket and notify
                    const tutorSocket = this.availableTutors.get(tutorId);
                    if (tutorSocket) {
                        tutorSocket.emit('session_ended', { 
                            success: true,
                            navigateTo: '/tutor-queue'
                        });
                        // Try to match with next student
                        this.matchNextPair();
                    } else {
                        // If tutor socket not found, add it back to available tutors
                        console.log(`Adding tutor ${tutorId} back to available tutors`);
                        this.availableTutors.set(tutorId, socket);
                        socket.emit('session_ended', { 
                            success: true,
                            navigateTo: '/tutor-queue'
                        });
                        this.matchNextPair();
                    }

                    // Find and remove student from waiting students
                    const studentId = session.studentId;
                    const studentSocket = this.waitingStudents.get(studentId);
                    if (studentSocket) {
                        studentSocket.emit('session_ended', { 
                            success: true,
                            navigateTo: '/dashboard/queue'
                        });
                        this.waitingStudents.delete(studentId);
                    }

                    console.log(`Session ${session.id} ended and tutor ${tutorId} is now available`);
                } catch (error) {
                    console.error('Error ending session:', error);
                    socket.emit('session_ended', { success: false, error: 'Failed to end session' });
                }
            });

            // Handle tutor availability
            socket.on('tutor_available', (data: { tutorId: number, isAvailable: boolean }) => {
                if (data.isAvailable) {
                    console.log(`Tutor ${data.tutorId} is now available`);
                    this.availableTutors.set(data.tutorId, socket);
                    this.matchNextPair();
                } else {
                    console.log(`Tutor ${data.tutorId} is no longer available`);
                    this.availableTutors.delete(data.tutorId);
                }
            });

            // Handle student joining queue
            socket.on('join_queue', (data: { studentId: number }) => {
                console.log(`Student ${data.studentId} joined the queue`);
                this.waitingStudents.set(data.studentId, socket);
                this.matchNextPair();
            });

            // Handle tutor accepting student
            socket.on('tutor_assigned', (data: MatchData) => {
                console.log(`Tutor ${data.tutorId} accepted student ${data.studentId}`);
                this.handleMatch(data);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                // Remove from available tutors
                for (const [tutorId, tutorSocket] of this.availableTutors.entries()) {
                    if (tutorSocket === socket) {
                        this.availableTutors.delete(tutorId);
                        console.log(`Tutor ${tutorId} removed from available tutors`);
                    }
                }
                // Remove from waiting students
                for (const [studentId, studentSocket] of this.waitingStudents.entries()) {
                    if (studentSocket === socket) {
                        this.waitingStudents.delete(studentId);
                        console.log(`Student ${studentId} removed from waiting students`);
                    }
                }
            });
        });
    }

    private async matchNextPair() {
        try {
            // Get all available tutors
            const availableTutors = Array.from(this.availableTutors.entries())
                .filter(([tutorId]) => !this.matchedPairs.has(tutorId));

            // If no tutors available, nothing to do
            if (availableTutors.length === 0) return;

            // Get all waiting students in queue order
            const queueEntries = await this.queueService.getWaitingQueue();
            if (!queueEntries || queueEntries.length === 0) {
                // No students in queue, notify tutors they're waiting
                for (const [tutorId, tutorSocket] of availableTutors) {
                    tutorSocket.emit('waiting_for_requests', { message: 'Waiting for student requests...' });
                }
                return;
            }

            // For each available tutor, try to match with the next student
            for (const [tutorId, tutorSocket] of availableTutors) {
                // Find next unmatched student
                const nextStudent = queueEntries.find(entry => 
                    !Array.from(this.matchedPairs.values()).some(match => match.studentId === entry.studentId)
                );

                if (!nextStudent) {
                    // No more students to match, notify tutor they're waiting
                    tutorSocket.emit('waiting_for_requests', { message: 'Waiting for student requests...' });
                    continue;
                }

                const studentSocket = this.waitingStudents.get(nextStudent.studentId);
                if (!studentSocket) continue; // Student not connected, try next

                console.log(`Matching tutor ${tutorId} with student ${nextStudent.studentId}`);
                
                // Update queue entry status
                await this.prisma.queueEntry.update({
                    where: { id: nextStudent.id },
                    data: { 
                        status: QueueStatus.IN_PROGRESS
                    }
                });

                // Notify tutor
                tutorSocket.emit('student_assigned', {
                    studentId: nextStudent.studentId,
                    subject: nextStudent.subject || '',
                    urgency: nextStudent.urgency || '',
                    description: nextStudent.description || '',
                    estimatedTime: nextStudent.estimatedTime || 0,
                    studentName: nextStudent.studentName || ''
                });
            }
        } catch (error) {
            console.error('Error matching next pair:', error);
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

            // Get sockets before removing from maps
            const studentSocket = this.waitingStudents.get(studentId);
            const tutorSocket = this.availableTutors.get(tutorId);

            // Store the match
            this.matchedPairs.set(tutorId, {
                studentId: studentId,
                tutorId: tutorId,
                sessionId: session.id,
                subject: subject || '',
                urgency: urgency || Urgency.LOW,
                description: description || '',
                estimatedTime: estimatedTime || 0,
                studentName: studentName || ''
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