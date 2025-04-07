import { PrismaClient, RoleKey} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
import { config } from "dotenv";
config();


async function main() {
  console.log("RUNNING SEEDS");

  // CREATE ROLES
  for (const roleKey in RoleKey) {
    await prisma.role.upsert({
      where: { roleKey: roleKey as RoleKey },
      update: {},
      create: {
        roleKey: roleKey as RoleKey,
      }
    });
  }

  const adminRole = await prisma.role.findUnique({
    where: { roleKey: RoleKey.SITE_ADMIN }
  });

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 10);

  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: {
      passwordHash,
    },
    create: {
      email: process.env.ADMIN_EMAIL as string,
      firstName: 'ADMIN',
      lastName: 'SITE',
      passwordHash,
      contextRoles: {
        create: {
          roleId: adminRole!!.id,
        }
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })