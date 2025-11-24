import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDailySummary(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    const checkIns = attendances.filter((a) => a.type === AttendanceType.CHECK_IN);
    const checkOuts = attendances.filter((a) => a.type === AttendanceType.CHECK_OUT);

    const totalEmployees = await this.prisma.user.count({
      where: { role: 'EMPLOYEE', isActive: true },
    });

    return {
      date: date.toISOString().split('T')[0],
      totalEmployees,
      totalCheckIns: checkIns.length,
      totalCheckOuts: checkOuts.length,
      attendanceRate: totalEmployees > 0 ? (checkIns.length / totalEmployees) * 100 : 0,
      attendances,
    };
  }

  async getMonthlySummary(year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
    });

    const userAttendanceMap = new Map();

    attendances.forEach((attendance) => {
      if (!userAttendanceMap.has(attendance.userId)) {
        userAttendanceMap.set(attendance.userId, {
          user: attendance.user,
          checkIns: 0,
          checkOuts: 0,
          dates: new Set(),
        });
      }

      const userData = userAttendanceMap.get(attendance.userId);
      if (attendance.type === AttendanceType.CHECK_IN) {
        userData.checkIns++;
        userData.dates.add(attendance.timestamp.toISOString().split('T')[0]);
      } else {
        userData.checkOuts++;
      }
    });

    const workingDays = this.calculateWorkingDays(startOfMonth, endOfMonth);

    const employeeStats = Array.from(userAttendanceMap.values()).map((data) => ({
      user: data.user,
      totalCheckIns: data.checkIns,
      totalCheckOuts: data.checkOuts,
      attendanceDays: data.dates.size,
      workingDays,
      attendanceRate: workingDays > 0 ? (data.dates.size / workingDays) * 100 : 0,
    }));

    return {
      year,
      month,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      workingDays,
      employeeStats,
      totalCheckIns: attendances.filter((a) => a.type === AttendanceType.CHECK_IN).length,
      totalCheckOuts: attendances.filter((a) => a.type === AttendanceType.CHECK_OUT).length,
    };
  }

  async getUserMonthlyReport(userId: string, year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const dailyRecords = new Map();

    attendances.forEach((attendance) => {
      const date = attendance.timestamp.toISOString().split('T')[0];
      if (!dailyRecords.has(date)) {
        dailyRecords.set(date, { date, checkIn: null, checkOut: null });
      }

      const record = dailyRecords.get(date);
      if (attendance.type === AttendanceType.CHECK_IN) {
        record.checkIn = attendance;
      } else {
        record.checkOut = attendance;
      }
    });

    const workingDays = this.calculateWorkingDays(startOfMonth, endOfMonth);
    const presentDays = dailyRecords.size;

    return {
      year,
      month,
      workingDays,
      presentDays,
      absentDays: workingDays - presentDays,
      attendanceRate: workingDays > 0 ? (presentDays / workingDays) * 100 : 0,
      dailyRecords: Array.from(dailyRecords.values()),
    };
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await this.prisma.user.count({
      where: { role: 'EMPLOYEE', isActive: true },
    });

    const todayCheckIns = await this.prisma.attendance.count({
      where: {
        type: AttendanceType.CHECK_IN,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayCheckOuts = await this.prisma.attendance.count({
      where: {
        type: AttendanceType.CHECK_OUT,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyAttendances = await this.prisma.attendance.count({
      where: {
        type: AttendanceType.CHECK_IN,
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    return {
      totalEmployees,
      todayPresent: todayCheckIns,
      todayAbsent: totalEmployees - todayCheckIns,
      todayCheckOuts,
      attendanceRate: totalEmployees > 0 ? (todayCheckIns / totalEmployees) * 100 : 0,
      monthlyTotalAttendances: monthlyAttendances,
    };
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
