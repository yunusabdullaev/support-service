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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  BugsService,
  CreateBugDto,
  UpdateBugDto,
  CreateCommentDto,
} from './bugs.service';
import { BugPriority, BugStatus } from '@prisma/client';
import { Multer } from 'multer';

@Controller('bugs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BugsController {
  constructor(private bugsService: BugsService) {}

  @Get()
  findAll(
    @Query('status') status?: BugStatus,
    @Query('productId') productId?: string,
    @Query('priority') priority?: BugPriority,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.bugsService.findAll({ status, productId, priority, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bugsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBugDto, @CurrentUser() user: any) {
    return this.bugsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEAM_LEADER', 'DEVELOPER')
  update(@Param('id') id: string, @Body() dto: UpdateBugDto) {
    return this.bugsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TEAM_LEADER')
  remove(@Param('id') id: string) {
    return this.bugsService.remove(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.addComment(id, user.id, dto);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  addAttachment(@Param('id') id: string, @UploadedFile() file: any) {
    return this.bugsService.addAttachment(id, file);
  }
}
