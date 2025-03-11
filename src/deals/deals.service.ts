import { Injectable, NotFoundException } from '@nestjs/common';
import { DealStage, Prisma } from '@prisma/client';
import { CreateDealDto, UpdateDealDto } from 'src/dto/deals.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService,
  ) {}

  async createDeals(dto: CreateDealDto, user: number) {
    let closeProbability: number;

    switch (dto.stage) {
      case DealStage.PROPOSAL_SENT:
        closeProbability = 30;
        break;
      case DealStage.NEGOTIATION:
        closeProbability = 50;
        break;
      case DealStage.CLOSED_WON:
        closeProbability = 100;
        break;
      case DealStage.CLOSED_LOST:
        closeProbability = 0;
        break;
      default:
        closeProbability = dto.closeProbability ?? 0;
    }

    const dealValue = dto.dealValue ?? 0;
    const forecastValue = dealValue * (closeProbability / 100);

    const deal = await this.prisma.deal.create({
      data: {
        name: dto.name,
        amount: dto.amount,
        dealValue,
        forecastValue,
        expectedCloseDate: dto.expectedCloseDate,
        closeProbability,
        stage: dto.stage,
        ownerId: dto.ownerId,
      },
    });

    this.notificationService.sendNotification(
      user,
      `A new deal "${deal.name}" has been created.`,
      'DEAL_CREATED',
    );

    return deal;
  }

  async getDeals(search?: string) {
    let deals;

    if (search) {
      deals = await this.prisma.deal.findMany({
        where: {
          OR: [
            search ? { name: { contains: search, mode: 'insensitive' } } : {},
            search
              ? {
                  stage: {
                    in: Object.values(DealStage).filter((s) =>
                      s.toLowerCase().includes(search.toLowerCase()),
                    ) as DealStage[],
                  },
                }
              : {},
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      deals = await this.prisma.deal.findMany({
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

    return { data: deals };
  }

  async getDeal(id: string) {
    return this.prisma.deal.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        amount: true,
        dealValue: true,
        forecastValue: true,
        expectedCloseDate: true,
        closeProbability: true,
        stage: true,
        ownerId: true,
      },
    });
  }

  async updateDeal(id: string, dto: UpdateDealDto) {
    const existingDeal = await this.prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) throw new NotFoundException('Deal not found');

    const closeProbability =
      dto.stage === DealStage.CLOSED_WON
        ? 100
        : (dto.closeProbability ?? existingDeal.closeProbability);

    const forecastValue =
      (dto.dealValue ?? existingDeal.dealValue) * (closeProbability / 100);

    return this.prisma.deal.update({
      where: { id },
      data: {
        ...dto,
        closeProbability,
        forecastValue,
      },
    });
  }

  async removeDeal(id: string) {
    return this.prisma.deal.delete({
      where: {
        id,
      },
    });
  }

  async getActiveDeals() {
    return this.prisma.deal.findMany({
      where: {
        stage: { in: [DealStage.NEGOTIATION, DealStage.PROPOSAL_SENT] },
      },
    });
  }

  async getForecastValues(type: 'monthly' | 'yearly') {
    const startDate = new Date();
    startDate.setFullYear(
      startDate.getFullYear() - (type === 'yearly' ? 11 : 1),
    );

    console.log('Start Date:', startDate); // Debugging log

    // Fetch the data
    const data = await this.prisma.deal.findMany({
      where: {
        expectedCloseDate: { gte: startDate },
      },
      select: {
        expectedCloseDate: true,
        forecastValue: true,
      },
    });

    console.log('Fetched Data:', data); // Debugging log

    const groupedData: Record<string, number[]> = {};

    // Group data by month or year and push forecast values into an array
    data.forEach(({ expectedCloseDate, forecastValue }) => {
      const key =
        type === 'monthly'
          ? expectedCloseDate.toISOString().slice(0, 7) // 'YYYY-MM'
          : expectedCloseDate.getFullYear().toString(); // 'YYYY'

      console.log('Grouping Key:', key); // Debugging log

      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(forecastValue);
    });

    console.log('Grouped Data:', groupedData); // Debugging log

    const result: { label: string; values: number[] }[] = [];

    // Prepare the final result with labels and values arrays
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (type === 'monthly' ? i : i * 12));

      const key =
        type === 'monthly'
          ? date.toISOString().slice(0, 7)
          : date.getFullYear().toString();

      const label =
        type === 'monthly'
          ? date.toLocaleString('default', { month: 'short' }) // "Jan", "Feb", etc.
          : date.getFullYear().toString(); // "2024", "2025", etc.

      console.log('Checking Label and Key:', label, key); // Debugging log

      result.unshift({
        label,
        values: groupedData[key] || [], // Push an empty array if no forecast value for the period
      });
    }

    console.log('Final Result:', result); // Debugging log
    return result;
  }

  async getDealStageDistribution() {
    return this.prisma.deal.groupBy({
      by: ['stage'],
      _count: { _all: true },
    });
  }

  async getCloseWons() {
    return this.prisma.deal.findMany({
      where: { stage: DealStage.CLOSED_WON },
    });
  }

  async getPipeline() {
    const deals = await this.prisma.deal.findMany({
      select: {
        id: true,
        name: true,
        stage: true,
        expectedCloseDate: true,
        forecastValue: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const pipeline = {
      NEGOTIATION: [],
      PROPOSAL_SENT: [],
      CLOSED_WON: [],
      CLOSED_LOST: [],
    };

    // Populate the pipeline categories
    for (const deal of deals) {
      pipeline[deal.stage].push(deal);
    }

    return pipeline;
  }
}
