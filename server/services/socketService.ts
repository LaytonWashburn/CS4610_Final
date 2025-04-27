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

                    // Update tutor availability
                    await this.prisma.tutor.update({
                        where: { id: tutorId },
                        data: { available: true }
                    });

                    // Remove from matched pairs
                    this.matchedPairs.delete(tutorId);

                    // Notify tutor they can accept new students
                    const tutorSocket = this.availableTutors.get(tutorId);
                    if (tutorSocket) {
                        tutorSocket.emit('session_ended', { success: true });
                        // Try to match tutor with next student
                        this.tryMatchTutorWithStudent(tutorId);
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
                    this.tryMatchTutorWithStudent(data.tutorId);
                } else {
                    console.log(`Tutor ${data.tutorId} is no longer available`);
                    this.availableTutors.delete(data.tutorId);
                }
            });

            // Handle student joining queue
            socket.on('join_queue', (data: { studentId: number }) => {
                console.log(`Student ${data.studentId} joined the queue`);
                this.waitingStudents.set(data.studentId, socket);
                this.tryMatchStudentWithTutor(data.studentId);
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

    private async tryMatchTutorWithStudent(tutorId: number) {
        // Skip if tutor is already matched
        if (this.matchedPairs.has(tutorId)) return;

        try {
            const nextStudent = await this.queueService.getNextStudent();
            if (nextStudent) {
                const studentSocket = this.waitingStudents.get(nextStudent.studentId);
                if (studentSocket) {
                    console.log(`Found student ${nextStudent.studentId} for tutor ${tutorId}`);
                    const tutorSocket = this.availableTutors.get(tutorId);
                    if (tutorSocket) {
                        // Only emit if student isn't already matched
                        if (!Array.from(this.matchedPairs.values()).some(match => match.studentId === nextStudent.studentId)) {
                            // Update queue entry status to indicate tutor is assigned
                            await this.prisma.queueEntry.update({
                                where: { id: nextStudent.id },
                                data: { 
                                    status: QueueStatus.IN_PROGRESS
                                }
                            });

                            tutorSocket.emit('student_assigned', {
                                studentId: nextStudent.studentId,
                                subject: nextStudent.subject || '',
                                urgency: nextStudent.urgency || '',
                                description: nextStudent.description || '',
                                estimatedTime: nextStudent.estimatedTime || 0,
                                studentName: nextStudent.studentName || ''
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error matching tutor with student:', error);
        }
    }

    private async tryMatchStudentWithTutor(studentId: number) {
        // Skip if student is already matched
        if (Array.from(this.matchedPairs.values()).some(match => match.studentId === studentId)) return;

        try {
            const studentEntry = await this.queueService.getQueuePosition(studentId) as QueueEntry;
            if (studentEntry && studentEntry.position === 1) {
                const tutorId = Array.from(this.availableTutors.keys())[0];
                if (tutorId) {
                    console.log(`Found tutor ${tutorId} for student ${studentId}`);
                    const tutorSocket = this.availableTutors.get(tutorId);
                    if (tutorSocket) {
                        // Only emit if tutor isn't already matched
                        if (!this.matchedPairs.has(tutorId)) {
                            // Update queue entry status to indicate tutor is assigned
                            await this.prisma.queueEntry.update({
                                where: { id: studentEntry.id },
                                data: { 
                                    status: QueueStatus.IN_PROGRESS
                                }
                            });

                            tutorSocket.emit('student_assigned', {
                                studentId: studentId,
                                subject: studentEntry.subject || '',
                                urgency: studentEntry.urgency || '',
                                description: studentEntry.description || '',
                                estimatedTime: studentEntry.estimatedTime || 0,
                                studentName: studentEntry.studentName || ''
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error matching student with tutor:', error);
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