import { MiddlewareFactory } from "./middleware";
import * as jwt from "jsonwebtoken";

export const authMiddleware: MiddlewareFactory = (db) => async (req, res, next) => {
  try {
    let token;
    if (req.headers["authorization"]) {
      token = req.headers["authorization"]?.split(" ")[1]
    } else {
      token = req.body.authorization;
    }
    jwt.verify(token!, process.env.ENCRYPTION_KEY!)
    const parsedToken: jwt.JwtPayload = jwt.decode(token!) as jwt.JwtPayload;
    const user = await db.user.findUnique({
      where: {
        id: parsedToken.userId
      }
    });
    if (!user) {
      throw "User not found";
    } else {
      req.user = user;
      req.jwtPayload = parsedToken;
      res.locals.context = parsedToken.launchContext;
      res.locals.token = parsedToken.launchToken;
    }
    next();
  } catch(e) {
    console.log(e);
    res.status(401).json({ error: "unauthorized" });
  }
}