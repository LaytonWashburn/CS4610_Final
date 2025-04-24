import { EndpointBuilder, controller } from "./controller";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { UsersRepository } from "../lib/repositories/users_repository";
import { ContextRole } from "@prisma/client";

export const logIn: EndpointBuilder = (
  db,
  usersRepository = new UsersRepository(db)
) => async (req, res) => {
  const user = await usersRepository.findByEmail(req.body.email);

 

  if (!user || !bcrypt.compareSync(req.body.password, user.passwordHash)) {
    res.status(404).json({ error: "Invalid email or password."});
  } else {
    const isTutor = await db.tutor.findUnique({
      where: { tutorId: user.id },
    });
    const authToken = jwt.sign({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      contextId: null,
      mode: "standalone",
      isTutor: !!isTutor, // 👈 include in token
      roles: user.contextRoles.map((cr) => cr.role.roleKey),
    }, process.env.ENCRYPTION_KEY!);
    res.json({authToken})
  }
}


export const SessionsController = controller([
  {
    method: "post",
    path: "/",
    builder: logIn
  }
])
