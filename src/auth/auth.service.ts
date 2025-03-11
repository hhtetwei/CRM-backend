import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const existingUsers = await this.prisma.user.count();

    if (existingUsers === 0) {
      const hash = await argon.hash('password');
      await this.prisma.user.create({
        data: {
          email: 'admin@myhost.com',
          password: hash,
          name: 'Admin',
          role: 'ADMIN',
        },
      });
      console.log('Admin user created.');
    } else {
      console.log('Users already exist. No admin creation needed.');
    }
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new Error('Invalid credentials!');
    }

    const isValid = await argon.verify(user.password, dto.password);
    if (!isValid) {
      throw new Error('Invalid credentials!');
    }

    const token = await this.signToken(user.id, user.email, user.role);
    return { access_token: token };
  }

  private async signToken(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.config.get('JWT_SECRET');
    return await this.jwt.signAsync(payload, { expiresIn: '1d', secret });
  }
}
