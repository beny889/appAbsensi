// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  position?: string;
  department?: string;
  phone?: string;
  isActive: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Employee Types
export interface Employee extends User {
  faceImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmployeeDto {
  email?: string;
  name?: string;
  phone?: string;
  position?: string;
  department?: string;
  isActive?: boolean;
}

// Attendance Types
export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export interface Attendance {
  id: string;
  userId: string;
  type: AttendanceType;
  latitude: number;
  longitude: number;
  locationId?: string;
  faceImageUrl?: string;
  similarity?: number;
  notes?: string;
  isVerified: boolean;
  timestamp: string;
  createdAt: string;
  user?: User;
  location?: Location;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
}

// Reports Types
export interface DashboardStats {
  totalEmployees: number;
  todayPresent: number;
  todayAbsent: number;
  todayCheckOuts: number;
  attendanceRate: number;
  monthlyTotalAttendances: number;
}

export interface DailyReport {
  date: string;
  totalEmployees: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  attendanceRate: number;
  attendances: Attendance[];
}

export interface EmployeeStat {
  user: User;
  totalCheckIns: number;
  totalCheckOuts: number;
  attendanceDays: number;
  workingDays: number;
  attendanceRate: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  workingDays: number;
  employeeStats: EmployeeStat[];
  totalCheckIns: number;
  totalCheckOuts: number;
}

// Face Registration Types
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FaceRegistration {
  id: string;
  name: string;
  faceEmbedding: string;
  faceImageUrl?: string;
  status: RegistrationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  userId?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveRegistrationDto {
  email: string;
  password: string;
  role?: 'ADMIN' | 'EMPLOYEE';
  position?: string;
  department?: string;
  phone?: string;
}

export interface RejectRegistrationDto {
  reason: string;
}

export interface FaceRegistrationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// Common Types
export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
