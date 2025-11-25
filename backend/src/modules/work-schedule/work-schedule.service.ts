import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkScheduleDto, UpdateWorkScheduleDto } from './dto';

@Injectable()
export class WorkScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWorkScheduleDto) {
    // Validate time format
    this.validateTime(dto.checkInTime, dto.checkOutTime);

    // Check if department exists
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check if schedule already exists for this department
    const existing = await this.prisma.workSchedule.findUnique({
      where: { departmentId: dto.departmentId },
    });

    if (existing) {
      throw new ConflictException(
        `Work schedule already exists for department: ${department.name}`,
      );
    }

    return this.prisma.workSchedule.create({
      data: {
        departmentId: dto.departmentId,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        isActive: dto.isActive ?? true,
      },
      include: {
        department: true,
      },
    });
  }

  async findAll() {
    return this.prisma.workSchedule.findMany({
      include: {
        department: true,
      },
      orderBy: {
        department: {
          name: 'asc',
        },
      },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
      include: {
        department: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Work schedule not found');
    }

    return schedule;
  }

  async findByDepartment(department: string) {
    const schedule = await this.prisma.workSchedule.findFirst({
      where: {
        department: {
          name: department,
        },
      },
      include: {
        department: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException(
        `Work schedule not found for department: ${department}`,
      );
    }

    return schedule;
  }

  async update(id: string, dto: UpdateWorkScheduleDto) {
    // Check if schedule exists
    const existing = await this.prisma.workSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Work schedule not found');
    }

    // Validate time if both are provided or if only one is provided with existing
    const checkInTime = dto.checkInTime ?? existing.checkInTime;
    const checkOutTime = dto.checkOutTime ?? existing.checkOutTime;
    this.validateTime(checkInTime, checkOutTime);

    // If department is being updated, check for conflicts
    if (dto.departmentId && dto.departmentId !== existing.departmentId) {
      // Check if department exists
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      const conflict = await this.prisma.workSchedule.findUnique({
        where: { departmentId: dto.departmentId },
      });

      if (conflict) {
        throw new ConflictException(
          `Work schedule already exists for department: ${department.name}`,
        );
      }
    }

    return this.prisma.workSchedule.update({
      where: { id },
      data: dto,
      include: {
        department: true,
      },
    });
  }

  async remove(id: string) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Work schedule not found');
    }

    await this.prisma.workSchedule.delete({
      where: { id },
    });

    return { message: 'Work schedule deleted successfully' };
  }

  private validateTime(checkInTime: string, checkOutTime: string) {
    // Parse times
    const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
    const [checkOutHour, checkOutMinute] = checkOutTime.split(':').map(Number);

    // Convert to minutes for easy comparison
    const checkInMinutes = checkInHour * 60 + checkInMinute;
    const checkOutMinutes = checkOutHour * 60 + checkOutMinute;

    if (checkOutMinutes <= checkInMinutes) {
      throw new BadRequestException(
        'Check-out time must be after check-in time',
      );
    }
  }
}
