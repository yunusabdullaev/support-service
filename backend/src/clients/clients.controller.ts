import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Response } from 'express';
import {
  ClientsService,
  CreateClientDto,
  UpdateClientDto,
} from './clients.service';

@Controller('clients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    return this.service.findAll(search, from, to, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClientDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user: any,
  ) {
    return this.service.addComment(id, user.id, text);
  }

  @Delete(':id/comments/:commentId')
  deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteComment(commentId, user.id);
  }

  @Get('export/excel')
  @Roles('ADMIN', 'TEAM_LEADER')
  async exportExcel(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    const buffer = await this.service.exportExcel(search, from, to, productId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=clients-report.xlsx',
    );
    res.send(buffer);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
