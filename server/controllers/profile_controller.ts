import { EndpointBuilder, controller } from "./controller";
import { PrismaClient } from "@prisma/client";
import { Server } from "socket.io"; // Import socket.io Server type
import { getIo } from "../socket/socketManager";
import { getMinioClient } from "../minio/minio";
import { UploadedFile } from "express-fileupload";
import { Buffer } from 'buffer';

const minioClient = getMinioClient();

export const getProfilePicture: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
    const userId = req.params.userId;
    console.log('Getting profile picture for userId:', userId);
    
    if (!userId) {
        console.log('No userId provided');
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        // Get the user to find their profile image URL
        const user = await db.user.findUnique({
            where: { id: parseInt(userId) },
            select: { profileImageUrl: true }
        });

        console.log('Found user:', user);

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!user.profileImageUrl) {
            console.log('No profile image URL found for user');
            return res.status(404).json({ message: 'No profile picture found for this user.' });
        }

        console.log('Fetching image from MinIO:', user.profileImageUrl);
        
        try {
            // Get the file from MinIO
            const dataStream = await minioClient.getObject('profile', user.profileImageUrl);
            
            // Convert stream to buffer
            const chunks: Buffer[] = [];
            for await (const chunk of dataStream) {
                chunks.push(Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);
            
            // Convert to base64
            const base64Image = buffer.toString('base64');
            
            // Get the file extension to determine content type
            const fileExtension = user.profileImageUrl.split('.').pop()?.toLowerCase();
            let contentType = 'image/jpeg'; // default
            if (fileExtension === 'png') {
                contentType = 'image/png';
            } else if (fileExtension === 'gif') {
                contentType = 'image/gif';
            }
            
            // Send the base64 image data
            res.json({
                imageData: `data:${contentType};base64,${base64Image}`,
                fileName: user.profileImageUrl
            });
        } catch (minioError) {
            console.error('Error fetching from MinIO:', minioError);
            return res.status(500).json({ message: 'Failed to fetch image from storage.' });
        }

    } catch (error) {
        console.error('Error in getProfilePicture:', error);
        res.status(500).json({ message: 'Failed to fetch profile picture.' });
    }
}

export const uploadPicture: EndpointBuilder = (db: PrismaClient) => async (req, res) => {
    if (!req.files || !('file' in req.files)) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    const file = req.files.file as UploadedFile;
    const fileName = file.name;
    const fileBuffer = file.data;

    // Generate a unique file name to avoid name collisions
    const uniqueFileName = `${Date.now()}-${fileName}`;

    try {
        await minioClient.putObject(
            'profile',  // Use the correct bucket name
            uniqueFileName,
            fileBuffer,
            file.size
        );

        console.log(req.body);
        const userId = parseInt(req.body.userId);

        // Update user's profile image URL in database
        if (userId) {
            await db.user.update({
                where: { id: userId },
                data: { profileImageUrl: uniqueFileName }
            });
        }

        res.status(200).json({ 
            message: 'File uploaded successfully!', 
            fileName: uniqueFileName 
        });
    } catch (error) {
        console.error('MinIO upload failed:', error);
        res.status(500).json({ message: 'Failed to upload file to MinIO.' });
    }
}

export const ProfileController = controller([
    { method: "get", path: "/picture/:userId", builder: getProfilePicture },
    { method: "post", path: "/upload", builder: uploadPicture }
]);