import { Repository } from './repository';

export class UsersRepository extends Repository {
  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: {
        contextRoles: {
          where: { contextId: null },
          include: { role: true },
        },
      },
    });
  }

  async createUser(email: string, firstName: string, lastName: string, passwordHash: string) {
    return this.db.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
      },
    });
  }
}