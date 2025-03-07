import { Injectable, NotFoundException } from '@nestjs/common';
import { DealStage } from '@prisma/client';
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
    const closeProbability =
      dto.stage === DealStage.CLOSED_WON ? 100 : (dto.closeProbability ?? 0);

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

  //need to fix i do not know how to do this anymore TT
  async getMonthlyForecast() {
    const result = await this.prisma.$queryRaw<
      { month: string; totalForecastRevenue: bigint; dealCount: bigint }[]
    >`
      SELECT 
        TO_CHAR("expectedCloseDate", 'YYYY-MM') AS month,
        COALESCE(SUM("forecastValue"), 0) AS totalForecastRevenue,
        COUNT(*) AS dealCount
      FROM "Deal"
      WHERE "expectedCloseDate" IS NOT NULL
      GROUP BY month
      ORDER BY month ASC;
    `;

    // Convert BigInt to Number
    return result.map((row) => ({
      month: row.month,
      totalForecastRevenue: Number(row.totalForecastRevenue), // Convert BigInt
      dealCount: Number(row.dealCount), // Convert BigInt
    }));
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

    console.log(deals);

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
