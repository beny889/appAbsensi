import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FaceRecognitionMlService } from './face-recognition-ml.service';
import {
  SubmitFaceRegistrationDto,
  ApproveRegistrationDto,
  RejectRegistrationDto,
  ReplaceFaceDto,
} from './dto';
import { RegistrationStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FaceRegistrationService {
  constructor(
    private prisma: PrismaService,
    private faceRecognitionMl: FaceRecognitionMlService,
  ) {}

  /**
   * Submit new face registration (public endpoint)
   * Supports both single embedding (legacy) and multiple embeddings (new)
   */
  async submitRegistration(dto: SubmitFaceRegistrationDto) {
    let faceEmbedding: string | null = null;
    let faceEmbeddings: string | null = null;
    let faceImageUrl: string | undefined;

    // Handle multiple embeddings from Android (embeddings + images sent together)
    if (dto.faceEmbeddings && dto.faceEmbeddings.length > 0) {
      // Parse and log each embedding for debugging
      const parsedEmbeddings = dto.faceEmbeddings.map((e, index) => {
        const parsed = JSON.parse(e);
        return parsed;
      });

      faceEmbeddings = JSON.stringify(parsedEmbeddings);
      faceEmbedding = dto.faceEmbeddings[0]; // First one for backward compatibility

      // Use first image from faceImagesBase64 if available, otherwise use faceImageUrl
      if (dto.faceImagesBase64 && dto.faceImagesBase64.length > 0) {
        // Images might already have data:image prefix from Android
        const firstImage = dto.faceImagesBase64[0];
        faceImageUrl = firstImage.startsWith('data:image')
          ? firstImage
          : `data:image/jpeg;base64,${firstImage}`;
      } else {
        faceImageUrl = dto.faceImageUrl;
      }
    }
    // Handle multiple face images without embeddings (server extracts embeddings)
    else if (dto.faceImagesBase64 && dto.faceImagesBase64.length > 0) {
      const embeddings: number[][] = [];

      for (const imageBase64 of dto.faceImagesBase64) {
        try {
          // Remove data URL prefix if present
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const embedding = await this.faceRecognitionMl.extractFaceEmbedding(cleanBase64);
          embeddings.push(embedding);
        } catch (error) {
          throw new BadRequestException(
            error.message || 'Failed to extract face embedding from one of the images',
          );
        }
      }

      // Store all embeddings as JSON array
      faceEmbeddings = JSON.stringify(embeddings);

      // Use first image as profile photo
      const firstImage = dto.faceImagesBase64[0];
      faceImageUrl = firstImage.startsWith('data:image')
        ? firstImage
        : `data:image/jpeg;base64,${firstImage}`;

      // Also set single embedding for backward compatibility (use first one)
      faceEmbedding = JSON.stringify(embeddings[0]);
    }
    // Handle single face image (legacy)
    else if (dto.faceImageBase64) {
      try {
        const embedding = await this.faceRecognitionMl.extractFaceEmbedding(
          dto.faceImageBase64,
        );
        faceEmbedding = JSON.stringify(embedding);
        // Wrap single embedding in array for faceEmbeddings
        faceEmbeddings = JSON.stringify([embedding]);
      } catch (error) {
        throw new BadRequestException(
          error.message || 'Failed to extract face embedding from image',
        );
      }
      faceImageUrl = `data:image/jpeg;base64,${dto.faceImageBase64}`;
    }
    // Handle single embedding (legacy)
    else if (dto.faceEmbedding) {
      faceEmbedding = dto.faceEmbedding;
      // Wrap single embedding in array for faceEmbeddings
      faceEmbeddings = JSON.stringify([JSON.parse(dto.faceEmbedding)]);
      faceImageUrl = dto.faceImageUrl;
    } else {
      throw new BadRequestException('No face data provided');
    }

    // NOTE: Duplicate check moved to admin approval phase (previewDuplicate)
    // This allows registrations with similar faces to enter PENDING state
    // Admin will see warning and decide whether to approve or use "Replace Face"

    // Create registration with both single and multiple embeddings
    const registration = await this.prisma.faceRegistration.create({
      data: {
        name: dto.name,
        faceEmbedding: faceEmbedding,
        faceEmbeddings: faceEmbeddings,
        faceImageUrl: faceImageUrl,
        status: RegistrationStatus.PENDING,
      },
    });

    return {
      id: registration.id,
      message: 'Registration submitted successfully. Please wait for admin approval.',
      status: registration.status,
      embeddingsCount: faceEmbeddings ? JSON.parse(faceEmbeddings).length : 1,
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

    // Validate departmentId if provided
    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new BadRequestException(
          `Department with ID "${dto.departmentId}" not found. Please select a valid department.`
        );
      }
      if (!department.isActive) {
        throw new BadRequestException('Cannot assign user to inactive department');
      }
    }

    const role = dto.role || Role.EMPLOYEE;
    let email: string | undefined = dto.email;
    let hashedPassword: string | undefined;

    // Only set email/password for ADMIN role
    // EMPLOYEE users don't need email/password (they use face recognition only)
    if (role === Role.ADMIN) {
      // Auto-generate email if not provided for ADMIN
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
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create user and update registration in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user with face data
      // For EMPLOYEE: email and password are NULL (face recognition only)
      // For ADMIN: email and password are required
      const user = await tx.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: registration.name,
          role: role,
          position: dto.position,
          department: dto.departmentId ? { connect: { id: dto.departmentId } } : undefined,
          phone: dto.phone,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          faceEmbedding: registration.faceEmbedding,
          faceEmbeddings: registration.faceEmbeddings, // Copy multiple embeddings
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
   * Replace existing user's face data with registration data (admin only)
   */
  async replaceUserFace(
    id: string,
    dto: ReplaceFaceDto,
    adminId: string,
  ) {
    // Get registration
    const registration = await this.getRegistrationById(id);

    if (registration.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException(
        `Registration has already been ${registration.status.toLowerCase()}`,
      );
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('Cannot replace face data for inactive user');
    }

    // Update user face data and registration status in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // First, unlink any existing registration from this user (due to unique constraint)
      await tx.faceRegistration.updateMany({
        where: { userId: dto.userId },
        data: { userId: null },
      });

      // Update user's face data
      const updatedUser = await tx.user.update({
        where: { id: dto.userId },
        data: {
          faceEmbedding: registration.faceEmbedding,
          faceEmbeddings: registration.faceEmbeddings,
          faceImageUrl: registration.faceImageUrl,
        },
      });

      // Update registration status and link to user
      const updatedRegistration = await tx.faceRegistration.update({
        where: { id },
        data: {
          status: RegistrationStatus.APPROVED,
          userId: dto.userId,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      return { user: updatedUser, registration: updatedRegistration };
    });

    return {
      message: 'Face data replaced successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
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
   * Preview duplicate check for registration (admin only)
   * Returns registration info and similar users found
   */
  async previewDuplicate(id: string): Promise<{
    registration: {
      id: string;
      name: string;
      faceImageUrl: string | null;
      status: RegistrationStatus;
    };
    duplicateCheck: {
      isDuplicate: boolean;
      matchedUsers: Array<{
        id: string;
        name: string;
        similarity: number;
        faceImageUrl: string | null;
      }>;
    };
  }> {
    const registration = await this.prisma.faceRegistration.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        faceEmbedding: true,
        faceEmbeddings: true,
        faceImageUrl: true,
        status: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Get face embedding for comparison (prefer first from multiple embeddings)
    const faceEmbedding = registration.faceEmbedding ||
      (registration.faceEmbeddings ? JSON.stringify(JSON.parse(registration.faceEmbeddings)[0]) : null);

    const duplicateCheck = faceEmbedding
      ? await this.checkDuplicateOnApprove(faceEmbedding)
      : { isDuplicate: false, matchedUsers: [] };

    return {
      registration: {
        id: registration.id,
        name: registration.name,
        faceImageUrl: registration.faceImageUrl,
        status: registration.status,
      },
      duplicateCheck,
    };
  }

  /**
   * Check for duplicate face when admin approves registration
   * Returns matched users with similarity percentage
   */
  private async checkDuplicateOnApprove(faceEmbedding: string): Promise<{
    isDuplicate: boolean;
    matchedUsers: Array<{
      id: string;
      name: string;
      similarity: number;
      faceImageUrl: string | null;
    }>;
  }> {
    const SIMILARITY_THRESHOLD = 0.8; // 80% similarity threshold

    let newEmbedding: number[];
    try {
      newEmbedding = JSON.parse(faceEmbedding);
    } catch {
      return { isDuplicate: false, matchedUsers: [] };
    }

    // Get all approved/active users with face embedding
    const approvedUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        faceEmbedding: { not: null },
      },
      select: {
        id: true,
        name: true,
        faceEmbedding: true,
        faceImageUrl: true,
      },
    });

    const matchedUsers: Array<{
      id: string;
      name: string;
      similarity: number;
      faceImageUrl: string | null;
    }> = [];

    for (const user of approvedUsers) {
      if (!user.faceEmbedding) continue;

      try {
        const userEmbedding = JSON.parse(user.faceEmbedding) as number[];
        const similarity = this.calculateCosineSimilarity(newEmbedding, userEmbedding);

        if (similarity >= SIMILARITY_THRESHOLD) {
          matchedUsers.push({
            id: user.id,
            name: user.name,
            similarity: Math.round(similarity * 100),
            faceImageUrl: user.faceImageUrl,
          });
        }
      } catch {
        // Skip users with invalid embedding data
        continue;
      }
    }

    // Sort by similarity descending (highest first)
    matchedUsers.sort((a, b) => b.similarity - a.similarity);

    return {
      isDuplicate: matchedUsers.length > 0,
      matchedUsers,
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
