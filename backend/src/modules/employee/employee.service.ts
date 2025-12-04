import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BranchAccessService } from '../auth/branch-access.service';
import { UpdateEmployeeDto, RegisterFaceDto } from './dto';
import { Role } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService,
    private branchAccessService: BranchAccessService,
  ) {}

  async findAll(userId?: string) {
    // Build where clause with branch filter if userId provided
    const where: any = { role: Role.EMPLOYEE };

    if (userId) {
      const branchFilter = await this.branchAccessService.getBranchFilter(userId);
      if (branchFilter) {
        where.branchId = branchFilter.branchId;
      }
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        position: true,
        departmentId: true,
        department: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isActive: true,
        startDate: true,
        createdAt: true,
        updatedAt: true,
        faceImageUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        position: true,
        departmentId: true,
        department: true,
        role: true,
        isActive: true,
        faceImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, currentUserId: string, currentUserRole: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (currentUserRole !== Role.ADMIN && id !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Prepare update data, converting startDate string to Date if provided
    const updateData: any = { ...dto };
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        position: true,
        departmentId: true,
        department: true,
        isActive: true,
        startDate: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    // Check if employee has attendance records
    const attendanceCount = await this.prisma.attendance.count({
      where: { userId: id },
    });

    if (attendanceCount > 0) {
      throw new BadRequestException(
        `Karyawan tidak dapat dihapus karena memiliki ${attendanceCount} record absensi`
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Karyawan berhasil dihapus' };
  }

  async registerFace(userId: string, dto: RegisterFaceDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        faceEmbedding: dto.faceEmbedding,
        faceImageUrl: dto.faceImageUrl,
      },
      select: {
        id: true,
        name: true,
        faceImageUrl: true,
        updatedAt: true,
      },
    });
  }

  async hasFaceRegistered(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { faceEmbedding: true },
    });

    return !!user?.faceEmbedding;
  }
}
