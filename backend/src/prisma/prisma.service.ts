import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Expose Prisma Client methods
  get user() {
    return this.prisma.user;
  }

  get attendance() {
    return this.prisma.attendance;
  }

  get settings() {
    return this.prisma.settings;
  }

  get faceRegistration() {
    return this.prisma.faceRegistration;
  }

  get department() {
    return this.prisma.department;
  }

  get workSchedule() {
    return this.prisma.workSchedule;
  }

  get holiday() {
    return this.prisma.holiday;
  }

  get holidayUser() {
    return this.prisma.holidayUser;
  }

  get faceMatchAttempt() {
    return this.prisma.faceMatchAttempt;
  }

  // Expose transaction and other utility methods
  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  get $connect() {
    return this.prisma.$connect.bind(this.prisma);
  }

  get $disconnect() {
    return this.prisma.$disconnect.bind(this.prisma);
  }
}
