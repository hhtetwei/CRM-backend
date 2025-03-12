import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DealStage, Prisma, Role } from '@prisma/client';
import { CreateDealDto, UpdateDealDto } from 'src/dto/deals.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationsService,
  ) {}

  private async filterDealsByRole(userId: number, userRole: Role) {
    switch (userRole) {
      case Role.ADMIN:
        return this.prisma.deal.findMany();
      case Role.SALES_MANAGER:
        return this.prisma.deal.findMany({
          where: {
            owner: {
              role: Role.SALES_REP, // Sales Managers can see deals of their team (Sales Reps)
            },
          },
        });
      case Role.SALES_REP:
        return this.prisma.deal.findMany({
          where: {
            ownerId: userId, // Sales Reps can only see their own deals
          },
        });
      default:
        throw new ForbiddenException(
          'You do not have permission to view deals.',
        );
    }
  }

  async createDeals(dto: CreateDealDto, userId: number, userRole: Role) {
    if (userRole !== Role.ADMIN && dto.ownerId && dto.ownerId !== userId) {
      throw new ForbiddenException('You can only create deals for yourself.');
    }

    const ownerId = dto.ownerId ?? userId;

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
        dealValue,
        forecastValue,
        expectedCloseDate: dto.expectedCloseDate,
        closeProbability,
        stage: dto.stage,
        ownerId,
      },
    });

    return deal;
  }

  async getDealStagePercentages(userId: number, userRole: Role) {
    const deals = await this.filterDealsByRole(userId, userRole);

    if (deals.length === 0) {
      console.log('No deals found for the user.');
      return [];
    }

    const stageCounts = deals.reduce(
      (acc, deal) => {
        const stage = deal.stage;
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      },
      {} as Record<DealStage, number>,
    );

    const totalDeals = deals.length;

    const stagePercentages = Object.entries(stageCounts).map(
      ([stage, count]) => ({
        stage,
        percentage: Math.round((count / totalDeals) * 100),
      }),
    );

    return stagePercentages;
  }

  async getDeals(userId: number, userRole: Role, search?: string) {
    let deals;

    if (search) {
      deals = await this.prisma.deal.findMany({
        where: {
          AND: [
            {
              OR: [
                search
                  ? { name: { contains: search, mode: 'insensitive' } }
                  : {},
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
      deals = await this.filterDealsByRole(userId, userRole);
    }

    return { data: deals };
  }

  async getDeal(id: string, userId: number, userRole: Role) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!deal) throw new NotFoundException('Deal not found');

    if (
      userRole !== Role.ADMIN &&
      userRole === Role.SALES_REP &&
      deal.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this deal.',
      );
    }

    return deal;
  }

  async updateDeal(
    id: string,
    dto: UpdateDealDto,
    userId: number,
    userRole: Role,
  ) {
    const existingDeal = await this.prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) throw new NotFoundException('Deal not found');

    if (
      userRole !== Role.ADMIN &&
      userRole === Role.SALES_REP &&
      existingDeal.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this deal.',
      );
    }

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

  async removeDeal(id: string, userId: number, userRole: Role) {
    const existingDeal = await this.prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) throw new NotFoundException('Deal not found');

    if (
      userRole !== Role.ADMIN &&
      userRole === Role.SALES_REP &&
      existingDeal.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this deal.',
      );
    }

    return this.prisma.deal.delete({ where: { id } });
  }

  async getMonthlyForecast(userId: number, userRole: Role) {
    let whereClause = '';

    switch (userRole) {
      case Role.ADMIN:
        whereClause = '';
        break;
      case Role.SALES_MANAGER:
        whereClause = `WHERE "ownerId" IN (SELECT id FROM "User" WHERE role = '${Role.SALES_REP}')`;
        break;
      case Role.SALES_REP:
        whereClause = `WHERE "ownerId" = ${userId}`;
        break;
      default:
        throw new ForbiddenException(
          'You do not have permission to view the monthly forecast.',
        );
    }

    return this.prisma.$queryRaw<
      {
        month: string;
        totalForecastValue: number;
      }[]
    >(Prisma.sql`
      SELECT 
        TO_CHAR("expectedCloseDate", 'Month') AS month,
        SUM("forecastValue") AS "totalForecastValue"
      FROM "Deal"
      ${Prisma.raw(whereClause)}
      GROUP BY month
      ORDER BY MIN("expectedCloseDate")
    `);
  }
}
