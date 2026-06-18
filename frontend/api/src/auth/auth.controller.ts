import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(@CurrentUser() user: any, @Body() body: { phone: string }) {
    return this.authService.updateProfile(user.id, body.phone);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }
}
