import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FaceRegistrationService } from './face-registration.service';
import {
  SubmitFaceRegistrationDto,
  ApproveRegistrationDto,
  RejectRegistrationDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('face-registration')
export class FaceRegistrationController {
  constructor(
    private readonly faceRegistrationService: FaceRegistrationService,
  ) {}

  /**
   * PUBLIC ENDPOINT: Submit face registration
   * No authentication required
   */
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  async submit(@Body() dto: SubmitFaceRegistrationDto) {
    return this.faceRegistrationService.submitRegistration(dto);
  }

  /**
   * ADMIN ONLY: Get all pending registrations
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getPending() {
    return this.faceRegistrationService.getPendingRegistrations();
  }

  /**
   * ADMIN ONLY: Get registration by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getById(@Param('id') id: string) {
    return this.faceRegistrationService.getRegistrationById(id);
  }

  /**
   * ADMIN ONLY: Approve registration and create user account
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveRegistrationDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return this.faceRegistrationService.approveRegistration(id, dto, adminId);
  }

  /**
   * ADMIN ONLY: Reject registration
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectRegistrationDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return this.faceRegistrationService.rejectRegistration(id, dto, adminId);
  }

  /**
   * ADMIN ONLY: Delete registration
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return this.faceRegistrationService.deleteRegistration(id);
  }

  /**
   * ADMIN ONLY: Get statistics
   */
  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStatistics() {
    return this.faceRegistrationService.getStatistics();
  }
}
