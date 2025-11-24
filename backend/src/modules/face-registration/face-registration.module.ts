import { Module } from '@nestjs/common';
import { FaceRegistrationController } from './face-registration.controller';
import { FaceRegistrationService } from './face-registration.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FaceRegistrationController],
  providers: [FaceRegistrationService],
  exports: [FaceRegistrationService],
})
export class FaceRegistrationModule {}
