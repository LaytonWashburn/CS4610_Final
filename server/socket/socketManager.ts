import { Server } from 'socket.io';
import http from "http";
import { PrismaClient } from "@prisma/client";

let io: Server | null = null;

// Set the Socket.io instance
export const setIo = (server: http.Server, prismaClient: PrismaClient) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",  // Allow client-side connections from this origin
    },
  });

    // Socket Connections
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle user joining a chat room
    socket.on("join-room", (roomId: string) => {
      console.log(`Socket ${socket.id} joined room ${roomId}`);
      socket.join(roomId);  // Join the specific chat room
    });

    // Handle tutor coming online
    socket.on("tutor-online", async (userId: string) => {
      console.log(`Tutor ${userId} is online`);
      await prismaClient.tutor.update({
        where: { tutorId: parseInt(userId) },
        data: { online: true },
      });
    });

    // Handle tutor going offline
    socket.on("tutor-offline", async (data: { userId: string }) => {
      console.log(`Tutor ${data.userId} is offline`);
      await prismaClient.tutor.update({
        where: { tutorId: parseInt(data.userId) },
        data: { online: false },
      });
    });

    // Handle a student requesting a session
    socket.on('tutorSessionRequest', async (studentId: string | number) => {
      // You can match a tutor here
      console.log(`Student ${studentId} is requesting a session`);
    });

    // Handle when the student finishes the session
    socket.on('tutorSessionEnd', (tutorId: string | number) => {
      console.log(`Tutor ${tutorId} has finished the session`);
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
