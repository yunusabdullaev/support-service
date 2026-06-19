import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';

export enum ShiftType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export class CreateShiftDto {
  @IsDateString()
  date: string;

  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  note?: string;
}
