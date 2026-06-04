import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  IncidentsService,
  CreateIncidentDto,
  UpdateIncidentDto,
  ResolveIncidentDto,
} from './incidents.service';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

@Controller('incidents')
@UseGuards(AuthGuard('jwt'))
export class IncidentsController {
  constructor(private service: IncidentsService) {}

  @Get()
  findAll(
    @Query('status') status?: IncidentStatus,
    @Query('severity') severity?: IncidentSeverity,
  ) {
    return this.service.findAll({ status, severity });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIncidentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveIncidentDto) {
    return this.service.resolve(id, dto);
  }
}
