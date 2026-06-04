import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ImprovementsService,
  CreateImprovementDto,
  UpdateImprovementDto,
} from './improvements.service';
import { ImprovementStatus } from '@prisma/client';

@Controller('improvements')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ImprovementsController {
  constructor(private service: ImprovementsService) {}

  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('status') status?: ImprovementStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({ productId, status, from, to });
  }

  @Get('export/excel')
  @Roles('ADMIN', 'TEAM_LEADER')
  async exportExcel(
    @Res() res: Response,
    @Query('productId') productId?: string,
    @Query('status') status?: ImprovementStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const buffer = await this.service.exportExcel({ productId, status, from, to });
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=improvements-report.xlsx',
    );
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateImprovementDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEAM_LEADER', 'DEVELOPER')
  update(@Param('id') id: string, @Body() dto: UpdateImprovementDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/upvote')
  upvote(@Param('id') id: string) {
    return this.service.upvote(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
