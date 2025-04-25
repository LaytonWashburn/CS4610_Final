import { Server } from 'socket.io';
import http from "http";

let io: Server | null = null;

// Set the Socket.io instance
export const setIo = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",  // Allow client-side connections from this origin
    },
  });

};

// Get the Socket.io instance, throwing an error if not set
export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.io instance not set.');
  }
  return io;
};
