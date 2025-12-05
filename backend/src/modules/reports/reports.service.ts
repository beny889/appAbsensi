import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';
import { HolidaysService } from '../holidays/holidays.service';
import { BranchAccessService } from '../auth/branch-access.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private holidaysService: HolidaysService,
    private branchAccessService: BranchAccessService,
  ) {}

  async getDailySummary(date: Date, branchId?: string, userId?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause with branch filter
    const attendanceWhere: any = {
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    const employeeWhere: any = { role: 'EMPLOYEE', isActive: true };

    // Apply branch filter - explicit branchId takes priority, then user's branch access
    if (branchId) {
      attendanceWhere.user = { branchId };
      employeeWhere.branchId = branchId;
    } else if (userId) {
      const branchFilter = await this.branchAccessService.getBranchFilter(userId);
      if (branchFilter) {
        attendanceWhere.user = { branchId: branchFilter.branchId };
        employeeWhere.branchId = branchFilter.branchId;
      }
    }

    const attendances = await this.prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
            branchId: true,
            branch: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    const checkIns = attendances.filter((a) => a.type === AttendanceType.CHECK_IN);
    const checkOuts = attendances.filter((a) => a.type === AttendanceType.CHECK_OUT);

    const totalEmployees = await this.prisma.user.count({
      where: employeeWhere,
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

  async getMonthlyAttendanceGrid(year: number, month: number, branchId?: string, userId?: string) {
    try {
      console.log('[DEBUG] getMonthlyAttendanceGrid called with:', { year, month, branchId, userId });

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      const daysInMonth = new Date(year, month, 0).getDate();

      // Calculate displayDays - dynamic column count based on current date
      const today = new Date();
      const isCurrentMonth = year === today.getFullYear() && month === (today.getMonth() + 1);
      const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1);
      const displayDays = isFutureMonth ? 0 : (isCurrentMonth ? today.getDate() : daysInMonth);

      console.log('[DEBUG] Date calculations:', { startOfMonth, endOfMonth, daysInMonth, displayDays });

      // Build employee where clause with branch filter
      const employeeWhere: any = { role: 'EMPLOYEE', isActive: true };

      // Apply branch filter - explicit branchId takes priority, then user's branch access
      if (branchId) {
        employeeWhere.branchId = branchId;
      } else if (userId) {
        const branchFilter = await this.branchAccessService.getBranchFilter(userId);
        if (branchFilter) {
          employeeWhere.branchId = branchFilter.branchId;
        }
      }

      // Get all active employees with startDate
      const employees = await this.prisma.user.findMany({
        where: employeeWhere,
        select: {
          id: true,
          name: true,
          startDate: true,
          department: {
            select: { name: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      console.log('[DEBUG] Found employees:', employees.length);
      if (employees.length > 0) {
        console.log('[DEBUG] First employee:', { id: employees[0].id, name: employees[0].name, startDate: employees[0].startDate });
      }

    // Get holidays for each user in this month
    const userIds = employees.map(e => e.id);
    const userHolidaysMap = await this.holidaysService.getHolidaysForUsersInRange(
      startOfMonth,
      endOfMonth,
      userIds,
    );

    // Get all attendances for the month
    const attendances = await this.prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group attendances by user and date
    const attendanceMap = new Map<string, Map<number, { checkIn: any; checkOut: any }>>();

    attendances.forEach((attendance) => {
      const userId = attendance.userId;
      const day = attendance.timestamp.getDate();

      if (!attendanceMap.has(userId)) {
        attendanceMap.set(userId, new Map());
      }

      const userMap = attendanceMap.get(userId)!;
      if (!userMap.has(day)) {
        userMap.set(day, { checkIn: null, checkOut: null });
      }

      const dayRecord = userMap.get(day)!;
      if (attendance.type === AttendanceType.CHECK_IN) {
        dayRecord.checkIn = attendance;
      } else {
        dayRecord.checkOut = attendance;
      }
    });

    // Build employee data with daily status and summary
    const employeeData = employees.map((employee) => {
      const userAttendances = attendanceMap.get(employee.id) || new Map();

      // Get this user's holidays
      const userHolidays = userHolidaysMap.get(employee.id) || new Map();

      // Build daily status array
      const dailyStatus = [];
      let lateCount = 0;
      let totalLateMinutes = 0;
      let earlyCount = 0;
      let totalEarlyMinutes = 0;
      let absentCount = 0;

      // Get user's start date for checking if they've started working
      const userStartDate = employee.startDate ? new Date(employee.startDate) : null;
      if (userStartDate) {
        userStartDate.setHours(0, 0, 0, 0);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        dateObj.setHours(0, 0, 0, 0);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Check if date is before user's start date
        const isBeforeStartDate = userStartDate && dateObj < userStartDate;

        // Check if this day is a holiday for this specific user
        const isHoliday = userHolidays.has(dateStr);

        const dayRecord = userAttendances.get(day);

        if (isBeforeStartDate) {
          // Date is before employee's start date - mark as not started
          dailyStatus.push({
            date: day,
            isWeekend: false,
            isNotStarted: true,
            checkIn: false,
            checkOut: false,
            isLate: false,
            lateMinutes: 0,
            isEarly: false,
            earlyMinutes: 0,
          });
        } else if (isHoliday) {
          // Holiday from holidays table - mark as day off
          dailyStatus.push({
            date: day,
            isWeekend: true, // Keep field name for backward compatibility (means "is day off")
            isHoliday: true,
            isNotStarted: false,
            checkIn: false,
            checkOut: false,
            isLate: false,
            lateMinutes: 0,
            isEarly: false,
            earlyMinutes: 0,
          });
        } else if (dayRecord) {
          // Has attendance record
          const isLate = dayRecord.checkIn?.isLate || false;
          const lateMinutes = dayRecord.checkIn?.lateMinutes || 0;
          const isEarly = dayRecord.checkOut?.isEarlyCheckout || false;
          const earlyMinutes = dayRecord.checkOut?.earlyMinutes || 0;

          if (isLate) {
            lateCount++;
            totalLateMinutes += lateMinutes;
          }
          if (isEarly) {
            earlyCount++;
            totalEarlyMinutes += earlyMinutes;
          }

          dailyStatus.push({
            date: day,
            isWeekend: false,
            isNotStarted: false,
            checkIn: !!dayRecord.checkIn,
            checkOut: !!dayRecord.checkOut,
            isLate,
            lateMinutes,
            isEarly,
            earlyMinutes,
          });
        } else {
          // No attendance - absent (only count if date is not in the future AND after start date)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isInPast = dateObj <= today;

          // Only count as absent if employee has started working
          if (isInPast) {
            absentCount++;
          }

          dailyStatus.push({
            date: day,
            isWeekend: false,
            isNotStarted: false,
            checkIn: false,
            checkOut: false,
            isLate: false,
            lateMinutes: 0,
            isEarly: false,
            earlyMinutes: 0,
          });
        }
      }

      return {
        id: employee.id,
        name: employee.name,
        department: employee.department?.name || '-',
        dailyStatus,
        summary: {
          lateCount,
          totalLateMinutes,
          earlyCount,
          totalEarlyMinutes,
          absentCount,
        },
      };
    });

    // Calculate working days (days that are not holidays for anyone - approximation)
    const workingDays = daysInMonth;

    console.log('[DEBUG] getMonthlyAttendanceGrid completed successfully');

    return {
      year,
      month,
      daysInMonth,
      displayDays,
      workingDays,
      employees: employeeData,
    };
    } catch (error) {
      console.error('[ERROR] getMonthlyAttendanceGrid failed:', error);
      console.error('[ERROR] Stack trace:', error.stack);
      throw error;
    }
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

  async getDashboardStats(userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build branch filter
    let branchFilter: any = null;
    if (userId) {
      branchFilter = await this.branchAccessService.getBranchFilter(userId);
    }

    const employeeWhere: any = { role: 'EMPLOYEE', isActive: true };
    const attendanceWhere: any = {};
    if (branchFilter) {
      employeeWhere.branchId = branchFilter.branchId;
      attendanceWhere.user = { branchId: branchFilter.branchId };
    }

    const totalEmployees = await this.prisma.user.count({
      where: employeeWhere,
    });

    const todayCheckIns = await this.prisma.attendance.count({
      where: {
        ...attendanceWhere,
        type: AttendanceType.CHECK_IN,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayCheckOuts = await this.prisma.attendance.count({
      where: {
        ...attendanceWhere,
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
        ...attendanceWhere,
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

  async getEmployeeDetailReport(userId: string, startDate: Date, endDate: Date, branchId?: string) {
    // Note: branchId parameter is for API consistency but not used since we filter by specific userId

    // 1. Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        position: true,
        department: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Get holidays in range (for this specific user)
    const holidayMap = await this.holidaysService.getHolidaysInRange(startDate, endDate, userId);

    // 3. Get all attendance in range
    const attendances = await this.prisma.attendance.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Helper to format date as YYYY-MM-DD in local time
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // 4. Group attendance by date
    const attendanceByDate = new Map<string, { checkIn: any; checkOut: any }>();
    attendances.forEach((attendance) => {
      const dateStr = formatLocalDate(new Date(attendance.timestamp));
      if (!attendanceByDate.has(dateStr)) {
        attendanceByDate.set(dateStr, { checkIn: null, checkOut: null });
      }
      const record = attendanceByDate.get(dateStr)!;
      if (attendance.type === AttendanceType.CHECK_IN) {
        record.checkIn = attendance;
      } else {
        record.checkOut = attendance;
      }
    });

    // 5. Build daily records and calculate summary
    const dailyRecords: any[] = [];
    let workingDays = 0;
    let presentDays = 0;
    let lateDays = 0;
    let earlyDays = 0;
    let absentDays = 0;
    let totalLateMinutes = 0;
    let totalEarlyMinutes = 0;

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (current <= endDate) {
      const dateStr = formatLocalDate(current);
      const dayName = dayNames[current.getDay()];
      const isHoliday = holidayMap.has(dateStr);
      const holidayName = holidayMap.get(dateStr);
      const isInPast = current <= today;

      const record = attendanceByDate.get(dateStr);

      if (isHoliday) {
        // Holiday - not a working day
        dailyRecords.push({
          date: dateStr,
          dayName,
          isHoliday: true,
          holidayName,
          checkIn: null,
          checkOut: null,
          status: 'HOLIDAY',
        });
      } else {
        // Working day
        workingDays++;

        if (record) {
          // Has attendance
          const checkInData = record.checkIn ? {
            time: record.checkIn.timestamp.toISOString(),
            isLate: record.checkIn.isLate || false,
            lateMinutes: record.checkIn.lateMinutes || 0,
          } : null;

          const checkOutData = record.checkOut ? {
            time: record.checkOut.timestamp.toISOString(),
            isEarly: record.checkOut.isEarlyCheckout || false,
            earlyMinutes: record.checkOut.earlyMinutes || 0,
          } : null;

          // Determine status
          let status = 'PRESENT';
          if (checkInData?.isLate) {
            status = 'LATE';
            lateDays++;
            totalLateMinutes += checkInData.lateMinutes;
          }
          if (checkOutData?.isEarly) {
            if (status === 'PRESENT') status = 'EARLY';
            earlyDays++;
            totalEarlyMinutes += checkOutData.earlyMinutes;
          }

          presentDays++;

          dailyRecords.push({
            date: dateStr,
            dayName,
            isHoliday: false,
            checkIn: checkInData,
            checkOut: checkOutData,
            status,
          });
        } else if (isInPast) {
          // No attendance and date is in past - absent
          absentDays++;
          dailyRecords.push({
            date: dateStr,
            dayName,
            isHoliday: false,
            checkIn: null,
            checkOut: null,
            status: 'ABSENT',
          });
        } else {
          // Future date - no status yet
          dailyRecords.push({
            date: dateStr,
            dayName,
            isHoliday: false,
            checkIn: null,
            checkOut: null,
            status: 'FUTURE',
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        department: user.department?.name || '-',
        position: user.position || '-',
      },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        workingDays,
        presentDays,
        lateDays,
        earlyDays,
        absentDays,
        attendanceRate: workingDays > 0 ? (presentDays / workingDays) * 100 : 0,
        totalLateMinutes,
        totalEarlyMinutes,
      },
      dailyRecords,
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

  private calculateWorkingDaysWithHolidays(startDate: Date, endDate: Date, holidaySet: Set<number>): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      // Only exclude holidays from holidays table, NOT automatic weekend detection
      const isHoliday = holidaySet.has(current.getDate());

      if (!isHoliday) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  async getDashboardPresence(userId?: string) {
    // Build branch filter
    let branchFilter: any = null;
    if (userId) {
      branchFilter = await this.branchAccessService.getBranchFilter(userId);
    }

    const employeeWhere: any = { role: 'EMPLOYEE', isActive: true };
    if (branchFilter) {
      employeeWhere.branchId = branchFilter.branchId;
    }

    // Get all active employees
    const employees = await this.prisma.user.findMany({
      where: employeeWhere,
      select: {
        id: true,
        name: true,
        faceImageUrl: true,
        department: { select: { name: true } },
      },
    });

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        timestamp: { gte: today, lt: tomorrow },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by user with late/early info
    const userAttendance = new Map<string, {
      checkIn: Date | null;
      checkOut: Date | null;
      isLate: boolean;
      lateMinutes: number;
      isEarlyCheckout: boolean;
      earlyMinutes: number;
    }>();

    for (const att of attendances) {
      if (!userAttendance.has(att.userId)) {
        userAttendance.set(att.userId, {
          checkIn: null,
          checkOut: null,
          isLate: false,
          lateMinutes: 0,
          isEarlyCheckout: false,
          earlyMinutes: 0,
        });
      }
      const record = userAttendance.get(att.userId)!;
      if (att.type === AttendanceType.CHECK_IN) {
        record.checkIn = att.timestamp;
        record.isLate = att.isLate || false;
        record.lateMinutes = att.lateMinutes || 0;
      }
      if (att.type === AttendanceType.CHECK_OUT) {
        record.checkOut = att.timestamp;
        record.isEarlyCheckout = att.isEarlyCheckout || false;
        record.earlyMinutes = att.earlyMinutes || 0;
      }
    }

    const inStore: Array<{
      id: string;
      name: string;
      faceImageUrl: string | null;
      department: string;
      checkInTime: string;
      isLate: boolean;
      lateMinutes: number;
    }> = [];

    const notInStore: Array<{
      id: string;
      name: string;
      faceImageUrl: string | null;
      department: string;
      status: 'not_checked_in' | 'checked_out';
      checkOutTime: string | null;
      isEarlyCheckout: boolean;
      earlyMinutes: number;
    }> = [];

    for (const emp of employees) {
      const att = userAttendance.get(emp.id);
      if (att && att.checkIn && !att.checkOut) {
        // Di toko: sudah masuk, belum pulang
        inStore.push({
          id: emp.id,
          name: emp.name,
          faceImageUrl: emp.faceImageUrl,
          department: emp.department?.name || '-',
          checkInTime: att.checkIn.toISOString(),
          isLate: att.isLate,
          lateMinutes: att.lateMinutes,
        });
      } else {
        // Belum di toko: belum masuk ATAU sudah pulang
        notInStore.push({
          id: emp.id,
          name: emp.name,
          faceImageUrl: emp.faceImageUrl,
          department: emp.department?.name || '-',
          status: att?.checkOut ? 'checked_out' : 'not_checked_in',
          checkOutTime: att?.checkOut?.toISOString() || null,
          isEarlyCheckout: att?.isEarlyCheckout || false,
          earlyMinutes: att?.earlyMinutes || 0,
        });
      }
    }

    return { inStore, notInStore };
  }
}
