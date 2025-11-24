import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceDto, VerifyFaceDto } from './dto';
import { AttendanceType } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private readonly FACE_SIMILARITY_THRESHOLD = 0.6;
  private readonly DEFAULT_LOCATION_RADIUS = 100;

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

    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        type: dto.type,
        latitude: dto.latitude,
        longitude: dto.longitude,
        locationId: dto.locationId,
        faceImageUrl: dto.faceImageUrl,
        similarity: dto.similarity,
        notes: dto.notes,
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
    if (!user.faceEmbedding) {
      throw new BadRequestException('Face data not found. Please contact administrator.');
    }

    const similarity = this.calculateCosineSimilarity(
      JSON.parse(user.faceEmbedding),
      JSON.parse(dto.faceEmbedding),
    );

    if (similarity < this.FACE_SIMILARITY_THRESHOLD) {
      throw new UnauthorizedException('Face verification failed');
    }

    const locations = await this.prisma.location.findMany({
      where: { isActive: true },
    });

    let validLocation = null;
    for (const location of locations) {
      const distance = this.calculateDistance(
        dto.latitude,
        dto.longitude,
        location.latitude,
        location.longitude,
      );

      if (distance <= location.radius) {
        validLocation = location;
        break;
      }
    }

    if (!validLocation && locations.length > 0) {
      throw new BadRequestException('You are outside the allowed location radius');
    }

    return {
      verified: true,
      similarity,
      locationId: validLocation?.id,
      locationName: validLocation?.name,
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
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
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

  async getAllAttendances(startDate?: Date, endDate?: Date) {
    const where: any = {};

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
        location: {
          select: {
            id: true,
            name: true,
            address: true,
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
    latitude: number,
    longitude: number,
    type: AttendanceType,
  ) {
    // Parse the provided face embedding
    let providedEmbedding: number[];
    try {
      providedEmbedding = JSON.parse(faceEmbedding);
    } catch {
      throw new BadRequestException('Invalid face embedding format');
    }

    // Get all approved users with face embeddings
    const approvedUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        faceEmbedding: { not: null },
        faceRegistration: {
          status: 'APPROVED',
        },
      },
      include: {
        faceRegistration: true,
      },
    });

    if (approvedUsers.length === 0) {
      throw new NotFoundException(
        'No approved users found in the system. Please register and get approval first.',
      );
    }

    // Find best face match
    let bestMatch: any = null;
    let bestSimilarity = 0;

    for (const user of approvedUsers) {
      if (!user.faceEmbedding) continue;

      try {
        const userEmbedding = JSON.parse(user.faceEmbedding);
        const similarity = this.calculateCosineSimilarity(
          providedEmbedding,
          userEmbedding,
        );

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = user;
        }
      } catch (error) {
        // Skip users with invalid embeddings
        continue;
      }
    }

    // Check if best match exceeds threshold
    if (!bestMatch || bestSimilarity < this.FACE_SIMILARITY_THRESHOLD) {
      throw new UnauthorizedException(
        `Face not recognized. Similarity: ${(bestSimilarity * 100).toFixed(1)}%. Please ensure your face is registered and approved.`,
      );
    }

    // Verify location
    const locations = await this.prisma.location.findMany({
      where: { isActive: true },
    });

    let validLocation = null;
    for (const location of locations) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude,
      );

      if (distance <= location.radius) {
        validLocation = location;
        break;
      }
    }

    if (!validLocation && locations.length > 0) {
      throw new BadRequestException(
        'You are outside the allowed location radius',
      );
    }

    // Create attendance record
    const attendance = await this.create(bestMatch.id, {
      type,
      latitude,
      longitude,
      locationId: validLocation?.id,
      similarity: bestSimilarity,
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
      similarity: bestSimilarity,
    };
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new BadRequestException('Face embedding dimensions do not match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
