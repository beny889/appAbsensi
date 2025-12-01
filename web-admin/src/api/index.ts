import apiClient from './client';
import {
  Employee,
  UpdateEmployeeDto,
  Attendance,
  DashboardStats,
  DailyReport,
  MonthlyReport,
  WorkSchedule,
  CreateWorkScheduleDto,
  UpdateWorkScheduleDto,
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '@/types';

// Auth API
export * from './auth';

// Employees API
export const employeesApi = {
  getAll: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/employees');
    return response.data;
  },

  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateEmployeeDto): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },
};

// Attendance API
export const attendanceApi = {
  getAll: async (startDate?: string, endDate?: string): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>('/attendance/all', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getUserAttendances: async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Attendance[]> => {
    const response = await apiClient.get<Attendance[]>(`/attendance/user/${userId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/attendance/${id}`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/reports/dashboard');
    return response.data;
  },

  getDailyReport: async (date: string): Promise<DailyReport> => {
    const response = await apiClient.get<DailyReport>('/reports/daily', {
      params: { date },
    });
    return response.data;
  },

  getMonthlyReport: async (year: number, month: number): Promise<MonthlyReport> => {
    const response = await apiClient.get<MonthlyReport>('/reports/monthly', {
      params: { year, month },
    });
    return response.data;
  },

  getMonthlyGrid: async (year: number, month: number): Promise<MonthlyAttendanceGrid> => {
    const response = await apiClient.get<MonthlyAttendanceGrid>('/reports/monthly-grid', {
      params: { year, month },
    });
    return response.data;
  },

  getEmployeeDetailReport: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<import('@/types').EmployeeDetailReport> => {
    const response = await apiClient.get(`/reports/employee/${userId}/details`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getDashboardPresence: async (): Promise<DashboardPresence> => {
    const response = await apiClient.get<DashboardPresence>('/reports/dashboard-presence');
    return response.data;
  },
};

// Types for Monthly Grid
export interface DailyStatus {
  date: number;
  isWeekend: boolean;
  isNotStarted?: boolean; // True if date is before employee's start date
  checkIn: boolean;
  checkOut: boolean;
  isLate: boolean;
  lateMinutes: number;
  isEarly: boolean;
  earlyMinutes: number;
}

export interface EmployeeSummary {
  lateCount: number;
  totalLateMinutes: number;
  earlyCount: number;
  totalEarlyMinutes: number;
  absentCount: number;
}

export interface EmployeeGridData {
  id: string;
  name: string;
  department: string;
  dailyStatus: DailyStatus[];
  summary: EmployeeSummary;
}

export interface MonthlyAttendanceGrid {
  year: number;
  month: number;
  daysInMonth: number;
  displayDays: number;
  workingDays: number;
  employees: EmployeeGridData[];
}

// Dashboard Presence Types
export interface EmployeeInStore {
  id: string;
  name: string;
  faceImageUrl: string | null;
  department: string;
  checkInTime: string;
  isLate: boolean;
  lateMinutes: number;
}

export interface EmployeeNotInStore {
  id: string;
  name: string;
  faceImageUrl: string | null;
  department: string;
  status: 'not_checked_in' | 'checked_out';
  checkOutTime: string | null;
  isEarlyCheckout: boolean;
  earlyMinutes: number;
}

export interface DashboardPresence {
  inStore: EmployeeInStore[];
  notInStore: EmployeeNotInStore[];
}

// Duplicate Check Types
export interface DuplicateMatchedUser {
  id: string;
  name: string;
  similarity: number;
  faceImageUrl: string | null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedUsers: DuplicateMatchedUser[];
}

export interface DuplicateCheckResponse {
  registration: {
    id: string;
    name: string;
    faceImageUrl: string | null;
    status: string;
  };
  duplicateCheck: DuplicateCheckResult;
}

// Face Registration API
export const faceRegistrationApi = {
  getPending: async (): Promise<import('@/types').FaceRegistration[]> => {
    const response = await apiClient.get('/face-registration/pending');
    return response.data;
  },

  getById: async (id: string): Promise<import('@/types').FaceRegistration> => {
    const response = await apiClient.get(`/face-registration/${id}`);
    return response.data;
  },

  checkDuplicate: async (id: string): Promise<DuplicateCheckResponse> => {
    const response = await apiClient.get(`/face-registration/${id}/check-duplicate`);
    return response.data;
  },

  approve: async (
    id: string,
    data: import('@/types').ApproveRegistrationDto
  ): Promise<{ message: string; user: any }> => {
    const response = await apiClient.post(`/face-registration/${id}/approve`, data);
    return response.data;
  },

  reject: async (
    id: string,
    data: import('@/types').RejectRegistrationDto
  ): Promise<{ message: string }> => {
    const response = await apiClient.post(`/face-registration/${id}/reject`, data);
    return response.data;
  },

  replaceFace: async (
    id: string,
    userId: string
  ): Promise<{ message: string; user: { id: string; name: string } }> => {
    const response = await apiClient.post(`/face-registration/${id}/replace-face`, { userId });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/face-registration/${id}`);
    return response.data;
  },

  getStats: async (): Promise<import('@/types').FaceRegistrationStats> => {
    const response = await apiClient.get('/face-registration/stats/overview');
    return response.data;
  },
};

// Department API
export const departmentApi = {
  getAll: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/departments');
    return response.data;
  },

  getById: async (id: string): Promise<Department> => {
    const response = await apiClient.get<Department>(`/departments/${id}`);
    return response.data;
  },

  create: async (data: CreateDepartmentDto): Promise<Department> => {
    const response = await apiClient.post<Department>('/departments', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDepartmentDto): Promise<Department> => {
    const response = await apiClient.put<Department>(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  },
};

// Holiday Types
export interface HolidayUser {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string;
  isGlobal: boolean;
  users: HolidayUser[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayDto {
  date: string;
  name: string;
  description?: string;
  isGlobal?: boolean;
  userIds?: string[];
}

export interface UpdateHolidayDto {
  date?: string;
  name?: string;
  description?: string;
  isGlobal?: boolean;
  userIds?: string[];
}

// Holidays API
export const holidaysApi = {
  getAll: async (): Promise<Holiday[]> => {
    const response = await apiClient.get<Holiday[]>('/holidays');
    return response.data;
  },

  getByYear: async (year: number): Promise<Holiday[]> => {
    const response = await apiClient.get<Holiday[]>('/holidays', {
      params: { year },
    });
    return response.data;
  },

  getByMonth: async (year: number, month: number): Promise<Holiday[]> => {
    const response = await apiClient.get<Holiday[]>('/holidays/month', {
      params: { year, month },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Holiday> => {
    const response = await apiClient.get<Holiday>(`/holidays/${id}`);
    return response.data;
  },

  create: async (data: CreateHolidayDto): Promise<Holiday> => {
    const response = await apiClient.post<Holiday>('/holidays', data);
    return response.data;
  },

  update: async (id: string, data: UpdateHolidayDto): Promise<Holiday> => {
    const response = await apiClient.put<Holiday>(`/holidays/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/holidays/${id}`);
  },
};

// Work Schedule API
export const workScheduleApi = {
  getAll: async (): Promise<WorkSchedule[]> => {
    const response = await apiClient.get<WorkSchedule[]>('/work-schedules');
    return response.data;
  },

  getById: async (id: string): Promise<WorkSchedule> => {
    const response = await apiClient.get<WorkSchedule>(`/work-schedules/${id}`);
    return response.data;
  },

  getByDepartment: async (department: string): Promise<WorkSchedule> => {
    const response = await apiClient.get<WorkSchedule>(`/work-schedules/department/${department}`);
    return response.data;
  },

  create: async (data: CreateWorkScheduleDto): Promise<WorkSchedule> => {
    const response = await apiClient.post<WorkSchedule>('/work-schedules', data);
    return response.data;
  },

  update: async (id: string, data: UpdateWorkScheduleDto): Promise<WorkSchedule> => {
    const response = await apiClient.put<WorkSchedule>(`/work-schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/work-schedules/${id}`);
  },
};

// Settings API
export interface SettingItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const settingsApi = {
  getAll: async (): Promise<SettingItem[]> => {
    const response = await apiClient.get<SettingItem[]>('/settings');
    return response.data;
  },

  getSimilarityThreshold: async (): Promise<{ value: number }> => {
    const response = await apiClient.get<{ value: number }>('/settings/similarity-threshold');
    return response.data;
  },

  updateSimilarityThreshold: async (value: number): Promise<{ message: string; value: number }> => {
    const response = await apiClient.put<{ message: string; value: number }>(
      '/settings/similarity-threshold',
      { value }
    );
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileDto): Promise<UserProfile> => {
    const response = await apiClient.patch<UserProfile>('/auth/profile', data);
    return response.data;
  },
};

// Face Match Attempts API (for debugging face recognition)
export const faceMatchApi = {
  getAttempts: async (
    page: number = 1,
    limit: number = 20
  ): Promise<import('@/types').FaceMatchAttemptListResponse> => {
    const response = await apiClient.get('/attendance/face-match-attempts', {
      params: { page, limit },
    });
    return response.data;
  },

  getAttemptById: async (id: string): Promise<import('@/types').FaceMatchAttempt> => {
    const response = await apiClient.get(`/attendance/face-match-attempts/${id}`);
    return response.data;
  },

  cleanup: async (daysOld: number = 30): Promise<{ message: string; deletedCount: number }> => {
    const response = await apiClient.delete('/attendance/face-match-attempts/cleanup', {
      params: { daysOld },
    });
    return response.data;
  },
};
