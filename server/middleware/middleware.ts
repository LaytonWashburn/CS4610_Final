import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

export type Middleware = (req: Request, res: Response, next: NextFunction) => void

export type ErrorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => void

export type MiddlewareFactory = (db: PrismaClient) => Middleware
export type ErrorMiddlewareFactory = (db: PrismaClient) => ErrorMiddleware