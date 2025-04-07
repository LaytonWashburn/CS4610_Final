import { RoleKey } from "@prisma/client";
import { EndpointBuilder, controller } from "../controller";
import { authMiddleware } from "../../middleware/auth_middleware";
import { rolesMiddleware } from "../../middleware/roles_middleware";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { UsersRepository } from "../../lib/repositories/users_repository";

export const index: EndpointBuilder = (db) => async (req, res) => {
  const users = await db.user.findMany();
  res.json({ users })
}

export const create: EndpointBuilder = (db, usersRepository = new UsersRepository(db)
) => async (req, res) => {
  try {
    const user = await usersRepository.createUser(
      req.body.email,
      req.body.firstName,
      req.body.lastName,
      await bcrypt.hash(req.body.password, 10)
    );

    const authToken = jwt.sign({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      contextId: null,
      mode: "standalone",
      roles: [],
    }, process.env.ENCRYPTION_KEY!);

    res.json({authToken, user})
  } catch (error) {
    res.status(400).json({ error: "A user with that email address already exists." });
  }
}

export const me: EndpointBuilder = (db, usersRepository = new UsersRepository(db)) => async (req, res) => {
  const user = await usersRepository.findByEmail(req.user!.email);
  res.json({ user });
}

export const UsersController = controller([
  {
    method: "get",
    path: "/",
    builder: index,
    middleware: [authMiddleware, rolesMiddleware([RoleKey.SITE_ADMIN])]
  }, {
    method: "post",
    path: "/",
    builder: create,
  }, {
    method: "get",
    path: "/me",
    builder: me,
    middleware: [authMiddleware]
  }
], [])
