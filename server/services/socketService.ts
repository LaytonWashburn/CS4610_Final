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

interface ChatRoom {
    id: number;
    name: string;
    isPrivate: boolean;
}

interface Session {
    id: number;
    studentId: number;
    tutorId: number;
    subject?: string | null;
    urgency?: Urgency | null;
    description?: string | null;
    estimatedTime?: number | null;
    startTime: Date;
    endTime?: Date | null;
    status: SessionStatus;
    name?: string | null;
    chatRoomId?: number | null;
}

export class SocketService {
    private io: Server;
    private queueService: QueueService;
    private availableTutors: Map<number, Socket> = new Map();
    private waitingStudents: Map<number, Socket> = new Map();
    private userSockets: Map<number, Socket> = new Map();
    private matchedPairs: Map<number, MatchData> = new Map();
    private prisma: PrismaClient;

    constructor(io: Server, queueService: QueueService) {
        this.io = io;
        this.queueService = queueService;
        this.prisma = this.queueService.getPrismaClient();
        this.setupSocketHandlers();
    }

    private async createSession(data: { tutorId: number, 
                                   studentId: number, 
                                   queueEntryId: number, 
                                   subject: string, 
                                   urgency: Urgency, 
                                   description: string, 
                                   estimatedTime: number }) {
        try {
            // Update queue entry status to IN_PROGRESS
            await this.prisma.queueEntry.update({
                where: { id: data.queueEntryId },
                data: { status: QueueStatus.IN_PROGRESS }
            });
        } catch (error) {
            console.error('Error updating queue entry status:', error);
        }

        try {
            // First, ensure the tutor exists
            let tutor = await this.prisma.tutor.findUnique({
                where: { tutorId: data.tutorId }
            });

            if (!tutor) {
                console.error('Tutor not found');
                return;
            }

            console.log('Tutor found:', tutor);

            const chatRoom: ChatRoom = await this.prisma.chatRoom.create({
                data: {
                    name: `Tutor Session - ${data.subject}`,
                    isPrivate: true
                }
            });
            console.log('Chatroom created:', chatRoom);

            const checkSession = await this.prisma.session.findFirst({
                where: {
                    AND: [
                        { studentId: data.studentId },
                        { tutorId: tutor.id },
                        { status: SessionStatus.ACTIVE }
                    ]
                }
            });
            if (checkSession) {
                console.log('Session already exists');
                await this.prisma.session.delete({
                    where: { id: checkSession.id }
                });
                console.log('Session deleted');
            }
            
            

            // Create the session
            console.log('Creating session...', data);
            const session:Session | undefined = await this.prisma.session.create({
                data: {
                    studentId: data.studentId,
                    tutorId: tutor.id,
                    subject: data.subject || null,
                    urgency: data.urgency || null,
                    description: data.description || null,
                    estimatedTime: data.estimatedTime || null,
                    status: SessionStatus.ACTIVE,
                    chatRoomId: chatRoom.id,
                    name: `Tutor Session - ${data.subject} - ${new Date().toISOString()}`
                }
            });
            console.log('Session created:', session);

            return session;

        } catch (error) {
            console.error('Error creating session:', error);
        }
    }

