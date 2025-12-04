import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FaceRegistrationModule } from '../face-registration/face-registration.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, FaceRegistrationModule, AuthModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
