import { ErrorMiddlewareFactory } from "./middleware";

export const errorMiddlware: ErrorMiddlewareFactory = (db) => (err, req, res, next) => {
  console.log("ERROR", err);
  res.status(500).json({ error: "An unexpected error occurred. Please contact support if the issue continues." });
}
