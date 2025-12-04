import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, VerifyFaceDto, VerifyAnonymousDto, VerifyDeviceDto, LogAttemptDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  /**
   * Anonymous check-in/check-out (NO authentication required)
   * Uses face recognition to identify user automatically
   */
  @Post('verify-anonymous')
  async verifyAnonymous(@Body() dto: VerifyAnonymousDto) {
    return this.attendanceService.verifyFaceAnonymous(
      dto.faceEmbedding,
      dto.type,
    );
  }

  /**
   * Verify face only WITHOUT creating attendance (NO authentication required)
   * Used for early checkout confirmation flow - returns user + schedule info
   */
  @Post('verify-only')
  async verifyFaceOnly(@Body('faceEmbedding') faceEmbedding: string) {
    return this.attendanceService.verifyFaceOnly(faceEmbedding);
  }

  /**
   * Get user's work schedule (NO authentication required)
   * Used by Android app to show early checkout confirmation
   */
  @Get('schedule/:userId')
  async getUserSchedule(@Param('userId') userId: string) {
    return this.attendanceService.getUserSchedule(userId);
  }

  /**
   * Sync embeddings for on-device face recognition (NO authentication required)
   * Returns all approved user embeddings for Android app to download
   * Used for MobileFaceNet on-device face verification
   */
  @Get('sync-embeddings')
  async syncEmbeddings() {
    return this.attendanceService.syncEmbeddings();
  }

  /**
   * Create attendance from device-verified face (NO authentication required)
   * Called when Android app verifies face on-device using MobileFaceNet
   * and sends the matched userId to backend
   */
  @Post('verify-device')
  async verifyDevice(@Body() dto: VerifyDeviceDto) {
    return this.attendanceService.createAttendanceFromDevice(dto);
  }

  /**
   * Get ALL today's attendance (NO authentication required)
   * Returns list of all users who checked in/out today
   * Used by Android app to show public attendance board
   */
  @Public()
  @Get('today-all')
  async getTodayAllAttendance() {
    return this.attendanceService.getTodayAllAttendance();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('verify')
  async verify(@CurrentUser() user: any, @Body() dto: VerifyFaceDto) {
    const result = await this.attendanceService.verifyFaceAndLocation(user.id, dto);

    if (result.verified) {
      return this.attendanceService.create(user.id, {
        type: dto.type,
        similarity: result.similarity,
      });
    }

    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my')
  async getMyAttendances(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getUserAttendances(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('today')
  async getTodayAttendance(@CurrentUser() user: any) {
    return this.attendanceService.getTodayAttendance(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getUserAttendances(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getUserAttendances(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('all')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getAllAttendances(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getAllAttendances(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async deleteAttendance(@Param('id') id: string) {
    return this.attendanceService.delete(id);
  }

  /**
   * Log face match attempt (NO authentication required)
   * Called by Android app after every face matching attempt (success or failure)
   */
  @Post('log-attempt')
  async logAttempt(@Body() dto: LogAttemptDto) {
    return this.attendanceService.logFaceMatchAttempt(dto);
  }

  /**
   * Get all face match attempts (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('face-match-attempts')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getFaceMatchAttempts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attendanceService.getFaceMatchAttempts(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * Get single face match attempt by ID (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('face-match-attempts/:id')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getFaceMatchAttemptById(@Param('id') id: string) {
    return this.attendanceService.getFaceMatchAttemptById(id);
  }

  /**
   * Delete old face match attempts (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('face-match-attempts/cleanup')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async deleteOldAttempts(@Query('daysOld') daysOld?: string) {
    return this.attendanceService.deleteOldAttempts(
      daysOld ? parseInt(daysOld) : 30,
    );
  }
}
