import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io";

export class TutorStatusService {
  private static instance: TutorStatusService;
  private prisma: PrismaClient;
  private io: Server;

  private constructor(prisma: PrismaClient, io: Server) {
    this.prisma = prisma;
    this.io = io;
  }

  public static getInstance(prisma: PrismaClient, io: Server): TutorStatusService {
    if (!TutorStatusService.instance) {
      TutorStatusService.instance = new TutorStatusService(prisma, io);
    }
    return TutorStatusService.instance;
  }

  public async setTutorOnline(userId: number): Promise<void> {
    console.log("Setting tutor online in the server from the tutorStatusService");
    try {
      const tutor = await this.prisma.tutor.findUnique({
        where: { tutorId: userId }
      });

      if (!tutor) {
        // If tutor doesn't exist, create them as online
        await this.prisma.tutor.create({
          data: { 
            tutorId: userId,
            online: true
          }
        });
      } else {
        // Update existing tutor to online
        await this.prisma.tutor.update({
          where: { tutorId: userId },
          data: { online: true },
        });
      }
      this.io.emit("tutor-status-update", { type: "increment" });
    } catch (error) {
      console.error("Error setting tutor online:", error);
    }
  }

  public async setTutorOffline(userId: number): Promise<void> {
    console.log("Setting tutor offline in the server from the tutorStatusService");
    try {
      await this.prisma.tutor.update({
        where: { tutorId: userId },
        data: { online: false },
      });
      this.io.emit("tutor-status-update", { type: "decrement" });
    } catch (error) {
      console.error("Error setting tutor offline:", error);
    }
  }

  public async getOnlineTutorsCount(): Promise<number> {
    try {
      return await this.prisma.tutor.count({
        where: { online: true }
      });
    } catch (error) {
      console.error("Error getting online tutors count:", error);
      return 0;
    }
  }
} 