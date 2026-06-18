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
  update(@Param('id') id: string, @Body() dto: UpdateBugDto, @CurrentUser() user: any) {
    return this.bugsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bugsService.remove(id, user.id, user.role);
  }

  @Post(':id/upvote')
  upvote(@Param('id') id: string, @Body('phone') phone: string) {
    return this.bugsService.upvote(id, phone || '');
  }

  @Post(':id/downvote')
  downvote(@Param('id') id: string) {
    return this.bugsService.downvote(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.addComment(id, user.id, dto);
  }

  @Patch(':id/comments/:commentId')
  updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.updateComment(commentId, user.id, dto);
  }

  @Delete(':id/comments/:commentId')
  deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.deleteComment(commentId, user.id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  addAttachment(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.addAttachment(id, user.id, file);
  }

  @Delete(':id/attachments/:attachmentId')
  deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.bugsService.deleteAttachment(attachmentId);
  }
}
