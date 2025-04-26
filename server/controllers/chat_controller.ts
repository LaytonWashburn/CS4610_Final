import { EndpointBuilder, controller } from "./controller";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io"; // Import socket.io Server type
import { getIo } from "../socket/socketManager";

export const getChatRooms: EndpointBuilder = (db: PrismaClient) => async (req, res) => {

  try {
    console.log("Getting the chat rooms");
    const chatRooms = await db.chatRoom.findMany();
    res.json({ chatRooms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get chats.' });
  }
};

export const createChatRoom: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { name } = req.body;
  console.log("I hit the create Chat Room endpoint in the chat controller");
  try {
    const chatRoom = await db.chatRoom.create({
      data: { name }
    });
    res.status(201).json({ message: 'Chat room created successfully.', chatRoom });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat room.', details: error });
  }
};

export const deleteChatRoom: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const chatRoomId = parseInt(req.params.id);
  try {
    await db.chatRoom.delete({ where: { id: chatRoomId } });
    res.status(200).json({ message: 'Chat room deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat room.', details: error });
  }
};

export const createMessage: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const { content, chatRoomId, senderId } = req.body;
  try {
    const message = await db.message.create({
      data: { content, chatRoomId, senderId },
      include: { sender: true }
    });

    const io: Server = getIo();

    // Broadcast the message to the specific chat room
    io.to(chatRoomId.toString()).emit('receiveMessage', message);  // Emit message to the chat room

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create message.', details: error });
  }
};


export const getMessages: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const chatRoomId = parseInt(req.params.chatRoomId);

  if (isNaN(chatRoomId)) {
    return res.status(400).json({ error: "Invalid chat room ID" });
  }

  try {
    const messages = await db.message.findMany({
      where: { chatRoomId },
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
};

export const ChatController =  controller([
  { method: "get", path: "/chats", builder: getChatRooms },
  { method: "post", path: "/create", builder: createChatRoom },
  { method: "delete", path: "/delete/:id", builder: deleteChatRoom },
  { method: "post", path: "/messages", builder: createMessage },
  { method: "get", path: "/messages/:chatRoomId", builder: getMessages }
]);
