import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'TEAM_LEADER')
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

  @Patch(':id')
  @Roles('ADMIN', 'TEAM_LEADER')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TEAM_LEADER')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
