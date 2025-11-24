import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, VerifyFaceDto, VerifyAnonymousDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
      dto.latitude,
      dto.longitude,
      dto.type,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('verify')
  async verify(@CurrentUser() user: any, @Body() dto: VerifyFaceDto) {
    const result = await this.attendanceService.verifyFaceAndLocation(user.id, dto);

    if (result.verified) {
      return this.attendanceService.create(user.id, {
        type: dto.type,
        latitude: dto.latitude,
        longitude: dto.longitude,
        locationId: result.locationId,
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
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
  async getAllAttendances(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getAllAttendances(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
