import { Express } from "express"
import { HomeController } from "../controllers/home_controller"
import { PrismaClient } from "@prisma/client"
import { SessionsController } from "../controllers/sessions_controller"
import { apiRouter } from "./api_router"

export const router = (app: Express, db: PrismaClient) => {
  app.use("/sessions", SessionsController(db));
  app.use("/api", apiRouter(db));
  app.use("/", HomeController(db)); // needs to come last
}