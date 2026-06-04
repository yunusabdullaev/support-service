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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  DifficultiesService,
  CreateDifficultyDto,
  UpdateDifficultyDto,
} from './difficulties.service';
import { DifficultyStatus } from '@prisma/client';

@Controller('difficulties')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DifficultiesController {
  constructor(private service: DifficultiesService) {}

  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('status') status?: DifficultyStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({ productId, status, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDifficultyDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEAM_LEADER', 'DEVELOPER')
  update(@Param('id') id: string, @Body() dto: UpdateDifficultyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TEAM_LEADER')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
