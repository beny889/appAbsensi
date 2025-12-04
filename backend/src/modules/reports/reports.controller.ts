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
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getDailySummary(
    @Query('date') date: string,
    @Query('branchId') branchId?: string,
  ) {
    const reportDate = date ? new Date(date) : new Date();
    return this.reportsService.getDailySummary(reportDate, branchId);
  }

  @Get('monthly')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getMonthlySummary(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const currentDate = new Date();
    const reportYear = year ? parseInt(year, 10) : currentDate.getFullYear();
    const reportMonth = month ? parseInt(month, 10) : currentDate.getMonth() + 1;

    return this.reportsService.getMonthlySummary(reportYear, reportMonth);
  }

  @Get('monthly-grid')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getMonthlyAttendanceGrid(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('branchId') branchId?: string,
  ) {
    const currentDate = new Date();
    const reportYear = year ? parseInt(year, 10) : currentDate.getFullYear();
    const reportMonth = month ? parseInt(month, 10) : currentDate.getMonth() + 1;

    return this.reportsService.getMonthlyAttendanceGrid(reportYear, reportMonth, branchId);
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
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
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
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getDashboardStats(@CurrentUser() user: any) {
    return this.reportsService.getDashboardStats(user.id);
  }

  @Get('dashboard-presence')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getDashboardPresence(@CurrentUser() user: any) {
    return this.reportsService.getDashboardPresence(user.id);
  }

  @Get('employee/:userId/details')
  @Roles(Role.ADMIN, Role.BRANCH_ADMIN)
  async getEmployeeDetailReport(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('branchId') branchId?: string,
  ) {
    // Parse date string as local date (YYYY-MM-DD)
    const parseLocalDate = (dateStr: string, isEndOfDay = false) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (isEndOfDay) {
        return new Date(year, month - 1, day, 23, 59, 59, 999);
      }
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const today = new Date();
    const start = startDate ? parseLocalDate(startDate) : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const end = endDate ? parseLocalDate(endDate, true) : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return this.reportsService.getEmployeeDetailReport(userId, start, end, branchId);
  }
}
