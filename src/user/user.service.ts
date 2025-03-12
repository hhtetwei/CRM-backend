import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as argon from 'argon2';
import { userDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: userDto) {
    try {
      const hashedPassword = await argon.hash('password');

      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: dto.role,
        },
        select: { id: true, email: true, name: true, role: true },
      });
      console.log(user);
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email is already in use');
      }
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async getUsers() {
    return await this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: userDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          role: dto.role,
        },
        select: { id: true, email: true, name: true, role: true },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email is already in use');
      }
      throw new InternalServerErrorException('Error updating user');
    }
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
