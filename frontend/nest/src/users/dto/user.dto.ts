import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  personalPhone?: string;

  @IsString()
  @IsOptional()
  corporatePhone?: string;

  @IsString()
  @IsOptional()
  personalTelegram?: string;

  @IsString()
  @IsOptional()
  corporateTelegram?: string;
}