    private setupSocketHandlers() {
        this.io.on('connection', (socket: Socket) => {
            console.log('New client connected:', socket.id);

            // Handle user identification
            socket.on('identify', (data: { userId: number }) => {
                console.log('User identified:', data.userId);
                this.userSockets.set(data.userId, socket);
            });

            // Handle reconnection
            socket.on('reconnect', () => {
                console.log('Client reconnected:', socket.id);
                // The identify event will update the socket reference
            });

            // Handle disconnection
            socket.on('disconnect', async () => {
                console.log('Client disconnected:', socket.id);
                
                // Remove from userSockets
                for (const [userId, userSocket] of this.userSockets.entries()) {
                    if (userSocket === socket) {
                        this.userSockets.delete(userId);
                        console.log(`Removed user ${userId} from userSockets`);
                    }
                }

                // Remove from available tutors
                for (const [tutorId, tutorSocket] of this.availableTutors.entries()) {
                    if (tutorSocket === socket) {
                        this.availableTutors.delete(tutorId);
                        console.log(`Tutor ${tutorId} removed from available tutors`);
                        // Update tutor availability in database
                        try {
                            const tutor = await this.prisma.tutor.findUnique({
                                where: { tutorId: tutorId }
                            });
                            if (tutor) {
                                await this.prisma.tutor.update({
                                    where: { id: tutor.id },
                                    data: { available: false }
                                });
                            }
                        } catch (error) {
                            console.error(`Error updating tutor ${tutorId} availability:`, error);
                        }
                    }
                }

                // Remove from waiting students
                for (const [studentId, studentSocket] of this.waitingStudents.entries()) {
                    if (studentSocket === socket) {
                        this.waitingStudents.delete(studentId);
                        console.log(`Student ${studentId} removed from waiting students`);
                        // Update queue entry status
                        try {
                            await this.prisma.queueEntry.updateMany({
                                where: {
                                    studentId: studentId,
                                    status: QueueStatus.WAITING
                                },
                                data: {
                                    status: QueueStatus.CANCELLED
                                }
                            });
                        } catch (error) {
                            console.error(`Error updating queue entries for student ${studentId}:`, error);
                        }
                    }
                }
            });

            // Add logging for event registration
            console.log('Registering end_session handler for socket:', socket.id);

            socket.on('hello', () => {
                console.log('Hello received from socket:', socket.id);
                console.log('Socket data:', socket.data);
                console.log('Socket connected:', socket.connected);
            });
            
            // Handle end_session event
            socket.on('end_session', async (data: { userId: number; chatRoomId: number }) => {
                console.log('End session request received from socket:', socket.id);
                console.log('End session data:', data);
                try {
                    console.log('Looking for user with ID:', data.userId);
                    const user = await this.prisma.user.findUnique({
                        where: {
                            id: data.userId
                        }
                    });
                    
                    if(!user) {
                        console.error('User not found');
                        return;
                    }

                    console.log('User found:', user);

                    let tutor = await this.prisma.tutor.findUnique({
                        where: {
                            tutorId: user.id
                        }
                    });

                    if(!tutor) {
                        console.error('Person who closed the session is not a tutor');
                    }

                    let session: Session | null = null;

                    if(tutor) {
                        session = await this.prisma.session.findFirst({
                            where: {
                                tutorId: tutor.id,
                                chatRoomId: data.chatRoomId,
                                status: SessionStatus.ACTIVE
                            }
                        });
                    } else {
                        session = await this.prisma.session.findFirst({
                            where: {
                                studentId: user.id,
                                chatRoomId: data.chatRoomId,
                                status: SessionStatus.ACTIVE
                            }
                        });
                    }

                    if (!session) {
                        console.error('No active session found for:', {
                            userId: user.id,
                            chatRoomId: data.chatRoomId
                        });
                        return;
                    }

                    console.log('Found session:', session);

                    tutor = await this.prisma.tutor.findUnique({
                        where: {
                            id: session.tutorId
                        }
                    });

                    if(!tutor) {
                        console.error('Tutor not found from session');
                        return;
                    }

                    // Mark the tutor as available
                    await this.prisma.tutor.update({
                        where: {
                            id: tutor.id
                        },
                        data: {
                            available: true
                        }
                    });

                    // Update session status
                    const updatedSession = await this.prisma.session.update({
                        where: { id: session.id },
                        data: { status: SessionStatus.ENDED }
                    });

                    console.log('Updated session status to ENDED:', updatedSession);

                    // Update queue entry status
                    try {
                        // First find the queue entry
                        const queueEntry = await this.prisma.queueEntry.findFirst({
                            where: {
                                studentId: updatedSession.studentId,
                                status: QueueStatus.IN_PROGRESS
                            }
                        });

                        if (queueEntry) {
                            // Then update it using its id
                            const updatedQueueEntry = await this.prisma.queueEntry.update({
                                where: { id: queueEntry.id },
                                data: { status: QueueStatus.COMPLETED }
                            });
                            console.log('Queue entry updated to COMPLETED:', updatedQueueEntry);
                        } else {
                            console.log('No queue entry found to update');
                        }
                    } catch (error) {
                        console.error('Error updating queue entry status:', error);
                    }
                    
                    const matchData = this.matchedPairs.get(tutor.tutorId);
                    console.log('Looking for matchData with tutorId:', tutor.tutorId);
                    console.log('Current matchedPairs keys:', Array.from(this.matchedPairs.keys()));
                    console.log('Found matchData:', matchData);
                    
                    if(!matchData){
                        console.error('Match data not found');
                        return;
                    }

                    // Find sockets using Socket.io's built-in tracking
                    const studentSocket = Array.from(this.io.sockets.sockets.values())
                        .find((s: Socket) => s.data.userId === matchData.studentId) as Socket;
                    const tutorSocket = Array.from(this.io.sockets.sockets.values())
                        .find((s: Socket) => s.data.userId === matchData.tutorId) as Socket;

                    if (!studentSocket || !tutorSocket) {
                        console.error('Student or tutor socket not found');
                        return;
                    }

                    console.log('Student socket ID:', studentSocket.id);
                    console.log('Tutor socket ID:', tutorSocket.id);
                    console.log('Student socket connected:', studentSocket.connected);
                    console.log('Tutor socket connected:', tutorSocket.connected);

                    // Notify both parties
                    studentSocket.emit('session_ended', { 
                        success: true, 
                        navigateTo: '/dashboard/queue' 
                    });

                    tutorSocket.emit('session_ended', { 
                        success: true, 
                        navigateTo: '/dashboard/queue' 
                    });
                
                    this.matchedPairs.delete(tutor.tutorId);
                    console.log('Removed from matched pairs');

                    
                    
                    
                } catch (error) {
                    console.error('Error ending session:', error);
                    socket.emit('session_ended', { success: false });
                }
            });

            // Socket Event for when a student joins the queue
            socket.on('student_enqueue', async (data: { studentId: number, queueEntry: QueueEntry }) => {
                console.log('Student enqueued:', data);
                this.waitingStudents.set(data.studentId, socket);

                try {
                    const response = await this.prisma.tutor.findMany({
                        where: {
                            available: true
                        }
                    });

                    if (response.length === 0) {
                        console.log('No tutors available');
                        // socket.emit('no_tutors_available', { message: 'No tutors available' });
                    } else {
                        console.log('Tutors available');
                        const tutor = response[0];
                        try {
                            await this.prisma.tutor.update({ // Update tutor availability to false
                                where: {
                                    id: tutor.id
                                },
                                data: {
                                    available: false
                                }
                            });
                        } catch (error) {
                            console.error('Error updating tutor availability:', error);
                        }
                        try {
                            const student = await this.prisma.user.findUnique({
                                where: {
                                    id: data.studentId
                                }
                            });
                            console.log('Student:', student);
                            
                            // Find the tutor's socket
                            console.log('Available tutors:', Array.from(this.availableTutors.keys()));
                            console.log('Tutor ID:', tutor.tutorId);
                            const tutorSocket = this.availableTutors.get(tutor.tutorId);
                            if (tutorSocket) {
                                tutorSocket.emit('student_waiting', { 
                                    tutor: tutor, 
                                    student: {
                                        id: student?.id,
                                        firstName: student?.firstName,
                                        lastName: student?.lastName,
                                        email: student?.email
                                    },
                                    queueEntry: {
                                        id: data.queueEntry.id,
                                        subject: data.queueEntry.subject,
                                        urgency: data.queueEntry.urgency,
                                        description: data.queueEntry.description,
                                        estimatedTime: data.queueEntry.estimatedTime,
                                        position: data.queueEntry.position
                                    },
                                });
                            } else {
                                console.error('Tutor socket not found for tutor:', tutor.id);
                            }
                        } catch (error) {
                            console.error('Error sending student_waiting:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error in student_enqueue:', error);
                }
            });


            socket.on('tutor_assigned', async (data: { studentId: number, 
                                                        tutorId: number, 
                                                        subject: string, 
                                                        urgency: Urgency, 
                                                        description: string, 
                                                        estimatedTime: number, 
                                                        studentName: string,
                                                        queueEntryId: number,
                                                        position: number }) => {

                console.log('Socket Service received Tutor assigned signal:', data);

                const session: Session | undefined = await this.createSession(data);
                if (!session) {
                    console.error('Session not created');
                    return;
                }

                // Create the match data with just user IDs
                const matchData: MatchData = {
                    studentId: data.studentId,
                    tutorId: data.tutorId,
                    sessionId: session.id,
                    subject: data.subject,
                    urgency: data.urgency,
                    description: data.description,
                    estimatedTime: data.estimatedTime,
                    studentName: data.studentName
                };

                // Store the match
                this.matchedPairs.set(data.tutorId, matchData);

                console.log('Setting Matched pairs:', this.matchedPairs);

                // Get current socket instances from availableTutors and waitingStudents
                const studentSocket = this.waitingStudents.get(data.studentId);
                const tutorSocket = this.availableTutors.get(data.tutorId);

                if (!studentSocket || !tutorSocket) {
                    console.error('Student or tutor socket not found');
                    return;
                }

                // Notify both parties
                studentSocket.emit('session_created', { success: true, session: session });
                tutorSocket.emit('session_created', { success: true, session: session });

                // Remove from available tutors and waiting students
                this.availableTutors.delete(data.tutorId);
                this.waitingStudents.delete(data.studentId);
            });


            // Handle tutor availability
            socket.on('tutor_available', async (data: { tutorId: number, isAvailable: boolean }) => {
                console.log('Socket Service recieved Tutor available signal:', data);
                try {
                    if (data.isAvailable) {
                        console.log(`Tutor ${data.tutorId} is now available`);
                        this.availableTutors.set(data.tutorId, socket);
                        console.log('Available tutors:', Array.from(this.availableTutors.keys()));

                        const tutor = await this.prisma.tutor.findUnique({
                            where: { tutorId: data.tutorId }
                        });
                        if (!tutor) {
                            console.error('Tutor not found');
                            return;
                        }

                        const waitingStudents = Array.from(this.waitingStudents.entries());
                        if (waitingStudents.length > 0) {
                            const [studentId, studentSocket] = waitingStudents[0];
                            const queueEntry = await this.prisma.queueEntry.findFirst({
                                where: {
                                    studentId: studentId,
                                    status: QueueStatus.WAITING
                                }
                            });
                            if (!queueEntry) {
                                console.error('Queue entry not found');
                                return;
                            }

                            // Ensure all required fields are present and non-null
                            if (!queueEntry.subject || !queueEntry.urgency || !queueEntry.description || !queueEntry.estimatedTime) {
                                console.error('Queue entry missing required fields');
                                return;
                            }

                            const session = await this.createSession({
                                tutorId: data.tutorId,
                                studentId: studentId,
                                queueEntryId: queueEntry.id,
                                subject: queueEntry.subject,
                                urgency: queueEntry.urgency,
                                description: queueEntry.description,
                                estimatedTime: queueEntry.estimatedTime
                            });

                            if (!session) {
                                console.error('Session not created');
                                return;
                            }

                            const tutorSocket = this.availableTutors.get(data.tutorId);
                            if (!tutorSocket) {
                                console.error('Tutor socket not found');
                                return;
                            }


                            const student = await this.prisma.user.findUnique({
                                where: {
                                    id: studentId
                                }
                            });

                            if (!student) {
                                console.error('Student not found');
                                return;
                            }

                            tutorSocket.emit('student_waiting', { 
                                tutor: tutor, 
                                student: {
                                    id: studentId,
                                    firstName: student?.firstName,
                                    lastName: student?.lastName,
                                    email: student?.email
                                },
                                queueEntry: {                   
                                    id: queueEntry.id,
                                    subject: queueEntry.subject,
                                    urgency: queueEntry.urgency,
                                    description: queueEntry.description,
                                    estimatedTime: queueEntry.estimatedTime,
                                    position: queueEntry.position
                                },
                            });
                        }
                    } else {
                        console.log(`Tutor ${data.tutorId} is no longer available`);
                        this.availableTutors.delete(data.tutorId);
                        console.log('Available tutors after removal:', Array.from(this.availableTutors.keys()));
                    }
                } catch (error) {
                    console.error('Error handling tutor availability:', error);
                }
            });
        });
    }



    public getWaitingStudentsCount(): number {
        return this.waitingStudents.size;
    }

    public getAvailableTutorsCount(): number {
        return this.availableTutors.size;
    }
}