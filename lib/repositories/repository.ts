import { PrismaClient } from "@prisma/client";

export class Repository {
  protected db: PrismaClient
  constructor(db: PrismaClient) {
    this.db = db;
  }
}