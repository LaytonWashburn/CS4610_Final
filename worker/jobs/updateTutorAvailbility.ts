import { PrismaClient } from "@prisma/client";

// Function to update tutor availability (e.g., after finishing a session)
export async function updateTutorAvailability(tutorId: number, available: boolean, db: PrismaClient) {
    try {
      await db.tutor.update({
        where: { id: tutorId },
        data: { available },
      });
      console.log(`Tutor ${tutorId} availability updated to ${available ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error updating tutor availability:', error);
    }
}