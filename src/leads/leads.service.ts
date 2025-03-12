import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus, Role } from '@prisma/client';
import { CreateLeadDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  private async filterLeadsByRole(userId: number, userRole: Role) {
    switch (userRole) {
      case Role.ADMIN:
        return this.prisma.lead.findMany();
      case Role.SALES_MANAGER:
        return this.prisma.lead.findMany({
          where: {
            owner: {
              role: Role.SALES_REP, // Sales Managers can see leads of their team (Sales Reps)
            },
          },
        });
      case Role.SALES_REP:
        return this.prisma.lead.findMany({
          where: {
            ownerId: userId, // Sales Reps can only see their own leads
          },
        });
      default:
        throw new ForbiddenException(
          'You do not have permission to view leads.',
        );
    }
  }

  async createLead(dto: CreateLeadDto, userId: number, userRole: Role) {
    if (userRole !== Role.ADMIN && dto.ownerId && dto.ownerId !== userId) {
      throw new ForbiddenException('You can only create leads for yourself.');
    }

    const ownerId = dto.ownerId ?? userId;

    return this.prisma.lead.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  async getLeads(userId: number, userRole: Role, search?: string) {
    let leads;

    if (search) {
      leads = await this.prisma.lead.findMany({
        where: {
          AND: [
            {
              OR: [
                search
                  ? { name: { contains: search, mode: 'insensitive' } }
                  : {},
                search
                  ? { email: { contains: search, mode: 'insensitive' } }
                  : {},
                search
                  ? { phone: { contains: search, mode: 'insensitive' } }
                  : {},
                search
                  ? { company: { contains: search, mode: 'insensitive' } }
                  : {},
                search
                  ? {
                      status: {
                        in: Object.values(LeadStatus).filter((s) =>
                          s.toLowerCase().includes(search.toLowerCase()),
                        ) as LeadStatus[],
                      },
                    }
                  : {},
              ],
            },
            userRole === Role.ADMIN
              ? {}
              : userRole === Role.SALES_MANAGER
                ? { owner: { role: Role.SALES_REP } }
                : { ownerId: userId },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      leads = await this.filterLeadsByRole(userId, userRole);
    }

    return { data: leads };
  }

  async getLeadById(id: string, userId: number, userRole: Role) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    if (
      userRole !== Role.ADMIN &&
      userRole === Role.SALES_REP &&
      lead.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this lead.',
      );
    }

    return lead;
  }

  async updateLead(
    id: string,
    dto: CreateLeadDto,
    userId: number,
    userRole: Role,
  ) {
    const existingLead = await this.prisma.lead.findUnique({ where: { id } });
    if (!existingLead) throw new NotFoundException('Lead not found');

    if (
      userRole !== Role.ADMIN &&
      userRole === Role.SALES_REP &&
      existingLead.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this lead.',
      );
    }

    return this.prisma.lead.update({
      where: { id },
      data: dto,
    });
  }

  async removeLead(id: string, userId: number, userRole: Role) {
    const existingLead = await this.prisma.lead.findUnique({ where: { id } });
    if (!existingLead) throw new NotFoundException('Lead not found');

    if (
      userRole !== Role.ADMIN &&
      userRole === Role.SALES_REP &&
      existingLead.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this lead.',
      );
    }

    return this.prisma.lead.delete({ where: { id } });
  }
}
