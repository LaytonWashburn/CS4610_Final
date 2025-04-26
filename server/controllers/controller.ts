import { PrismaClient } from "@prisma/client"
import { Request, Response, Router, NextFunction } from "express"
import { MiddlewareFactory } from "../middleware/middleware"
import { Server } from 'socket.io'

export type EndpointBuilder = (db: PrismaClient ) => (req: Request, res: Response) => void

export type Endpoint = {
  method: "get" | "post" | "put" | "delete" | "patch",
  path: string,
  middleware?: MiddlewareFactory[]
  builder: EndpointBuilder
}

export const controller = (endpoints: Endpoint[], middleware: MiddlewareFactory[] = []) => (db: PrismaClient) => {
  const router = Router({mergeParams: true});
  middleware.forEach(m => router.use(m(db)))
  endpoints.forEach((endpoint) => {
    router[endpoint.method](
      endpoint.path,
      endpoint.middleware ? endpoint.middleware.map(m => m(db)) : [],
      endpoint.builder(db)
    )
  })
  return router;
}