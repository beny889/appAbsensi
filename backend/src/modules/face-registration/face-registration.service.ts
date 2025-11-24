import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SubmitFaceRegistrationDto,
  ApproveRegistrationDto,
  RejectRegistrationDto,
} from './dto';
import { RegistrationStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FaceRegistrationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit new face registration (public endpoint)
   */
  async submitRegistration(dto: SubmitFaceRegistrationDto) {
    let faceEmbedding: string;
    let faceImageUrl: string | undefined;

    // Handle face image base64 input
    if (dto.faceImageBase64) {
      // Generate placeholder embedding from base64 image
      // TODO: Replace with actual face embedding extraction using ML library
      faceEmbedding = this.generatePlaceholderEmbedding();

      // Convert base64 to data URL for storage
      faceImageUrl = `data:image/jpeg;base64,${dto.faceImageBase64}`;
    } else {
      // Use provided embedding
      faceEmbedding = dto.faceEmbedding!;
      faceImageUrl = dto.faceImageUrl;
    }

    // Check for duplicate face
    const isDuplicate = await this.checkDuplicateFace(faceEmbedding);
    if (isDuplicate) {
      throw new ConflictException(
        'This face is already registered. Please contact admin if you believe this is an error.',
      );
    }

    // Create registration
    const registration = await this.prisma.faceRegistration.create({
      data: {
        name: dto.name,
        faceEmbedding: faceEmbedding,
        faceImageUrl: faceImageUrl,
        status: RegistrationStatus.PENDING,
      },
    });

    return {
      id: registration.id,
      message: 'Registration submitted successfully. Please wait for admin approval.',
      status: registration.status,
    };
  }

  /**
   * Get all pending registrations (admin only)
   */
  async getPendingRegistrations() {
    const registrations = await this.prisma.faceRegistration.findMany({
      where: {
        status: RegistrationStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        faceImageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return registrations;
  }

  /**
   * Get registration by ID (admin only)
   */
  async getRegistrationById(id: string) {
    const registration = await this.prisma.faceRegistration.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  /**
   * Approve registration and create user account (admin only)
   */
  async approveRegistration(
    id: string,
    dto: ApproveRegistrationDto,
    adminId: string,
  ) {
    // Get registration
    const registration = await this.getRegistrationById(id);

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException(
        `Registration has already been ${registration.status.toLowerCase()}`,
      );
    }

    // Auto-generate email if not provided
    let email = dto.email;
    if (!email) {
      // Generate email from name: "John Doe" -> "john.doe@absensi.local"
      const namePart = registration.name
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
      email = `${namePart}@absensi.local`;

      // Ensure email is unique by adding number suffix if needed
      let counter = 1;
      let tempEmail = email;
      while (await this.prisma.user.findUnique({ where: { email: tempEmail } })) {
        tempEmail = `${namePart}${counter}@absensi.local`;
        counter++;
      }
      email = tempEmail;
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Auto-generate password if not provided (random 12-character password)
    const password = dto.password || this.generateRandomPassword(12);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and update registration in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user with face data
      const user = await tx.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: registration.name,
          role: dto.role || Role.EMPLOYEE,
          position: dto.position,
          department: dto.department,
          phone: dto.phone,
          faceEmbedding: registration.faceEmbedding,
          faceImageUrl: registration.faceImageUrl,
          isActive: true,
        },
      });

      // Update registration status
      const updatedRegistration = await tx.faceRegistration.update({
        where: { id },
        data: {
          status: RegistrationStatus.APPROVED,
          userId: user.id,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      return { user, registration: updatedRegistration };
    });

    return {
      message: 'Registration approved successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    };
  }

  /**
   * Reject registration (admin only)
   */
  async rejectRegistration(
    id: string,
    dto: RejectRegistrationDto,
    adminId: string,
  ) {
    // Get registration
    const registration = await this.getRegistrationById(id);

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException(
        `Registration has already been ${registration.status.toLowerCase()}`,
      );
    }

    // Update registration
    const updatedRegistration = await this.prisma.faceRegistration.update({
      where: { id },
      data: {
        status: RegistrationStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    return {
      message: 'Registration rejected successfully',
      registration: {
        id: updatedRegistration.id,
        name: updatedRegistration.name,
        status: updatedRegistration.status,
        rejectionReason: updatedRegistration.rejectionReason,
      },
    };
  }

  /**
   * Delete registration (admin only)
   */
  async deleteRegistration(id: string) {
    // Get registration to ensure it exists
    await this.getRegistrationById(id);

    await this.prisma.faceRegistration.delete({
      where: { id },
    });

    return {
      message: 'Registration deleted successfully',
    };
  }

  /**
   * Check if face embedding already exists (duplicate detection)
   * Uses cosine similarity to compare face embeddings
   */
  private async checkDuplicateFace(faceEmbedding: string): Promise<boolean> {
    const SIMILARITY_THRESHOLD = 0.8; // 80% similarity threshold

    // Parse the embedding (assuming it's a JSON string of array)
    let newEmbedding: number[];
    try {
      newEmbedding = JSON.parse(faceEmbedding);
    } catch {
      throw new BadRequestException('Invalid face embedding format');
    }

    // Check against existing users
    const users = await this.prisma.user.findMany({
      where: {
        faceEmbedding: { not: null },
      },
      select: {
        faceEmbedding: true,
      },
    });

    for (const user of users) {
      if (user.faceEmbedding) {
        const existingEmbedding = JSON.parse(user.faceEmbedding);
        const similarity = this.calculateCosineSimilarity(
          newEmbedding,
          existingEmbedding,
        );

        if (similarity >= SIMILARITY_THRESHOLD) {
          return true; // Duplicate found
        }
      }
    }

    // Check against pending registrations
    const pendingRegistrations = await this.prisma.faceRegistration.findMany({
      where: {
        status: RegistrationStatus.PENDING,
      },
      select: {
        faceEmbedding: true,
      },
    });

    for (const registration of pendingRegistrations) {
      const existingEmbedding = JSON.parse(registration.faceEmbedding);
      const similarity = this.calculateCosineSimilarity(
        newEmbedding,
        existingEmbedding,
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        return true; // Duplicate found
      }
    }

    return false; // No duplicate found
  }

  /**
   * Calculate cosine similarity between two face embeddings
   * Returns a value between 0 and 1 (1 = identical, 0 = completely different)
   */
  private calculateCosineSimilarity(
    embedding1: number[],
    embedding2: number[],
  ): number {
    if (embedding1.length !== embedding2.length) {
      // Different dimensions - not a match, return 0 similarity
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Get statistics for admin dashboard (optional)
   */
  async getStatistics() {
    const [pending, approved, rejected, total] = await Promise.all([
      this.prisma.faceRegistration.count({
        where: { status: RegistrationStatus.PENDING },
      }),
      this.prisma.faceRegistration.count({
        where: { status: RegistrationStatus.APPROVED },
      }),
      this.prisma.faceRegistration.count({
        where: { status: RegistrationStatus.REJECTED },
      }),
      this.prisma.faceRegistration.count(),
    ]);

    return {
      pending,
      approved,
      rejected,
      total,
    };
  }

  /**
   * Generate placeholder face embedding (for MVP)
   * TODO: Replace with actual face embedding extraction using ML library
   * For now, generates a random 128-dimensional vector
   */
  private generatePlaceholderEmbedding(): string {
    const embeddingSize = 128;
    const embedding: number[] = [];

    // Generate random normalized vector
    for (let i = 0; i < embeddingSize; i++) {
      embedding.push(Math.random() * 2 - 1); // Random values between -1 and 1
    }

    // Normalize the vector
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );

    const normalizedEmbedding = embedding.map((val) => val / magnitude);

    return JSON.stringify(normalizedEmbedding);
  }

  /**
   * Generate random password for auto-generated accounts
   * Creates a secure random password with letters, numbers, and special characters
   */
  private generateRandomPassword(length: number = 12): string {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*';

    const allChars = uppercaseChars + lowercaseChars + numbers + specialChars;

    let password = '';

    // Ensure at least one of each character type
    password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
