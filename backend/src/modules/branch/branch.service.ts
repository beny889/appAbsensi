import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    // Check if branch name already exists
    const existingName = await this.prisma.branch.findUnique({
      where: { name: dto.name },
    });

    if (existingName) {
      throw new ConflictException(
        `Branch with name '${dto.name}' already exists`,
      );
    }

    // Check if branch code already exists
    const existingCode = await this.prisma.branch.findUnique({
      where: { code: dto.code },
    });

    if (existingCode) {
      throw new ConflictException(
        `Branch with code '${dto.code}' already exists`,
      );
    }

    return this.prisma.branch.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(), // Uppercase code
        address: dto.address,
        city: dto.city,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });
  }

  /**
   * Get list of active branches (public endpoint for Android)
   * Returns minimal data for branch selection
   */
  async findAllActive() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
      },
    });
  }

  /**
   * Verify branch by code (public endpoint for Android)
   * Used for manual branch code entry
   */
  async verifyByCode(code: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        isActive: true,
      },
    });

    if (!branch) {
      throw new NotFoundException(`Kode cabang '${code.toUpperCase()}' tidak ditemukan`);
    }

    if (!branch.isActive) {
      throw new NotFoundException(`Cabang dengan kode '${code.toUpperCase()}' tidak aktif`);
    }

    // Return without isActive field
    return {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      city: branch.city,
    };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Branch not found');
    }

    // Check for name conflict
    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.branch.findUnique({
        where: { name: dto.name },
      });

      if (conflict) {
        throw new ConflictException(
          `Branch with name '${dto.name}' already exists`,
        );
      }
    }

    // Check for code conflict
    if (dto.code && dto.code !== existing.code) {
      const conflict = await this.prisma.branch.findUnique({
        where: { code: dto.code.toUpperCase() },
      });

      if (conflict) {
        throw new ConflictException(
          `Branch with code '${dto.code}' already exists`,
        );
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : undefined,
      },
    });
  }

  async remove(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Check if branch has users
    if (branch._count.users > 0) {
      throw new ConflictException(
        `Cannot delete branch. It has ${branch._count.users} user(s) assigned.`,
      );
    }

    // Check if branch has departments
    if (branch._count.departments > 0) {
      throw new ConflictException(
        `Cannot delete branch. It has ${branch._count.departments} department(s) assigned.`,
      );
    }

    await this.prisma.branch.delete({
      where: { id },
    });

    return { message: 'Branch deleted successfully' };
  }
}
