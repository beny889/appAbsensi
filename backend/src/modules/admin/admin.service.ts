import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminDto, UpdateAdminDto } from './dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAdminDto) {
    // Only allow admin roles
    const allowedRoles: Role[] = [Role.SUPER_ADMIN, Role.BRANCH_ADMIN, Role.ADMIN];
    if (dto.role && !allowedRoles.includes(dto.role)) {
      throw new BadRequestException('Invalid role for admin user');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create admin user
    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || Role.BRANCH_ADMIN,
        isActive: true,
        allowedMenus: dto.allowedMenus ? JSON.stringify(dto.allowedMenus) : null,
        defaultBranchId: dto.defaultBranchId,
      },
    });

    // Assign branch access if provided
    if (dto.branchIds && dto.branchIds.length > 0) {
      await this.prisma.$transaction(
        dto.branchIds.map((branchId, index) =>
          this.prisma.adminBranchAccess.create({
            data: {
              userId: admin.id,
              branchId,
              isDefault: branchId === dto.defaultBranchId || (index === 0 && !dto.defaultBranchId),
            },
          })
        )
      );
    }

    return this.findOne(admin.id);
  }

  async findAll() {
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.SUPER_ADMIN, Role.BRANCH_ADMIN, Role.ADMIN],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        allowedMenus: true,
        defaultBranchId: true,
        createdAt: true,
        updatedAt: true,
        adminBranchAccess: {
          select: {
            id: true,
            branchId: true,
            isDefault: true,
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins.map((admin) => ({
      ...admin,
      allowedMenus: admin.allowedMenus ? JSON.parse(admin.allowedMenus) : null,
    }));
  }

  async findOne(id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        allowedMenus: true,
        defaultBranchId: true,
        createdAt: true,
        updatedAt: true,
        adminBranchAccess: {
          select: {
            id: true,
            branchId: true,
            isDefault: true,
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Verify it's an admin role
    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.BRANCH_ADMIN, Role.ADMIN];
    if (!adminRoles.includes(admin.role)) {
      throw new NotFoundException('Admin not found');
    }

    return {
      ...admin,
      allowedMenus: admin.allowedMenus ? JSON.parse(admin.allowedMenus) : null,
    };
  }

  async update(id: string, dto: UpdateAdminDto) {
    // Check if admin exists
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Admin not found');
    }

    // Verify it's an admin role
    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.BRANCH_ADMIN, Role.ADMIN];
    if (!adminRoles.includes(existing.role)) {
      throw new NotFoundException('Admin not found');
    }

    // Check email conflict if being updated
    if (dto.email && dto.email !== existing.email) {
      const conflict = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (conflict) {
        throw new ConflictException('Email already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (dto.email) updateData.email = dto.email;
    if (dto.name) updateData.name = dto.name;
    if (dto.role) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.allowedMenus !== undefined) {
      updateData.allowedMenus = dto.allowedMenus ? JSON.stringify(dto.allowedMenus) : null;
    }
    if (dto.defaultBranchId !== undefined) {
      updateData.defaultBranchId = dto.defaultBranchId;
    }

    // Hash password if being updated
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    // Update admin
    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update branch access if provided
    if (dto.branchIds !== undefined) {
      // Delete existing branch access
      await this.prisma.adminBranchAccess.deleteMany({
        where: { userId: id },
      });

      // Create new branch access
      if (dto.branchIds.length > 0) {
        await this.prisma.$transaction(
          dto.branchIds.map((branchId, index) =>
            this.prisma.adminBranchAccess.create({
              data: {
                userId: id,
                branchId,
                isDefault: branchId === dto.defaultBranchId || (index === 0 && !dto.defaultBranchId),
              },
            })
          )
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Verify it's an admin role
    const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.BRANCH_ADMIN, Role.ADMIN];
    if (!adminRoles.includes(admin.role)) {
      throw new NotFoundException('Admin not found');
    }

    // Delete branch access first
    await this.prisma.adminBranchAccess.deleteMany({
      where: { userId: id },
    });

    // Delete admin
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Admin deleted successfully' };
  }

  // Get available menus for admin
  getAvailableMenus() {
    return [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'employees', label: 'Karyawan' },
      { key: 'attendance', label: 'Absensi' },
      { key: 'face-registration', label: 'Pendaftaran Wajah' },
      { key: 'branches', label: 'Cabang' },
      { key: 'departments', label: 'Departemen' },
      { key: 'work-schedules', label: 'Jadwal Kerja' },
      { key: 'holidays', label: 'Hari Libur' },
      { key: 'reports', label: 'Laporan' },
      { key: 'face-match-logs', label: 'Face Match Logs' },
      { key: 'settings', label: 'Pengaturan' },
      { key: 'admin-users', label: 'Manajemen Admin' },
    ];
  }
}
