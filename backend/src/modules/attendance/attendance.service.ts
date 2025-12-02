import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FaceRecognitionMlService } from '../face-registration/face-recognition-ml.service';
import { SettingsService } from '../settings/settings.service';
import { CreateAttendanceDto, VerifyFaceDto, VerifyDeviceDto, LogAttemptDto } from './dto';
import { AttendanceType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private faceRecognitionMl: FaceRecognitionMlService,
    private settingsService: SettingsService,
  ) {}

  private readonly DEFAULT_FACE_DISTANCE_THRESHOLD = 0.6; // Fallback threshold
  private readonly WIB_OFFSET_HOURS = 7; // WIB = UTC+7

  /**
   * Get face distance threshold from settings
   */
  private async getFaceDistanceThreshold(): Promise<number> {
    return this.settingsService.getSimilarityThreshold();
  }

  /**
   * Convert UTC date to WIB hours and minutes
   */
  private getWIBTime(date: Date): { hours: number; minutes: number } {
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();

    // Add WIB offset (UTC+7)
    let wibHours = utcHours + this.WIB_OFFSET_HOURS;

    // Handle day overflow
    if (wibHours >= 24) {
      wibHours -= 24;
    }

    return { hours: wibHours, minutes: utcMinutes };
  }

  /**
   * Calculate late/early status based on work schedule
   */
  private async calculateLateEarlyStatus(
    userId: string,
    type: AttendanceType,
    timestamp: Date,
  ): Promise<{
    isLate?: boolean;
    lateMinutes?: number;
    isEarlyCheckout?: boolean;
    earlyMinutes?: number;
    scheduledTime?: string;
  }> {
    // Get user with department
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          include: {
            workSchedules: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });


    if (!user?.department?.workSchedules?.[0]) {
      // No schedule found, return empty
      return {};
    }

    const schedule = user.department.workSchedules[0];

    // Convert to WIB timezone (UTC+7) for comparison with schedule
    const wibTime = this.getWIBTime(timestamp);
    const currentHour = wibTime.hours;
    const currentMinute = wibTime.minutes;
    const currentTotalMinutes = currentHour * 60 + currentMinute;


    if (type === AttendanceType.CHECK_IN) {
      // Parse scheduled check-in time
      const [scheduleHour, scheduleMinute] = schedule.checkInTime.split(':').map(Number);
      const scheduleTotalMinutes = scheduleHour * 60 + scheduleMinute;

      const diffMinutes = currentTotalMinutes - scheduleTotalMinutes;


      return {
        isLate: diffMinutes > 0,
        lateMinutes: diffMinutes > 0 ? diffMinutes : null,
        scheduledTime: schedule.checkInTime,
      };
    } else {
      // CHECK_OUT
      // Parse scheduled check-out time
      const [scheduleHour, scheduleMinute] = schedule.checkOutTime.split(':').map(Number);
      const scheduleTotalMinutes = scheduleHour * 60 + scheduleMinute;

      const diffMinutes = scheduleTotalMinutes - currentTotalMinutes;

      return {
        isEarlyCheckout: diffMinutes > 0,
        earlyMinutes: diffMinutes > 0 ? diffMinutes : null,
        scheduledTime: schedule.checkOutTime,
      };
    }
  }

  async create(userId: string, dto: CreateAttendanceDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dto.type === AttendanceType.CHECK_IN) {
      const existingCheckIn = await this.prisma.attendance.findFirst({
        where: {
          userId,
          type: AttendanceType.CHECK_IN,
          timestamp: {
            gte: today,
          },
        },
      });

      if (existingCheckIn) {
        throw new BadRequestException('You have already checked in today');
      }
    }

    if (dto.type === AttendanceType.CHECK_OUT) {
      const todayCheckIn = await this.prisma.attendance.findFirst({
        where: {
          userId,
          type: AttendanceType.CHECK_IN,
          timestamp: {
            gte: today,
          },
        },
      });

      if (!todayCheckIn) {
        throw new BadRequestException('You must check in before checking out');
      }

      const existingCheckOut = await this.prisma.attendance.findFirst({
        where: {
          userId,
          type: AttendanceType.CHECK_OUT,
          timestamp: {
            gte: today,
          },
        },
      });

      if (existingCheckOut) {
        throw new BadRequestException('You have already checked out today');
      }
    }

    // Calculate late/early status based on work schedule
    const timestamp = new Date();
    const lateEarlyStatus = await this.calculateLateEarlyStatus(userId, dto.type, timestamp);

    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        type: dto.type,
        faceImageUrl: dto.faceImageUrl,
        similarity: dto.similarity,
        notes: dto.notes,
        timestamp,
        isLate: lateEarlyStatus.isLate,
        lateMinutes: lateEarlyStatus.lateMinutes,
        isEarlyCheckout: lateEarlyStatus.isEarlyCheckout,
        earlyMinutes: lateEarlyStatus.earlyMinutes,
        scheduledTime: lateEarlyStatus.scheduledTime,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return attendance;
  }

  async verifyFaceAndLocation(userId: string, dto: VerifyFaceDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        faceRegistration: true,  // Include FaceRegistration to check approval status
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive. Please contact administrator.');
    }

    // Check if face registration exists and is approved
    if (!user.faceRegistration) {
      throw new BadRequestException('Face not registered. Please register your face first.');
    }

    if (user.faceRegistration.status === 'PENDING') {
      throw new UnauthorizedException(
        'Face registration pending approval. Please wait for admin to approve your registration.',
      );
    }

    if (user.faceRegistration.status === 'REJECTED') {
      throw new UnauthorizedException(
        'Face registration was rejected. Please contact administrator or re-register.',
      );
    }

    // Verify face embedding exists (should exist if approved, but double check)
    if (!user.faceEmbedding && !user.faceEmbeddings) {
      throw new BadRequestException('Face data not found. Please contact administrator.');
    }

    // Parse user's multiple embeddings for better accuracy
    const userEmbeddings = this.parseUserEmbeddings(user);
    if (userEmbeddings.length === 0) {
      throw new BadRequestException('Face data is invalid. Please contact administrator.');
    }

    // Parse provided embedding
    let providedEmbedding: number[];
    try {
      providedEmbedding = JSON.parse(dto.faceEmbedding);
    } catch {
      throw new BadRequestException('Invalid face embedding format');
    }

    // Find best distance across all user's embeddings
    const distance = this.findBestDistanceForUser(providedEmbedding, userEmbeddings);

    // Get dynamic threshold from settings
    const threshold = await this.getFaceDistanceThreshold();

    // Lower distance = more similar (dlib standard)
    // If distance > threshold, faces are too different
    if (distance > threshold) {
      throw new UnauthorizedException('Face verification failed');
    }

    // No location validation needed - face recognition only
    // Convert distance to similarity percentage for display (1 - distance)
    const similarity = Math.max(0, 1 - distance);
    return {
      verified: true,
      similarity,
    };
  }

  async getUserAttendances(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });
  }

  async getTodayAttendance(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findMany({
      where: {
        userId,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Get ALL today's attendance (public - no auth required)
   * Returns grouped attendance per user (one card per user with masuk/pulang times)
   * Sorted by recent activity (latest timestamp first)
   */
  async getTodayAllAttendance() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all attendance records for today
    const attendances = await this.prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
            faceImageUrl: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by user - combine MASUK and PULANG into one record
    const userAttendanceMap = new Map<string, any>();

    for (const attendance of attendances) {
      const userId = attendance.userId;

      if (!userAttendanceMap.has(userId)) {
        userAttendanceMap.set(userId, {
          id: `${userId}-${today.toISOString().split('T')[0]}`,
          userId: userId,
          user: attendance.user,
          checkInTime: null,
          checkOutTime: null,
          checkInTimestamp: null,
          checkOutTimestamp: null,
          latestActivity: attendance.timestamp,
        });
      }

      const record = userAttendanceMap.get(userId);

      if (attendance.type === 'CHECK_IN') {
        record.checkInTime = attendance.timestamp;
        record.checkInTimestamp = attendance.timestamp;
      } else if (attendance.type === 'CHECK_OUT') {
        record.checkOutTime = attendance.timestamp;
        record.checkOutTimestamp = attendance.timestamp;
      }

      // Update latest activity to the most recent timestamp
      if (new Date(attendance.timestamp) > new Date(record.latestActivity)) {
        record.latestActivity = attendance.timestamp;
      }
    }

    // Convert map to array and sort by latest activity (most recent first)
    const result = Array.from(userAttendanceMap.values())
      .sort((a, b) => new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime());

    return result;
  }

  async getAllAttendances(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        // Start of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.timestamp.gte = start;
      }
      if (endDate) {
        // End of day (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            department: true,
            faceImageUrl: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Verify face and location without authentication (anonymous check-in)
   * Matches face embedding against ALL approved users in database
   * Used for check-in/check-out without login requirement
   */
  async verifyFaceAnonymous(
    faceEmbedding: string,
    type: AttendanceType,
  ) {
    // Check if input is base64 image or JSON embedding
    let providedEmbedding: number[];

    // Try to parse as JSON first (for backwards compatibility)
    try {
      providedEmbedding = JSON.parse(faceEmbedding);
    } catch {
      // If parsing fails, assume it's a base64 image
      // Extract embedding using ML service
      try {
        providedEmbedding = await this.faceRecognitionMl.extractFaceEmbedding(
          faceEmbedding,
        );
      } catch (error) {
        throw new BadRequestException(
          error.message || 'Failed to extract face embedding from image',
        );
      }
    }

    // Get all approved users with face embeddings (include department + schedule)
    // Include both faceEmbedding (legacy) and faceEmbeddings (multiple) for better accuracy
    const approvedUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { faceEmbedding: { not: null } },
          { faceEmbeddings: { not: null } },
        ],
        faceRegistration: {
          status: 'APPROVED',
        },
      },
      include: {
        faceRegistration: true,
        department: {
          include: {
            workSchedules: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (approvedUsers.length === 0) {
      throw new NotFoundException(
        'No approved users found in the system. Please register and get approval first.',
      );
    }

    // Get dynamic threshold from settings
    const threshold = await this.getFaceDistanceThreshold();

    // Find best face match (lowest distance = best match)
    // Uses multiple embeddings per user for better accuracy
    let bestMatch: any = null;
    let bestDistance = Infinity;

    for (const user of approvedUsers) {
      // Parse all embeddings for this user (supports multiple angles)
      const userEmbeddings = this.parseUserEmbeddings(user);
      if (userEmbeddings.length === 0) continue;

      // Find best distance across all user's embeddings
      const distance = this.findBestDistanceForUser(providedEmbedding, userEmbeddings);

      // Lower distance = better match
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = user;
      }
    }

    // Check if best match is within threshold (lower distance = match)
    // If distance > threshold, face is NOT recognized
    if (!bestMatch || bestDistance > threshold) {
      throw new UnauthorizedException(
        `Wajah tidak dikenali. Distance: ${bestDistance.toFixed(4)}. Threshold: ${threshold}. Pastikan wajah Anda sudah terdaftar dan disetujui.`,
      );
    }

    // Validate work schedule exists before creating attendance
    const schedule = bestMatch.department?.workSchedules?.[0];
    if (!schedule) {
      throw new BadRequestException(
        'Anda belum memiliki jadwal kerja. Hubungi administrator untuk mengatur departemen dan jadwal kerja.',
      );
    }

    // No location validation needed - face recognition only

    // Convert distance to similarity percentage for display/storage
    // distance 0 = 100% match, distance 0.6 = ~40% match
    const similarity = Math.max(0, 1 - bestDistance);

    // Create attendance record
    const attendance = await this.create(bestMatch.id, {
      type,
      similarity,
    });

    return {
      ...attendance,
      matchedUser: {
        id: bestMatch.id,
        name: bestMatch.name,
        email: bestMatch.email,
        position: bestMatch.position,
        department: bestMatch.department,
      },
      similarity,
      distance: bestDistance,
    };
  }

  /**
   * Verify face only (without creating attendance) - returns user + schedule info
   * Used for early checkout confirmation flow
   */
  async verifyFaceOnly(faceEmbedding: string) {
    // Check if input is base64 image or JSON embedding
    let providedEmbedding: number[];

    try {
      providedEmbedding = JSON.parse(faceEmbedding);
    } catch {
      try {
        providedEmbedding = await this.faceRecognitionMl.extractFaceEmbedding(faceEmbedding);
      } catch (error) {
        throw new BadRequestException(
          error.message || 'Failed to extract face embedding from image',
        );
      }
    }

    // Get all approved users with face embeddings (supports multiple embeddings)
    const approvedUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { faceEmbedding: { not: null } },
          { faceEmbeddings: { not: null } },
        ],
        faceRegistration: {
          status: 'APPROVED',
        },
      },
      include: {
        faceRegistration: true,
        department: {
          include: {
            workSchedules: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (approvedUsers.length === 0) {
      throw new NotFoundException(
        'No approved users found in the system.',
      );
    }

    // Get dynamic threshold from settings
    const threshold = await this.getFaceDistanceThreshold();

    // Find best face match using multiple embeddings per user
    let bestMatch: any = null;
    let bestDistance = Infinity;

    for (const user of approvedUsers) {
      const userEmbeddings = this.parseUserEmbeddings(user);
      if (userEmbeddings.length === 0) continue;

      const distance = this.findBestDistanceForUser(providedEmbedding, userEmbeddings);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = user;
      }
    }

    // If distance > threshold, face is NOT recognized
    if (!bestMatch || bestDistance > threshold) {
      throw new UnauthorizedException(
        `Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar dan disetujui.`,
      );
    }

    // Get schedule info
    const schedule = bestMatch.department?.workSchedules?.[0];

    // Convert distance to similarity percentage for display
    const similarity = Math.max(0, 1 - bestDistance);

    return {
      verified: true,
      userId: bestMatch.id,
      userName: bestMatch.name,
      similarity,
      distance: bestDistance,
      departmentName: bestMatch.department?.name || null,
      hasSchedule: !!schedule,
      checkInTime: schedule?.checkInTime || null,
      checkOutTime: schedule?.checkOutTime || null,
    };
  }

  /**
   * Get user's work schedule info
   */
  async getUserSchedule(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          include: {
            workSchedules: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.department) {
      return {
        hasSchedule: false,
        message: 'User has no department assigned',
      };
    }

    const schedule = user.department.workSchedules?.[0];
    if (!schedule) {
      return {
        hasSchedule: false,
        message: 'No work schedule for this department',
      };
    }

    return {
      hasSchedule: true,
      checkInTime: schedule.checkInTime,
      checkOutTime: schedule.checkOutTime,
      departmentName: user.department.name,
    };
  }

  /**
   * Delete attendance record by ID (Admin only)
   */
  async delete(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    await this.prisma.attendance.delete({
      where: { id },
    });

    return { message: 'Attendance record deleted successfully' };
  }

  /**
   * Calculate Euclidean Distance between two face embeddings
   * dlib's face_recognition uses Euclidean Distance, NOT Cosine Similarity!
   * Lower distance = more similar faces
   * Threshold: 0.6 (faces with distance < 0.6 are considered same person)
   */
  private calculateEuclideanDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new BadRequestException('Face embedding dimensions do not match');
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Parse user's face embeddings (supports both single and multiple embeddings)
   * Returns array of embeddings for comparison
   */
  private parseUserEmbeddings(user: { faceEmbedding?: string | null; faceEmbeddings?: string | null }): number[][] {
    const embeddings: number[][] = [];

    // Prefer multiple embeddings if available (more accurate)
    if (user.faceEmbeddings) {
      try {
        const parsed = JSON.parse(user.faceEmbeddings);
        if (Array.isArray(parsed) && parsed.length > 0) {
          embeddings.push(...parsed);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Fallback to single embedding if multiple not available
    if (embeddings.length === 0 && user.faceEmbedding) {
      try {
        const parsed = JSON.parse(user.faceEmbedding);
        if (Array.isArray(parsed)) {
          embeddings.push(parsed);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    return embeddings;
  }

  /**
   * Find best (lowest) distance between provided embedding and user's multiple embeddings
   * Compares against all stored embeddings and returns the best match
   */
  private findBestDistanceForUser(
    providedEmbedding: number[],
    userEmbeddings: number[][],
  ): number {
    let bestDistance = Infinity;

    for (const userEmb of userEmbeddings) {
      try {
        const distance = this.calculateEuclideanDistance(providedEmbedding, userEmb);
        if (distance < bestDistance) {
          bestDistance = distance;
        }
      } catch (e) {
        // Skip invalid embeddings (dimension mismatch, etc.)
        continue;
      }
    }

    return bestDistance;
  }

  /**
   * Get all embeddings for device sync
   * Returns all approved users with their face embeddings (supports multiple embeddings)
   * Used by Android app for on-device face recognition
   */
  async syncEmbeddings() {
    const approvedUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { faceEmbedding: { not: null } },
          { faceEmbeddings: { not: null } },
        ],
        faceRegistration: {
          status: 'APPROVED',
        },
      },
      select: {
        id: true,
        name: true,
        faceEmbedding: true,
        faceEmbeddings: true,  // Include multiple embeddings
        faceImageUrl: true,    // Include face image for display
        updatedAt: true,
      },
    });


    // Transform data for Android app
    const embeddings = approvedUsers.map(user => {
      let embeddingsList: number[][] = [];

      // Prefer multiple embeddings if available
      if (user.faceEmbeddings) {
        try {
          embeddingsList = JSON.parse(user.faceEmbeddings);
        } catch (e) {
        }
      }

      // Fallback to single embedding if multiple not available
      if (embeddingsList.length === 0 && user.faceEmbedding) {
        try {
          const singleEmb = JSON.parse(user.faceEmbedding);
          embeddingsList = [singleEmb];
        } catch (e) {
        }
      }

      return {
        odId: user.id,  // Using user.id as unique identifier
        name: user.name,
        embedding: embeddingsList[0] || [],  // First embedding for backward compatibility
        embeddings: embeddingsList,  // All embeddings for multi-match
        embeddingsCount: embeddingsList.length,
        faceImageUrl: user.faceImageUrl || null,  // Face image for confirmation dialog
        updatedAt: user.updatedAt.getTime(),
      };
    });

    // Get current face recognition settings
    const faceDistanceThreshold = await this.getFaceDistanceThreshold();

    return {
      count: embeddings.length,
      embeddings: embeddings,
      syncTimestamp: Date.now(),
      supportsMultipleEmbeddings: true,
      // Include settings for Android app to use dynamically
      settings: {
        faceDistanceThreshold: faceDistanceThreshold,
        updatedAt: Date.now(),
      },
    };
  }

  /**
   * Create attendance from device-verified face
   * Called when Android app verifies face on-device using MobileFaceNet
   * and sends the matched userId to backend
   *
   * NOTE: This trusts the device's face verification
   * Security relies on:
   * 1. App signing/verification
   * 2. MobileFaceNet's accuracy (99.55%)
   */
  async createAttendanceFromDevice(dto: VerifyDeviceDto) {
    // Find user by ID (odId in DTO = user.id in DB)
    const user = await this.prisma.user.findUnique({
      where: { id: dto.odId },
      include: {
        faceRegistration: true,
        department: {
          include: {
            workSchedules: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${dto.odId}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive. Please contact administrator.');
    }

    if (!user.faceRegistration || user.faceRegistration.status !== 'APPROVED') {
      throw new UnauthorizedException('Face registration not approved.');
    }

    // Validate work schedule exists
    const schedule = user.department?.workSchedules?.[0];
    if (!schedule) {
      throw new BadRequestException(
        'Anda belum memiliki jadwal kerja. Hubungi administrator untuk mengatur departemen dan jadwal kerja.',
      );
    }

    // Create attendance record (trusting device verification)
    const attendance = await this.create(user.id, {
      type: dto.type,
      similarity: dto.similarity || (dto.distance ? Math.max(0, 1 - dto.distance) : null),
    });

    return {
      ...attendance,
      matchedUser: {
        id: user.id,
        name: user.name,
        position: user.position,
      },
      verifiedOnDevice: true,
    };
  }

  /**
   * Log face match attempt (both success and failure)
   * Called by Android app after every face matching attempt
   */
  async logFaceMatchAttempt(dto: LogAttemptDto) {
    return this.prisma.faceMatchAttempt.create({
      data: {
        attemptType: dto.attemptType,
        success: dto.success,
        matchedUserId: dto.matchedUserId || null,
        matchedUserName: dto.matchedUserName || null,
        threshold: dto.threshold,
        bestDistance: dto.bestDistance || null,
        bestSimilarity: dto.bestSimilarity || null,
        totalUsersCompared: dto.totalUsersCompared,
        allMatches: dto.allMatches,
      },
    });
  }

  /**
   * Get all face match attempts with pagination
   */
  async getFaceMatchAttempts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.faceMatchAttempt.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.faceMatchAttempt.count(),
    ]);

    return {
      data: attempts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single face match attempt by ID
   */
  async getFaceMatchAttemptById(id: string) {
    const attempt = await this.prisma.faceMatchAttempt.findUnique({
      where: { id },
    });

    if (!attempt) {
      throw new NotFoundException('Face match attempt not found');
    }

    return attempt;
  }

  /**
   * Delete old face match attempts (cleanup)
   */
  async deleteOldAttempts(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.faceMatchAttempt.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deleted: result.count };
  }
}
