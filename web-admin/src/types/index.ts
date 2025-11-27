// Department Types
export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    workSchedules: number;
  };
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email?: string; // Nullable for EMPLOYEE (only ADMIN has email)
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  position?: string;
  departmentId?: string;
  department?: Department;
  phone?: string;
  isActive: boolean;
  faceImageUrl?: string;
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
  departmentId?: string;
  isActive?: boolean;
}

// Attendance Types
export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export interface Attendance {
  id: string;
  userId: string;
  type: AttendanceType;
  faceImageUrl?: string;
  similarity?: number;
  // Late/Early tracking
  isLate?: boolean;
  lateMinutes?: number;
  isEarlyCheckout?: boolean;
  earlyMinutes?: number;
  scheduledTime?: string;
  // Additional info
  notes?: string;
  isVerified: boolean;
  timestamp: string;
  createdAt: string;
  user?: User;
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
  email?: string; // Optional, only required for ADMIN role
  password?: string; // Optional, only required for ADMIN role
  role?: 'ADMIN' | 'EMPLOYEE';
  position?: string;
  departmentId?: string;
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

// Work Schedule Types
export interface WorkSchedule {
  id: string;
  departmentId: string;
  department: Department;
  checkInTime: string;  // Format: "HH:MM"
  checkOutTime: string; // Format: "HH:MM"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkScheduleDto {
  departmentId: string;
  checkInTime: string;
  checkOutTime: string;
  isActive?: boolean;
}

export interface UpdateWorkScheduleDto {
  departmentId?: string;
  checkInTime?: string;
  checkOutTime?: string;
  isActive?: boolean;
}

// Employee Detail Report Types
export interface EmployeeDetailReportUser {
  id: string;
  name: string;
  department: string;
  position: string;
}

export interface EmployeeDetailReportPeriod {
  startDate: string;
  endDate: string;
}

export interface EmployeeDetailReportSummary {
  workingDays: number;
  presentDays: number;
  lateDays: number;
  earlyDays: number;
  absentDays: number;
  attendanceRate: number;
  totalLateMinutes: number;
  totalEarlyMinutes: number;
}

export interface EmployeeDetailCheckIn {
  time: string;
  isLate: boolean;
  lateMinutes: number;
}

export interface EmployeeDetailCheckOut {
  time: string;
  isEarly: boolean;
  earlyMinutes: number;
}

export interface EmployeeDetailDailyRecord {
  date: string;
  dayName: string;
  isHoliday: boolean;
  holidayName?: string;
  checkIn: EmployeeDetailCheckIn | null;
  checkOut: EmployeeDetailCheckOut | null;
  status: 'PRESENT' | 'LATE' | 'EARLY' | 'ABSENT' | 'HOLIDAY' | 'FUTURE';
}

export interface EmployeeDetailReport {
  user: EmployeeDetailReportUser;
  period: EmployeeDetailReportPeriod;
  summary: EmployeeDetailReportSummary;
  dailyRecords: EmployeeDetailDailyRecord[];
}

// Face Match Attempt Types (for debugging)
export interface FaceMatchAttempt {
  id: string;
  attemptType: 'CHECK_IN' | 'CHECK_OUT';
  success: boolean;
  matchedUserId?: string;
  matchedUserName?: string;
  threshold: number;
  bestDistance?: number;
  bestSimilarity?: number;
  totalUsersCompared: number;
  allMatches: string; // JSON string
  createdAt: string;
}

export interface UserMatchInfo {
  rank: number;
  odId: string;
  name: string;
  distance: number;
  similarity: number;
  isMatch: boolean;
}

export interface FaceMatchAttemptListResponse {
  data: FaceMatchAttempt[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
