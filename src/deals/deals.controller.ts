import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto } from 'src/dto/deals.dto';
import { JwtGuard } from 'src/guards';

import { Role } from '@prisma/client';
import { RolesGuard } from 'src/guards/roles.guards';
import { Roles } from 'src/decorators/roles.decorators';

@Controller('deals')
@UseGuards(JwtGuard, RolesGuard)
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SALES_REP)
  createDeals(@Body() dto: CreateDealDto, @Request() req) {
    return this.dealsService.createDeals(dto, req.user.id, req.user.role);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  getDeals(@Query('search') search: string, @Request() req) {
    return this.dealsService.getDeals(req.user.id, req.user.role, search);
  }

  @Get('forecast')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  async getForecast(@Request() req) {
    return this.dealsService.getMonthlyForecast(req.user.id, req.user.role);
  }
  @Get('stage-percentages')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  async getDealStagePercentages(@Request() req) {
    return this.dealsService.getDealStagePercentages(
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  getDeal(@Param('id') id: string, @Request() req) {
    return this.dealsService.getDeal(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES_REP)
  updateDeal(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @Request() req,
  ) {
    return this.dealsService.updateDeal(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SALES_REP) // Only Admins and Sales Reps can delete deals
  removeDeal(@Param('id') id: string, @Request() req) {
    return this.dealsService.removeDeal(id, req.user.id, req.user.role);
  }
}
