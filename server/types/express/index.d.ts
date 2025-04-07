import { PrismaClient, Role, User } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

declare global {
  declare namespace Express {
    interface Request {
      user?: User
      jwtPayload?: JwtPayload
      roles?: RoleKey[]
    }
  }
}