import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  @Roles(Role.ADMIN)
  async getDailySummary(@Query('date') date: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.reportsService.getDailySummary(reportDate);
  }

  @Get('monthly')
  @Roles(Role.ADMIN)
  async getMonthlySummary(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const currentDate = new Date();
    const reportYear = year ? parseInt(year, 10) : currentDate.getFullYear();
    const reportMonth = month ? parseInt(month, 10) : currentDate.getMonth() + 1;

    return this.reportsService.getMonthlySummary(reportYear, reportMonth);
  }

  @Get('user/monthly')
  async getMyMonthlyReport(
    @CurrentUser() user: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const currentDate = new Date();
    const reportYear = year ? parseInt(year, 10) : currentDate.getFullYear();
    const reportMonth = month ? parseInt(month, 10) : currentDate.getMonth() + 1;

    return this.reportsService.getUserMonthlyReport(user.id, reportYear, reportMonth);
  }

  @Get('user/:userId/monthly')
  @Roles(Role.ADMIN)
  async getUserMonthlyReport(
    @Param('userId') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const currentDate = new Date();
    const reportYear = year ? parseInt(year, 10) : currentDate.getFullYear();
    const reportMonth = month ? parseInt(month, 10) : currentDate.getMonth() + 1;

    return this.reportsService.getUserMonthlyReport(userId, reportYear, reportMonth);
  }

  @Get('dashboard')
  @Roles(Role.ADMIN)
  async getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }
}
