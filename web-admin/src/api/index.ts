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
};

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
