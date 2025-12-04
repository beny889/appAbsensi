import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBindingDto, UseBindingDto, ValidateBindingDto, ToggleBindingDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DeviceBindingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate random 5-character uppercase letter code
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate unique binding code (retry if collision)
   */
  private async generateUniqueCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = this.generateCode();
      const existing = await this.prisma.deviceBinding.findUnique({
        where: { code },
      });

      if (!existing) {
        return code;
      }
      attempts++;
    }

    throw new ConflictException(
      'Gagal generate kode unik. Silakan coba lagi.',
    );
  }

  /**
   * Create new binding code for a branch
   */
  async create(dto: CreateBindingDto, createdBy: string) {
    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });

    if (!branch) {
      throw new NotFoundException('Cabang tidak ditemukan');
    }

    const code = await this.generateUniqueCode();

    const binding = await this.prisma.deviceBinding.create({
      data: {
        code,
        branchId: dto.branchId,
        createdBy,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
    });

    return binding;
  }

  /**
   * Get all bindings for a specific branch
   */
  async findByBranch(branchId: string) {
    const bindings = await this.prisma.deviceBinding.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return bindings;
  }

  /**
   * Verify binding code exists and is active (for Android initial verification)
   */
  async verify(code: string) {
    const binding = await this.prisma.deviceBinding.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
    });

    if (!binding) {
      return {
        valid: false,
        message: 'Kode binding tidak ditemukan',
      };
    }

    if (!binding.isActive) {
      return {
        valid: false,
        message: 'Kode binding tidak aktif',
      };
    }

    if (binding.usedAt) {
      return {
        valid: false,
        message: 'Kode binding sudah digunakan oleh device lain',
      };
    }

    return {
      valid: true,
      branch: binding.branch,
    };
  }

  /**
   * Use binding code to bind device (marks as used)
   */
  async use(dto: UseBindingDto) {
    const binding = await this.prisma.deviceBinding.findUnique({
      where: { code: dto.code.toUpperCase() },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
    });

    if (!binding) {
      return {
        success: false,
        message: 'Kode binding tidak ditemukan',
      };
    }

    if (!binding.isActive) {
      return {
        success: false,
        message: 'Kode binding tidak aktif',
      };
    }

    if (binding.usedAt) {
      return {
        success: false,
        message: 'Kode binding sudah digunakan oleh device lain',
      };
    }

    // Mark as used
    const updatedBinding = await this.prisma.deviceBinding.update({
      where: { id: binding.id },
      data: {
        deviceName: dto.deviceName || 'Unknown Device',
        usedAt: new Date(),
      },
    });

    return {
      success: true,
      binding: {
        id: updatedBinding.id,
        code: updatedBinding.code,
        branchId: updatedBinding.branchId,
      },
      branch: binding.branch,
    };
  }

  /**
   * Validate binding code is still active (for app startup check)
   */
  async validate(dto: ValidateBindingDto) {
    const binding = await this.prisma.deviceBinding.findUnique({
      where: { code: dto.code.toUpperCase() },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
    });

    if (!binding) {
      return {
        valid: false,
        message: 'Kode binding tidak ditemukan',
      };
    }

    if (!binding.isActive) {
      return {
        valid: false,
        message: 'Kode binding telah dinonaktifkan oleh administrator',
      };
    }

    return {
      valid: true,
      branch: binding.branch,
    };
  }

  /**
   * Toggle binding active status
   */
  async toggle(id: string, dto: ToggleBindingDto) {
    const binding = await this.prisma.deviceBinding.findUnique({
      where: { id },
    });

    if (!binding) {
      throw new NotFoundException('Binding code tidak ditemukan');
    }

    await this.prisma.deviceBinding.update({
      where: { id },
      data: { isActive: dto.isActive },
    });

    return {
      message: dto.isActive
        ? 'Binding code berhasil diaktifkan'
        : 'Binding code berhasil dinonaktifkan',
      isActive: dto.isActive,
    };
  }

  /**
   * Delete binding code with password confirmation
   */
  async remove(id: string, password: string, adminId: string) {
    const binding = await this.prisma.deviceBinding.findUnique({
      where: { id },
    });

    if (!binding) {
      throw new NotFoundException('Binding code tidak ditemukan');
    }

    // Verify admin password
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || !admin.password) {
      throw new UnauthorizedException('Admin tidak valid');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password tidak valid');
    }

    await this.prisma.deviceBinding.delete({
      where: { id },
    });

    return { message: 'Binding code berhasil dihapus' };
  }
}
