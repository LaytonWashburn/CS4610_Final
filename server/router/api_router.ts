import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { UsersController } from "../controllers/api/users_controller"


export const apiRouter = (db: PrismaClient) => {
  const router = Router({mergeParams: true})
  
  router.use("/users", UsersController(db));

  return router;
}
