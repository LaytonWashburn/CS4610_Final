import { ContextRole, PrismaClient, Role, RoleKey } from "@prisma/client";

export const ROLES_MAP: Record<string, RoleKey> = {
  site_admin: RoleKey.SITE_ADMIN,
  site_author: RoleKey.SITE_USER,
}

export const roleStringToKey = (role: string|RoleKey) => {
  const roleKey = ROLES_MAP[role];
  if (roleKey) {
    return roleKey
  }

  return role as RoleKey;
}

export async function userHasRoleInContext(db: PrismaClient, userId: number, roleKeyOrString: string|RoleKey, contextId?: string) {
  const roleKey = roleStringToKey(roleKeyOrString);
  if (!roleKey || roleKey.startsWith("http")) return false;

  const role = await db.role.findFirst({
    where: {
      roleKey
    }
  });
  if (!role) return false;

  const contextRole = await db.contextRole.findFirst({
    where: {
      userId,
      roleId: role.id,
      contextId
    }
  });
  return !!contextRole;
}

export async function addUserToRoleInContext(db: PrismaClient, userId: number, roleKeyOrString: string|RoleKey, contextId?: string): Promise<ContextRole | null> {
  if (!await userHasRoleInContext(db, userId, roleKeyOrString, contextId)) {

    const roleKey = roleStringToKey(roleKeyOrString);
    if (!roleKey || roleKey.startsWith("http")) return null;

    const role = await db.role.findUnique({
      where: {
        roleKey
      }
    }) as Role;

    return db.contextRole.create({
      data: {
        userId,
        roleId: role.id,
        contextId,
      }
    });
  }
  return null;
}
// Permissions can be in the form an array, if the user has one of the permissions then they can perform the action.
// Example:
// export const READ_COURSE_PERMISSION = [
//   RoleKey.CONTEXT_ADMINISTRATOR,
//   RoleKey.CONTEXT_CONTENT_DEVELOPER,
//   RoleKey.CONTEXT_INSTRUCTOR,
//   RoleKey.CONTEXT_LEARNER,
//   RoleKey.CONTEXT_MANAGER,
//   RoleKey.CONTEXT_MEMBER,
//   RoleKey.CONTEXT_MENTOR,
//   RoleKey.CONTEXT_OFFICE,
// ];

// export const UPDATE_COURSE_PERMISSION = [
//   RoleKey.CONTEXT_ADMINISTRATOR,
//   RoleKey.CONTEXT_CONTENT_DEVELOPER,
//   RoleKey.CONTEXT_INSTRUCTOR
// ]
