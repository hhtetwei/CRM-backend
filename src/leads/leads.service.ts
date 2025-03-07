import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { CreateLeadDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async createLead(dto: CreateLeadDto, ownerId: number) {
    return this.prisma.lead.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  async getLeads(search?: string) {
    if (search) {
      return this.prisma.lead.findMany({
        where: {
          OR: [
            search ? { name: { contains: search, mode: 'insensitive' } } : {},
            search ? { email: { contains: search, mode: 'insensitive' } } : {},
            search ? { phone: { contains: search, mode: 'insensitive' } } : {},
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
      });
    } else {
      return this.prisma.lead.findMany({
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
  }

  async getLeadById(id: string) {
    return this.prisma.lead.findUnique({
      where: {
        id,
      },
    });
  }

  async updateLead(id: string, dto: CreateLeadDto) {
    return this.prisma.lead.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async removeLead(id: string): Promise<void> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('The lead does not exist anymore');
    }

    await this.prisma.lead.delete({
      where: { id },
    });

    return;
  }
}
