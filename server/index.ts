import express from "express";
import path from "path";
import dotenv from "dotenv";
import { engine } from 'express-handlebars';
import { PrismaClient } from "@prisma/client";
import morgan from "morgan";
import http from "http";
import { router } from "./router/router";
import fileUpload from "express-fileupload";
import "express-async-errors";
import { errorMiddlware } from "./middleware/error_middlware";

dotenv.config();

const prismaClient = new PrismaClient()

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000');

app.use(express.json());

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(fileUpload())

app.use(morgan("dev"));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.path.match(/\.\w+$/)) {
      res.redirect(`${process.env.ASSET_URL}${req.path}`);
    } else {
      next();
    }
  })
} else {
  app.use("/static", express.static(path.join(__dirname, "static")))
}

app.use('/health', (req, res) => {
  res.status(200).send('OK');
});

router(app, prismaClient);
app.use(errorMiddlware(prismaClient));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



