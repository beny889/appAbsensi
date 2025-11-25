import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    this.prisma = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.prisma.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    console.log('👋 Database disconnected');
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
