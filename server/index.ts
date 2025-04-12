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
import { Ollama } from "ollama";

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


app.get('/chats', async (req, res) => {
  const chatRooms = await prismaClient.chatRoom.findMany();
  res.json({'chatRooms': chatRooms});
});

app.delete('/delete-chat/:id', async (req, res) => {
  const chatRoomId = parseInt(req.params.id);
  console.log(`The chat being deleted is: ${chatRoomId}`);

  try {
    await prismaClient.chatRoom.delete({
      where: { id: chatRoomId },
    });
    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Chat deletion failed", details: err });
  }
});

// Create a new chat room
app.post('/create-chat-room', async (req, res) => {
  const { name } = req.body;
  console.log(name);

  try {
    // 1. Create a new chat room
    const chatRoom = await prismaClient.chatRoom.create({
      data: {
        name: name
      },
    });

    // 2. Return success response
    res.status(201).json({
      message: 'Chat room created successfully.',
      chatRoom,
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'An error occurred while creating the chat room.' });
  }
});



app.use('/health', (req, res) => {
  res.status(200).send('OK');
});

router(app, prismaClient);
app.use(errorMiddlware(prismaClient));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



