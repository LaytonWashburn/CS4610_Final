import { EndpointBuilder, controller } from "./controller";
import { PrismaClient } from "@prisma/client";
import { getMinioClient } from "../minio/minio";
import { Buffer } from 'buffer';

const minioClient = getMinioClient();

export const getTutorById: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  console.log(req.params);
  console.log(`TutorId ${req.params.id}`);

  const id = parseInt(req.params.id);

  console.log(`TutorId ${id}`);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid tutor ID.' });
  }

  try {
    const tutor = await db.tutor.findUnique({
      where: { id: id },
      include: { user: true },
    });

    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found.' });
    }

    res.json({ tutor });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get tutor.' });
  }
};


export const getTutors: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
  try {
    const tutors = await db.tutor.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true
          }
        }
      }
    });

    // Transform the data to match the expected format
    const formattedTutors = tutors.map((tutor: { 
      tutorId: number; 
      online: boolean; 
      user: { 
        id: number;
        firstName: string; 
        lastName: string; 
        email: string; 
        profileImageUrl: string | null; 
      }; 
    }) => ({
      id: tutor.tutorId,
      firstName: tutor.user.firstName,
      lastName: tutor.user.lastName,
      email: tutor.user.email,
      online: tutor.online,
      profilePicture: tutor.user.profileImageUrl
    }));

    res.json({ tutors: formattedTutors });
  } catch (err) {
    console.error("Error fetching tutors:", err);
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
  { method: "get", path: "/tutors/:id", builder: getTutorById },
  { method: "get", path: "/tutors", builder: getTutors },
  { method: "post", path: "/tutors", builder: addTutor },
  { method: "get", path: "/online", builder: getOnlineTutors }
]);

