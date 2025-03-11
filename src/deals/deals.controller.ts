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

@Controller('deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @UseGuards(JwtGuard)
  @Post()
  createDeals(@Body() dto: CreateDealDto, @Request() req) {
    return this.dealsService.createDeals(dto, req.user.id);
  }

  @Get()
  getDeals(@Query('search') search?: string) {
    return this.dealsService.getDeals(search);
  }

  @Get('forecast')
  async getForecast(@Query('type') type: 'monthly' | 'yearly') {
    return this.dealsService.getForecastValues(type);
  }

  @Get('pipeline')
  getPipeline() {
    return this.dealsService.getPipeline();
  }

  @Get('/deal-stage-distribution')
  getDealStageDistribution() {
    return this.dealsService.getDealStageDistribution();
  }

  @Get(':id')
  getDeal(@Param('id') id: string) {
    return this.dealsService.getDeal(id);
  }

  @Get('active')
  getActiveDeals() {
    return this.dealsService.getActiveDeals();
  }

  @Get('closed-won')
  getCloseWons() {
    return this.dealsService.getCloseWons();
  }

  @Patch(':id')
  updateDeal(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.dealsService.updateDeal(id, dto);
  }

  @Delete(':id')
  removeDeal(@Param('id') id: string) {
    return this.dealsService.removeDeal(id);
  }
}
