import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FaceRegistrationModule } from './modules/face-registration/face-registration.module';
import { WorkScheduleModule } from './modules/work-schedule/work-schedule.module';
import { DepartmentModule } from './modules/department/department.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting: max 10 requests per 60 seconds for login attempts
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 20, // 20 requests per minute
      },
      {
        name: 'long',
        ttl: 60000 * 60, // 1 hour
        limit: 100, // 100 requests per hour
      },
    ]),
    PrismaModule,
    AuthModule,
    EmployeeModule,
    AttendanceModule,
    ReportsModule,
    FaceRegistrationModule,
    WorkScheduleModule,
    DepartmentModule,
    HolidaysModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Enable rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
