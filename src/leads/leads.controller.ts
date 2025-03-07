import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from 'src/dto';
import { JwtGuard } from 'src/guards';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @UseGuards(JwtGuard)
  @Post()
  createLead(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    return this.leadsService.createLead(createLeadDto, req.user.id);
  }

  @Get()
  getLeads(@Query('search') search?: string) {
    return this.leadsService.getLeads(search);
  }

  @Get(':id')
  getLeadById(@Param('id') id: string) {
    return this.leadsService.getLeadById(id);
  }

  @Put(':id')
  updateLead(@Param('id') id: string, @Body() updateLeadDto: CreateLeadDto) {
    return this.leadsService.updateLead(id, updateLeadDto);
  }

  @Delete(':id')
  removeLead(@Param('id') id: string) {
    return this.leadsService.removeLead(id);
  }
}
