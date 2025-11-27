import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.holiday.findMany({
      orderBy: { date: 'asc' },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async findByYear(year: number) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    return this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      orderBy: { date: 'asc' },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async findByMonth(year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    return holiday;
  }

  async create(dto: CreateHolidayDto) {
    const isGlobal = dto.isGlobal !== false; // default true
    const userIds = dto.userIds || [];

    // Jika tidak global, harus ada minimal 1 karyawan
    if (!isGlobal && userIds.length === 0) {
      throw new ConflictException('Pilih minimal 1 karyawan untuk libur non-global');
    }

    return this.prisma.holiday.create({
      data: {
        date: new Date(dto.date),
        name: dto.name,
        description: dto.description,
        isGlobal,
        users: !isGlobal && userIds.length > 0 ? {
          create: userIds.map(userId => ({ userId })),
        } : undefined,
      },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateHolidayDto) {
    await this.findOne(id);

    const isGlobal = dto.isGlobal;
    const userIds = dto.userIds;

    // Jika tidak global, harus ada minimal 1 karyawan
    if (isGlobal === false && (!userIds || userIds.length === 0)) {
      throw new ConflictException('Pilih minimal 1 karyawan untuk libur non-global');
    }

    // Update holiday
    const holiday = await this.prisma.holiday.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(isGlobal !== undefined && { isGlobal }),
      },
    });

    // Update user assignments jika userIds diberikan
    if (userIds !== undefined) {
      // Hapus semua relasi lama
      await this.prisma.holidayUser.deleteMany({
        where: { holidayId: id },
      });

      // Buat relasi baru jika tidak global dan ada userIds
      if (!holiday.isGlobal && userIds.length > 0) {
        await this.prisma.holidayUser.createMany({
          data: userIds.map(userId => ({ holidayId: id, userId })),
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.holiday.delete({
      where: { id },
    });

    return { message: 'Holiday deleted successfully' };
  }

  // Helper: Get holidays as Set of date numbers for quick lookup (for specific user)
  async getHolidayDatesForMonth(year: number, month: number, userId?: string): Promise<Set<number>> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        users: true,
      },
      orderBy: { date: 'asc' },
    });

    // Filter holidays that apply to this user
    const applicableHolidays = holidays.filter((h) => {
      if (h.isGlobal) return true; // Global holiday applies to everyone
      if (!userId) return true; // No userId specified, return all
      // Check if user is in the holiday's user list
      return h.users.some((hu) => hu.userId === userId);
    });

    return new Set(applicableHolidays.map((h) => h.date.getDate()));
  }

  // Helper: Get holidays in date range as Map<dateString, holidayName> (for specific user)
  async getHolidaysInRange(startDate: Date, endDate: Date, userId?: string): Promise<Map<string, string>> {
    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        users: true,
      },
      orderBy: { date: 'asc' },
    });

    const holidayMap = new Map<string, string>();
    holidays.forEach((h) => {
      // Check if holiday applies to this user
      const applies = h.isGlobal || !userId || h.users.some((hu) => hu.userId === userId);
      if (applies) {
        // Use local date format to match report date format
        const year = h.date.getFullYear();
        const month = String(h.date.getMonth() + 1).padStart(2, '0');
        const day = String(h.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        holidayMap.set(dateStr, h.name);
      }
    });
    return holidayMap;
  }

  // Helper: Get holidays for multiple users in date range
  // Returns Map<userId, Map<dateString, holidayName>>
  async getHolidaysForUsersInRange(
    startDate: Date,
    endDate: Date,
    userIds: string[],
  ): Promise<Map<string, Map<string, string>>> {
    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        users: true,
      },
      orderBy: { date: 'asc' },
    });

    const result = new Map<string, Map<string, string>>();

    // Initialize map for each user
    for (const userId of userIds) {
      result.set(userId, new Map<string, string>());
    }

    // Process each holiday
    for (const holiday of holidays) {
      // Use local date format to match report date format
      const year = holiday.date.getFullYear();
      const month = String(holiday.date.getMonth() + 1).padStart(2, '0');
      const day = String(holiday.date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      for (const userId of userIds) {
        // Check if holiday applies to this user
        const applies = holiday.isGlobal || holiday.users.some((hu) => hu.userId === userId);
        if (applies) {
          result.get(userId)!.set(dateStr, holiday.name);
        }
      }
    }

    return result;
  }
}
