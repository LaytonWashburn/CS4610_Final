import { Express } from "express"
import { HomeController } from "../controllers/home_controller"
import { PrismaClient } from "@prisma/client"
import { SessionsController } from "../controllers/sessions_controller"
import { apiRouter } from "./api_router"
import { QueueController } from "../controllers/queue_controller"
import { TutorController } from "../controllers/tutor_controller"
import { ChatController } from "../controllers/chat_controller"
import { ProfileController } from "../controllers/profile_controller"
import { AiController } from "../controllers/ai_controller"
import { SessionController } from "../controllers/session_controller"


export const router = (app: Express, db: PrismaClient) => {
  app.use("/sessions", SessionsController(db));
  app.use("/api", apiRouter(db));
  app.use("/tutor", TutorController(db));
  app.use("/queue", QueueController(db));
  app.use("/chat", ChatController(db));
  app.use("/profile", ProfileController(db));
  app.use("/ai", AiController(db));
  app.use("/session", SessionController(db));
  app.use("/", HomeController(db)); // needs to come last
}