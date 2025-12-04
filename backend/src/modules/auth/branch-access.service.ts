import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

export interface BranchFilter {
  branchId?: string | { in: string[] };
}

export interface UserBranchAccess {
  userId: string;
  role: Role;
  branchIds: string[];
  isSuperAdmin: boolean;
}

@Injectable()
export class BranchAccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's branch access info
   * Returns branch IDs that user can access
   */
  async getUserBranchAccess(userId: string): Promise<UserBranchAccess> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        adminBranchAccess: {
          select: {
            branchId: true,
          },
        },
      },
    });

    if (!user) {
      return {
        userId,
        role: Role.EMPLOYEE,
        branchIds: [],
        isSuperAdmin: false,
      };
    }

    const isSuperAdmin = user.role === Role.SUPER_ADMIN;
    const branchIds = user.adminBranchAccess.map((a) => a.branchId);

    return {
      userId: user.id,
      role: user.role,
      branchIds,
      isSuperAdmin,
    };
  }

  /**
   * Get branch filter for Prisma queries
   * Returns filter object to use in where clause
   * SUPER_ADMIN gets no filter (sees all)
   * BRANCH_ADMIN/ADMIN gets filter by their branch access
   */
  async getBranchFilter(userId: string): Promise<BranchFilter | null> {
    const access = await this.getUserBranchAccess(userId);

    // SUPER_ADMIN sees all data
    if (access.isSuperAdmin) {
      return null;
    }

    // No branch access = no data
    if (access.branchIds.length === 0) {
      return { branchId: 'NO_ACCESS' }; // Will match nothing
    }

    // Single branch
    if (access.branchIds.length === 1) {
      return { branchId: access.branchIds[0] };
    }

    // Multiple branches
    return { branchId: { in: access.branchIds } };
  }

  /**
   * Check if user has access to a specific branch
   */
  async hasAccessToBranch(userId: string, branchId: string): Promise<boolean> {
    const access = await this.getUserBranchAccess(userId);

    if (access.isSuperAdmin) {
      return true;
    }

    return access.branchIds.includes(branchId);
  }
}
