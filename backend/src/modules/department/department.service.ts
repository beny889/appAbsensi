import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BranchAccessService } from '../auth/branch-access.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class DepartmentService {
  constructor(
    private prisma: PrismaService,
    private branchAccessService: BranchAccessService,
  ) {}

  async create(dto: CreateDepartmentDto) {
    // Check if department already exists (same name in same branch)
    const existing = await this.prisma.department.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Department with name '${dto.name}' already exists`,
      );
    }

    return this.prisma.department.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(userId?: string) {
    const where: any = {};

    // Add branch filter if userId provided
    if (userId) {
      const branchFilter = await this.branchAccessService.getBranchFilter(userId);
      if (branchFilter) {
        where.branchId = branchFilter.branchId;
      }
    }

    return this.prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            users: true,
            workSchedules: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            workSchedules: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    // Check if department exists
    const existing = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    // If name is being updated, check for conflicts
    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.department.findFirst({
        where: { name: dto.name },
      });

      if (conflict) {
        throw new ConflictException(
          `Department with name '${dto.name}' already exists`,
        );
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            workSchedules: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check if department has users or work schedules
    if (department._count.users > 0) {
      throw new ConflictException(
        `Cannot delete department. It has ${department._count.users} user(s) assigned.`,
      );
    }

    if (department._count.workSchedules > 0) {
      throw new ConflictException(
        `Cannot delete department. It has ${department._count.workSchedules} work schedule(s) assigned.`,
      );
    }

    await this.prisma.department.delete({
      where: { id },
    });

    return { message: 'Department deleted successfully' };
  }
}
