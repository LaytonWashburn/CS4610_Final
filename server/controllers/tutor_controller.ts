import { EndpointBuilder, controller } from "./controller";
import { PrismaClient } from "@prisma/client";

export const getTutors: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  try {
    const tutors = await db.user.findMany({
      where: { tutor: { isNot: null } },
    });
    res.json({ tutors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get tutors.' });
  }
};

export const addTutor: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  const userId = parseInt(req.body.id);
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const existingTutor = await db.tutor.findUnique({ where: { tutorId: userId } });
    if (existingTutor) throw new Error('User is already a tutor');

    const newTutor = await db.tutor.create({ data: { tutorId: userId } });
    res.status(201).json({ message: 'Tutor added successfully.', newTutor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add tutor.', details: error });
  }
};

export const getOnlineTutors: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  try {
    const onlineTutorsCount = await db.tutor.count({ where: { online: true } });
    res.json({ onlineTutors: onlineTutorsCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get online tutors.' });
  }
};

export const TutorController = controller([
  { method: "get", path: "/tutors", builder: getTutors },
  { method: "post", path: "/tutors", builder: addTutor },
  { method: "get", path: "/online", builder: getOnlineTutors }
]);

