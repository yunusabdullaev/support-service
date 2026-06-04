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
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  DialogReviewsService,
  CreateDialogReviewDto,
  UpdateDialogReviewDto,
} from './dialog-reviews.service';
import { DialogReviewStatus } from '@prisma/client';

@Controller('dialog-reviews')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'TEAM_LEADER')
export class DialogReviewsController {
  constructor(private service: DialogReviewsService) {}

  @Get()
  findAll(
    @Query('operatorId') operatorId?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: DialogReviewStatus,
  ) {
    return this.service.findAll({ operatorId, productId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDialogReviewDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDialogReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
