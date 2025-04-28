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
      console.log("In the tutor status event on the server");
      if (data.action === 'online') {
        console.log("Setting tutor online from the socketManager");
        await tutorStatusService.setTutorOnline(data.userId);
      } else {
        console.log("Setting tutor offline from the socketManager");
        await tutorStatusService.setTutorOffline(data.userId);
      }
    });

    // Handle user leaving a session
    socket.on("leave-room", async (data: { roomId: string, userId: number, isTutor: boolean }) => {
      console.log(`Socket ${socket.id} left room ${data.roomId}`);
      
      // Only leave the room, don't affect tutor status
      socket.leave(data.roomId);
      
      // If the tutor is leaving, update the session status to ENDED
      if (data.isTutor) {
        try {
          const sessionId = parseInt(data.roomId.replace('session-', ''));
          await prismaClient.session.update({
            where: { id: sessionId },
            data: { status: 'ENDED' }
          });
          console.log(`Session ${sessionId} marked as ENDED because tutor left`);
        } catch (error) {
          console.error('Error updating session status:', error);
        }
      }
      
      // Check if room is empty and clean up if needed
      const room = io?.sockets.adapter.rooms.get(data.roomId);
      if (room && room.size === 0) {
        console.log(`Room ${data.roomId} is empty, cleaning up...`);
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log("User disconnected");
      
      // Get all rooms the socket is in
      const rooms = Array.from(socket.rooms);
      
      // Remove socket from all rooms
      for (const roomId of rooms) {
        if (roomId !== socket.id) { // Skip the socket's own room
          socket.leave(roomId);
          console.log(`Socket ${socket.id} left room ${roomId} on disconnect`);
          
          // Check if room is empty
          const room = io?.sockets.adapter.rooms.get(roomId);
          if (room && room.size === 0) {
            console.log(`Room ${roomId} is empty after disconnect, cleaning up...`);
          }
        }
      }
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
