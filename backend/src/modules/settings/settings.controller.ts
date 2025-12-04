import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateSimilarityDto } from './dto/update-setting.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.BRANCH_ADMIN)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  async getAll() {
    return this.settingsService.getAll();
  }

  @Get('similarity-threshold')
  async getSimilarityThreshold() {
    const value = await this.settingsService.getSimilarityThreshold();
    return { value };
  }

  @Put('similarity-threshold')
  async updateSimilarityThreshold(@Body() dto: UpdateSimilarityDto) {
    const value = Number(dto.value);
    if (isNaN(value) || value < 0.1 || value > 1.0) {
      throw new BadRequestException(
        'Nilai threshold harus antara 0.1 dan 1.0',
      );
    }
    await this.settingsService.updateSimilarityThreshold(value);
    return { message: 'Threshold berhasil diperbarui', value };
  }
}
