import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'TEAM_LEADER', 'OPERATOR')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEAM_LEADER')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'TEAM_LEADER')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch('me/contacts')
  @Roles('ADMIN', 'TEAM_LEADER', 'OPERATOR')
  updateMyContacts(
    @CurrentUser() user: any,
    @Body() body: { personalPhone?: string; corporatePhone?: string; personalTelegram?: string; corporateTelegram?: string },
  ) {
    return this.usersService.update(user.sub, {
      personalPhone: body.personalPhone,
      corporatePhone: body.corporatePhone,
      personalTelegram: body.personalTelegram,
      corporateTelegram: body.corporateTelegram,
    });
  }

  @Patch(':id')
  @Roles('ADMIN', 'TEAM_LEADER', 'OPERATOR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    // OPERATOR faqat o'zini tahrirlaydi
    if (user.role === 'OPERATOR' && user.sub !== id) {
      throw new ForbiddenException('Siz faqat o\'z ma\'lumotlaringizni tahrirlashingiz mumkin');
    }
    // OPERATOR faqat kontakt ma'lumotlarini o'zgartirishi mumkin
    if (user.role === 'OPERATOR') {
      const allowed: UpdateUserDto = {
        personalPhone: dto.personalPhone,
        corporatePhone: dto.corporatePhone,
        personalTelegram: dto.personalTelegram,
        corporateTelegram: dto.corporateTelegram,
      };
      return this.usersService.update(id, allowed);
    }
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TEAM_LEADER')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/phone')
  @Roles('ADMIN', 'TEAM_LEADER')
  assignPhone(
    @Param('id') id: string,
    @Body() body: { phone: string; telegramChatId?: string },
  ) {
    return this.usersService.assignPhone(id, body.phone, body.telegramChatId);
  }
}
