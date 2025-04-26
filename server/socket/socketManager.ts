import { Server } from 'socket.io';
import http from "http";
import { PrismaClient } from "@prisma/client";
import { TutorStatusService } from '../services/tutorStatusService';

let io: Server | null = null;

// Set the Socket.io instance
export const setIo = (server: http.Server, prismaClient: PrismaClient) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",  // Allow client-side connections from this origin
    },
  });

  const tutorStatusService = TutorStatusService.getInstance(prismaClient, io);

  // Socket Connections
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle user joining a chat room
    socket.on("join-room", (roomId: string) => {
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      socket.join(roomId);  // Join the specific chat room
    });

    // Handle tutor status updates
    socket.on("tutor-status", async (data: { userId: number, action: 'online' | 'offline' }) => {
      console.log("In the tutor status");
      if (data.action === 'online') {
        await tutorStatusService.setTutorOnline(data.userId);
      } else {
        await tutorStatusService.setTutorOffline(data.userId);
      }
    });

    // Handle a student requesting a session
    socket.on('tutorSessionRequest', async (data: { studentId: number, tutorId: number }) => {
      console.log(`Student ${data.studentId} is requesting a session with tutor ${data.tutorId}`);
      // Generate a unique chat room ID
      const chatRoomId = `chat-${data.studentId}-${data.tutorId}`;
      // Emit match event to both student and tutor with chat room ID
      io?.to(`student-${data.studentId}`).emit('match-found', { tutorId: data.tutorId, chatRoomId });
      io?.to(`tutor-${data.tutorId}`).emit('match-found', { studentId: data.studentId, chatRoomId });
    });

    // Handle when the student finishes the session
    socket.on('tutorSessionEnd', (data: { tutorId: number, studentId: number }) => {
      console.log(`Session ended between tutor ${data.tutorId} and student ${data.studentId}`);
      // Notify both parties that the session has ended
      io?.to(`student-${data.studentId}`).emit('session-ended');
      io?.to(`tutor-${data.tutorId}`).emit('session-ended');
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};

// Get the Socket.io instance, throwing an error if not set
export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.io instance not set.');
  }
  return io;
};
