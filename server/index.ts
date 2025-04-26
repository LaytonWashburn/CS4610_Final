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
import { Queue } from 'bullmq';
import { Server } from 'socket.io'; // Import Socket.IO types
import { getIo, setIo } from './socket/socketManager'
import { getMinioClient, createMinioProfileBucket } from "./minio/minio";


dotenv.config();

// Prisma Client instance
const prismaClient = new PrismaClient();

const minioClient = getMinioClient();
createMinioProfileBucket(minioClient);


const app = express();
const server = http.createServer(app);  // Create the HTTP server

setIo(server, prismaClient);

const io: Server = getIo();

const port = parseInt(process.env.PORT || '3000');

app.use(express.json());
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(fileUpload());
app.use(morgan("dev"));

app.use("/static", express.static(path.join(__dirname, "static")));


// Health check endpoint
app.use('/health', (req, res) => {
  res.status(200).send('OK');
});




router(app, prismaClient);
app.use(errorMiddlware(prismaClient));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

