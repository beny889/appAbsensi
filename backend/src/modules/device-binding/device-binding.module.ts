import { Module } from '@nestjs/common';
import { DeviceBindingController } from './device-binding.controller';
import { DeviceBindingService } from './device-binding.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceBindingController],
  providers: [DeviceBindingService],
  exports: [DeviceBindingService],
})
export class DeviceBindingModule {}
