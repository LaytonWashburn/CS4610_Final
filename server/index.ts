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
import { Server, Socket } from 'socket.io';  // Import Socket.IO types

dotenv.config();

const prismaClient = new PrismaClient();

const app = express();
const server = http.createServer(app);  // Create the HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",  // Allow client-side connections from this origin
  },
});
const port = parseInt(process.env.PORT || '3000');

app.use(express.json());

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(fileUpload());
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
  app.use("/static", express.static(path.join(__dirname, "static")));
}

// Chat Room API Endpoints
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
    // Create a new chat room in the database
    const chatRoom = await prismaClient.chatRoom.create({
      data: {
        name: name
      },
    });

    // Return success response
    res.status(201).json({
      message: 'Chat room created successfully.',
      chatRoom,
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'An error occurred while creating the chat room.' });
  }
});

// Create a new message
app.post('/messages', async (req, res) => {
  const { content, chatRoomId, senderId } = req.body;

  try {
    const message = await prismaClient.message.create({
      data: {
        content,
        chatRoomId,
        senderId
      },
      include: {
        sender: true
      }
    });

    // Send the new message to the chat room via Socket.IO
    io.to(chatRoomId.toString()).emit('receiveMessage', message);  // Send message to the specific room

    res.status(201).json(message);
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all messages from a specific room
app.get('/messages/:chatRoomId', async (req, res) => {
  const chatRoomId = parseInt(req.params.chatRoomId);

  if (isNaN(chatRoomId)) {
    return res.status(400).json({ error: "Invalid chat room ID" });
  }

  try {
    const messages = await prismaClient.message.findMany({
      where: {
        chatRoomId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        sentAt: 'asc',
      }
    });

    res.json(messages);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages", details: err });
  }
});

// Health check endpoint
app.use('/health', (req, res) => {
  res.status(200).send('OK');
});

// Socket.IO connection handler
io.on('connection', (socket: Socket) => {  // Explicitly type the socket parameter
  console.log('A user connected:', socket.id);

  // Handle user joining a chat room
  socket.on('join-room', (roomId: string) => {  // You can further type roomId if needed
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    socket.join(roomId);  // Join the specific chat room
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log("A user disconnected:", socket.id);
  });
});

router(app, prismaClient);
app.use(errorMiddlware(prismaClient));

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




// import express from "express";
// import path from "path";
// import dotenv from "dotenv";
// import { engine } from 'express-handlebars';
// import { PrismaClient } from "@prisma/client";
// import morgan from "morgan";
// import http from "http";
// import { router } from "./router/router";
// import fileUpload from "express-fileupload";
// import "express-async-errors";
// import { errorMiddlware } from "./middleware/error_middlware";
// import { Queue } from 'bullmq';
// import { Ollama } from "ollama";
// import { Server } from 'socket.io';  // Import Socket.IO


// dotenv.config();

// const prismaClient = new PrismaClient()

// const app = express();
// const server = http.createServer(app);
// const port = parseInt(process.env.PORT || '3000');

// app.use(express.json());

// app.engine('handlebars', engine());
// app.set('view engine', 'handlebars');
// app.set('views', './views');

// app.use(fileUpload())

// app.use(morgan("dev"));

// if (process.env.NODE_ENV !== 'production') {
//   app.use((req, res, next) => {
//     if (req.path.match(/\.\w+$/)) {
//       res.redirect(`${process.env.ASSET_URL}${req.path}`);
//     } else {
//       next();
//     }
//   })
// } else {
//   app.use("/static", express.static(path.join(__dirname, "static")))
// }


// app.get('/chats', async (req, res) => {
//   const chatRooms = await prismaClient.chatRoom.findMany();
//   res.json({'chatRooms': chatRooms});
// });

// app.delete('/delete-chat/:id', async (req, res) => {
//   const chatRoomId = parseInt(req.params.id);
//   console.log(`The chat being deleted is: ${chatRoomId}`);

//   try {
//     await prismaClient.chatRoom.delete({
//       where: { id: chatRoomId },
//     });
//     res.status(200).json({ message: "Chat deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: "Chat deletion failed", details: err });
//   }
// });

// // Create a new chat room
// app.post('/create-chat-room', async (req, res) => {
//   const { name } = req.body;
//   console.log(name);

//   try {
//     // 1. Create a new chat room
//     const chatRoom = await prismaClient.chatRoom.create({
//       data: {
//         name: name
//       },
//     });

//     // 2. Return success response
//     res.status(201).json({
//       message: 'Chat room created successfully.',
//       chatRoom,
//     });
//   } catch (error) {
//     console.error('Error creating chat room:', error);
//     res.status(500).json({ error: 'An error occurred while creating the chat room.' });
//   }
// });


// // Add this in your Express server:
// app.post('/messages', async (req, res) => {
//   const { content, chatRoomId, senderId } = req.body;

//   try {
//     const message = await prismaClient.message.create({
//       data: {
//         content,
//         chatRoomId,
//         senderId
//       },
//       include: {
//         sender: true
//       }
//     });

//     res.status(201).json(message);
//   } catch (err) {
//     console.error('Error creating message:', err);
//     res.status(500).json({ error: 'Failed to send message' });
//   }
// });


// // Endpoint to get all the messages from a room
// app.get('/messages/:chatRoomId', async (req, res) => {
//   const chatRoomId = parseInt(req.params.chatRoomId);

//   if (isNaN(chatRoomId)) {
//     return res.status(400).json({ error: "Invalid chat room ID" });
//   }

//   try {
//     const messages = await prismaClient.message.findMany({
//       where: {
//         chatRoomId,
//       },
//       include: {
//         sender: {
//           select: {
//             firstName: true,
//             lastName: true,
//           }
//         }
//       },
//       orderBy: {
//         sentAt: 'asc',
//       }
//     });

//     res.json(messages);
//   } catch (err) {
//     console.error("Failed to fetch messages:", err);
//     res.status(500).json({ error: "Failed to fetch messages", details: err });
//   }
// });




// app.use('/health', (req, res) => {
//   res.status(200).send('OK');
// });

// router(app, prismaClient);
// app.use(errorMiddlware(prismaClient));

// server.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });



