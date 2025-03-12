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
import { LeadsService } from './leads.service';
import { CreateLeadDto } from 'src/dto';
import { JwtGuard } from 'src/guards';
import { Roles } from 'src/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/guards/roles.guards';

@Controller('leads')
@UseGuards(JwtGuard, RolesGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SALES_REP) // Only Admins and Sales Reps can create leads
  createLead(@Body() dto: CreateLeadDto, @Request() req) {
    return this.leadsService.createLead(dto, req.user.id, req.user.role);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP) // All roles can access, but data is filtered
  getLeads(@Query('search') search: string, @Request() req) {
    return this.leadsService.getLeads(req.user.id, req.user.role, search);
  }

  @Get('status-percentages')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP)
  async getLeadStatusPercentages(@Request() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.leadsService.getLeadStatusPercentages(userId, userRole);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.SALES_REP) // All roles can access, but data is filtered
  getLeadById(@Param('id') id: string, @Request() req) {
    return this.leadsService.getLeadById(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES_REP) // Only Admins and Sales Reps can update leads
  updateLead(
    @Param('id') id: string,
    @Body() dto: CreateLeadDto,
    @Request() req,
  ) {
    return this.leadsService.updateLead(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SALES_REP) // Only Admins and Sales Reps can delete leads
  removeLead(@Param('id') id: string, @Request() req) {
    return this.leadsService.removeLead(id, req.user.id, req.user.role);
  }
}
