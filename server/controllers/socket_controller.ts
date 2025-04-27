import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { SocketService } from '../services/socketService';

let socketService: SocketService | null = null;

export const initializeSocket = (httpServer: HttpServer, prisma: PrismaClient) => {
    if (!socketService) {
        socketService = new SocketService(httpServer, prisma);
        console.log('Socket service initialized');
    }
    return socketService;
};

export const getSocketService = () => {
    if (!socketService) {
        throw new Error('Socket service not initialized');
    }
    return socketService;
}; 