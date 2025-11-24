import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEmployeeDto, RegisterFaceDto } from './dto';
import { Role } from '@prisma/client';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: Role.EMPLOYEE },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        position: true,
        department: true,
        isActive: true,
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
        email: true,
        name: true,
        phone: true,
        position: true,
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

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        position: true,
        department: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const employee = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
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
        email: true,
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
