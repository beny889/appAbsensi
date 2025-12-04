import { Module, forwardRef } from '@nestjs/common';
import { FaceRegistrationController } from './face-registration.controller';
import { FaceRegistrationService } from './face-registration.service';
import { FaceRecognitionMlService } from './face-recognition-ml.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [FaceRegistrationController],
  providers: [FaceRegistrationService, FaceRecognitionMlService],
  exports: [FaceRegistrationService, FaceRecognitionMlService],
})
export class FaceRegistrationModule {}
