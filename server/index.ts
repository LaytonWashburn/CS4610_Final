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

dotenv.config();

// Prisma Client instance
const prismaClient = new PrismaClient();

const app = express();
const server = http.createServer(app);  // Create the HTTP server

setIo(server);

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

// Socket Connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle user joining a chat room
  socket.on("join-room", (roomId: string) => {
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    socket.join(roomId);  // Join the specific chat room
  });

  // Handle tutor coming online
  socket.on("tutor-online", async (userId: string) => {
    console.log(`Tutor ${userId} is online`);
    await prismaClient.tutor.update({
      where: { tutorId: parseInt(userId) },
      data: { online: true },
    });
  });

  // Handle tutor going offline
  socket.on("tutor-offline", async (data: { userId: string }) => {
    console.log(`Tutor ${data.userId} is offline`);
    await prismaClient.tutor.update({
      where: { tutorId: parseInt(data.userId) },
      data: { online: false },
    });
  });

  // Handle a student requesting a session
  socket.on('tutorSessionRequest', async (studentId: string | number) => {
    // You can match a tutor here
    console.log(`Student ${studentId} is requesting a session`);
  });

  // Handle when the student finishes the session
  socket.on('tutorSessionEnd', (tutorId: string | number) => {
    console.log(`Tutor ${tutorId} has finished the session`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
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
// import { Server, Socket } from 'socket.io';  // Import Socket.IO types

// dotenv.config();



// // Make the student and available tutors data structure
// // const studentQueue: any = [];
// const availableTutors = new Set();

// const studentQueue = new Queue('student-queue', {
//   connection: {
//     host: process.env.REDIS_HOST,
//     port: parseInt(process.env.REDIS_PORT || '6379'),
//   },
// })


// const prismaClient = new PrismaClient();

// const app = express();

// const server = http.createServer(app);  // Create the HTTP server

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",  // Allow client-side connections from this origin
//   },
// });

// const port = parseInt(process.env.PORT || '3000');

// app.use(express.json());

// app.engine('handlebars', engine());
// app.set('view engine', 'handlebars');
// app.set('views', './views');

// app.use(fileUpload());
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
//   app.use("/static", express.static(path.join(__dirname, "static")));
// }


// // Endpoint to get the number of online tutors
// app.get('/tutors/online', async (req, res) => {

//   console.log("In the online api for tutors");

//   const onlineTutorsCount = await prismaClient.tutor.count({
//     where: { online: true },
//   });
//   console.log(`The number of tutors online is: ${onlineTutorsCount}`);
//   res.json({ onlineTutors: onlineTutorsCount });
// });




// // Chat Room API Endpoints
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
//     // Create a new chat room in the database
//     const chatRoom = await prismaClient.chatRoom.create({
//       data: {
//         name: name
//       },
//     });

//     // Return success response
//     res.status(201).json({
//       message: 'Chat room created successfully.',
//       chatRoom,
//     });
//   } catch (error) {
//     console.error('Error creating chat room:', error);
//     res.status(500).json({ error: 'An error occurred while creating the chat room.' });
//   }
// });




// app.get('/tutors', async (req, res) => {
//   try {
//     const tutors = await prismaClient.user.findMany({
//       where: {
//         tutor: {
//           isNot: null,
//         },
//       },
//     });

//     return res.json({ tutors }); // ✅ Wrap in an object with `tutors` key
//   } catch (err) {
//     console.error('Failed to get tutor users:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// })


// /**
//  * @description: Endpoint to add new tutor
//  */
// app.post('/tutors', async (req, res) => {
//   const userId = parseInt(req.body.id);
//   console.log(`Here is the userId: ${userId}`);
//   try {
//     // Ensure the user exists first
//     const user = await prismaClient.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       throw new Error(`User with id ${userId} does not exist`);
//     }

//     // Check if this user is already a tutor
//     const existingTutor = await prismaClient.tutor.findUnique({
//       where: { tutorId: userId },
//     });

//     if (existingTutor) {
//       throw new Error(`User with id ${userId} is already a tutor`);
//     }

//     // Create the Tutor record
//     const newTutor = await prismaClient.tutor.create({
//       data: {
//         tutorId: userId,
//       },
//       include: {
//         user: true, // Optional: include user details in the response
//       },
//     });

//     console.log('Tutor created:', newTutor);
//     // Return success response
//     res.status(201).json({
//       message: 'Tutor created successfully.',
//       newTutor,
//     });

//   } catch (error) {
//     console.error('Error creating tutor:', error);
//     throw error;
//   }
// })


// // Create a new message
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

//     // Send the new message to the chat room via Socket.IO
//     io.to(chatRoomId.toString()).emit('receiveMessage', message);  // Send message to the specific room

//     res.status(201).json(message);
//   } catch (err) {
//     console.error('Error creating message:', err);
//     res.status(500).json({ error: 'Failed to send message' });
//   }
// });




// // Get all messages from a specific room
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
//             id: true,
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




// // Health check endpoint
// app.use('/health', (req, res) => {
//   res.status(200).send('OK');
// });




// // Socket Connections
// io.on("connection", (socket) => {

//   // Make functions
//   function assignTutorToStudent(tutorId: string | number, studentId: string | number) {
//     // io.to(tutorId).emit('assignedStudent', { studentId });
//     // io.to(studentId).emit('assignedTutor', { tutorId });
//   }

//   console.log("A user connected");

//   socket.on("tutor-online", async (userId: string) => {
//     console.log(`Tutor ${userId} is online`);
//     await prismaClient.tutor.update({
//       where: { tutorId: parseInt(userId) },
//       data: { online: true },
//     });
//     //  // Broadcast to all connected clients
//     // io.emit("tutor-status-updated", {
//     //   tutorId: parseInt(userId),
//     //   online: true,
//     // });
//   });


//   // Handle user joining a chat room
//   socket.on('join-room', (roomId: string) => {  // You can further type roomId if needed
//     console.log(`Socket ${socket.id} joined room ${roomId}`);
//     socket.join(roomId);  // Join the specific chat room
//   });


//   socket.on("tutor-offline", async (data: { userId: string }) => {
//     console.log(`Tutor ${data.userId} is offline`);
//     await prismaClient.tutor.update({
//       where: { tutorId: parseInt(data.userId) },
//       data: { online: false },
//     });
//   });


//   // Student requests a session
//   socket.on('tutorSessionRequest', async (studentId: string | number) => {
//     // if (availableTutors.size > 0) {
//     //   const tutors = Array.from(availableTutors);
//     //   const tutorId = tutors[Math.floor(Math.random() * tutors.length)];
//     //   availableTutors.delete(tutorId);
//     //   assignTutorToStudent(tutorId, studentId);
//     // } else {
//     //   // Use Redis queue instead of in-memory queue
//     //   await studentQueue.add('match-student', { studentId });
//     // }
//   });

//   // Tutor finishes a session
//   socket.on('tutorSessionEnd', (tutorId: string | number) => {
//     // if (studentQueue.length > 0) {
//     //   const student = studentQueue.shift();
//     //   assignTutorToStudent(tutorId, student);
//     // } else {
//     //   availableTutors.add(tutorId);
//     // }
//   });

//   // Listen for "joinedQueue" event (e.g., when a student is assigned a tutor)
//   socket.on('joinedQueue', (data) => {
//     const { studentId } = data;
//     console.log(`Student ${studentId} joined the queue`);
    
//     // Optionally, you can emit events to the client side when the student joins the queue
//     socket.emit('queueStatus', { message: 'You are in the queue. Please wait for your tutor.' });
//   });


//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
  
// });


// // Endpoint to get the status of the queue
// app.get('/queue', async (req, res) => {
//   const { waiting } = await studentQueue.getJobCounts();
//   console.log('Waiting students:', waiting);
//   res.json({ queueLength: waiting });
// });


// // Endpoint to get the status of a specific student in the queue
// app.get('/queue/:studentId', async (req, res) => {

//   const { studentId } = req.params;

//   // You can expand this to query the status from the database, etc.
//   // For now, we'll just simulate a response.
//   res.json({ studentId, status: 'Waiting for tutor' });
// });


// // Endpoint to join the student queue
// app.post('/queue/join', async (req, res) => {
//   const { studentId } = req.body;

//   if (!studentId) {
//     return res.status(400).json({ error: 'Student ID is required' });
//   }

//   console.log(`Student ${studentId} is joining the queue`);

//   // Add student to the queue in Redis
//   const job = await studentQueue.add('match-student', { studentId });

//   // const tutor = await result.data.tutor;
//   // const student = await result.data.student;
//   // console.log(`Here is the join queue result: ${tutor.id}`);

//   res.status(201).json({ success: true, message: `Student ${studentId} added to the queue` });
// });


// // Endpoint to get a tutoring session
// app.post('/queue/session', async  (req, res) => {
//   // const { studentId, tutorId } = req.body;

//   // if (!studentId || !tutorId) {
//   //   return res.status(400).json({ error: 'Both studentId and tutorId are required' });
//   // }

//   // console.log(`Student ${studentId} has been assigned to tutor ${tutorId}`);

//   // // Notify the student via socket that they've been assigned a tutor
//   // const socket = io('http://localhost:3000');
//   // socket.emit('assignedTutor', { studentId, tutorId });

//   // // Update student status in the database or perform further actions
//   // res.json({ success: true, message: `Tutor ${tutorId} assigned to student ${studentId}` });
// });

// // Endpoint to remove a student from the queue
// app.post('/queue/remove', async (req, res) => {
//   const { studentId, tutorId } = req.body;

//   if (!studentId || !tutorId) {
//     return res.status(400).json({ error: 'Student ID and Tutor ID are required' });
//   }

//   console.log(`Removing student ${studentId} from queue`);

//   // Add the remove job to the worker queue
//   await studentQueue.add('remove-student', { studentId, tutorId });

//   res.status(200).json({ success: true, message: `Student ${studentId} removal job added to queue` });
// });





// router(app, prismaClient);
// app.use(errorMiddlware(prismaClient));

// server.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
