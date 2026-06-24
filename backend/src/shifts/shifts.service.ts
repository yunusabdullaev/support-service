import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService,
  ) {}

  async findByRange(from: string, to: string) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    return this.prisma.shiftAssignment.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { shiftType: 'asc' }],
    });
  }

  async create(dto: CreateShiftDto) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    const shift = await this.prisma.shiftAssignment.create({
      data: {
        date,
        shiftType: dto.shiftType,
        userId: dto.userId,
        note: dto.note || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    // Telegram xabar (fire-and-forget)
    this.telegramService.sendShiftAssigned({
      userName: shift.user?.fullName || 'Noma\'lum',
      date: date.toLocaleDateString('ru-RU'),
      shiftType: shift.shiftType,
    }).catch(() => {});

    return shift;
  }

  async remove(id: string) {
    return this.prisma.shiftAssignment.delete({
      where: { id },
    });
  }
}
