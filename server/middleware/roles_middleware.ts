import { RoleKey } from "@prisma/client";
import { MiddlewareFactory } from "./middleware";

type RolesMiddleware = (roleKeys: RoleKey[], useParams?: boolean) => MiddlewareFactory

export const rolesMiddleware: RolesMiddleware = (roleKeys, useParams = false) => (db) => async (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: "unauthorized" });
  } else {
    const roles = (await db.contextRole.findMany({
      where: {
        user: req.user,
        contextId: (useParams ? req.params.contextId : req.jwtPayload?.contextId) || null,
        role: {
          roleKey: {
            in: roleKeys
          }
        }
      },
      include: {
        role: true
      }
    })).map(cRole => cRole.role.roleKey);
    req.roles = roles;
    if (roles.length > 0) {
      next()
    } else {
      res.status(401).json({ error: "unauthorized" });
    }
  }
}
