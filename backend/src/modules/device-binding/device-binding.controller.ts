import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DeviceBindingService } from './device-binding.service';
import {
  CreateBindingDto,
  UseBindingDto,
  ValidateBindingDto,
  ToggleBindingDto,
  DeleteBindingDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('device-bindings')
export class DeviceBindingController {
  constructor(private readonly deviceBindingService: DeviceBindingService) {}

  /**
   * Generate new binding code (SUPER_ADMIN only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async create(
    @Body() dto: CreateBindingDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.deviceBindingService.create(dto, user.id);
  }

  /**
   * Get all bindings for a branch (SUPER_ADMIN only)
   */
  @Get('branch/:branchId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async findByBranch(@Param('branchId') branchId: string) {
    return this.deviceBindingService.findByBranch(branchId);
  }

  /**
   * Verify binding code (Public - for Android)
   */
  @Get('verify/:code')
  async verify(@Param('code') code: string) {
    return this.deviceBindingService.verify(code);
  }

  /**
   * Use binding code to bind device (Public - for Android)
   */
  @Post('use')
  async use(@Body() dto: UseBindingDto) {
    return this.deviceBindingService.use(dto);
  }

  /**
   * Validate binding is still active (Public - for Android startup)
   */
  @Post('validate')
  async validate(@Body() dto: ValidateBindingDto) {
    return this.deviceBindingService.validate(dto);
  }

  /**
   * Toggle binding active status (SUPER_ADMIN only)
   */
  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async toggle(@Param('id') id: string, @Body() dto: ToggleBindingDto) {
    return this.deviceBindingService.toggle(id, dto);
  }

  /**
   * Delete binding code (SUPER_ADMIN only, requires password)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteBindingDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.deviceBindingService.remove(id, dto.password, user.id);
  }
}
