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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  KnowledgeBaseService,
  CreateArticleDto,
  UpdateArticleDto,
} from './knowledge-base.service';
import { ArticleCategory, ArticleStatus } from '@prisma/client';

@Controller('knowledge-base')
@UseGuards(AuthGuard('jwt'))
export class KnowledgeBaseController {
  constructor(private service: KnowledgeBaseService) {}

  @Get()
  findAll(
    @Query('category') category?: ArticleCategory,
    @Query('productId') productId?: string,
    @Query('status') status?: ArticleStatus,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ category, productId, status, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
