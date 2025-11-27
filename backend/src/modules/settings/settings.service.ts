import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const SETTINGS_KEYS = {
  FACE_SIMILARITY_THRESHOLD: 'FACE_SIMILARITY_THRESHOLD',
} as const;

const DEFAULT_SETTINGS = [
  {
    key: SETTINGS_KEYS.FACE_SIMILARITY_THRESHOLD,
    value: '0.7',
    description: 'Distance threshold untuk face recognition (0.1 - 1.0). Semakin besar = semakin longgar (mudah match)',
  },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize default settings if not exist
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.prisma.settings.findUnique({
        where: { key: setting.key },
      });
      if (!existing) {
        await this.prisma.settings.create({
          data: setting,
        });
      }
    }
  }

  async getAll() {
    return this.prisma.settings.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async getByKey(key: string) {
    return this.prisma.settings.findUnique({
      where: { key },
    });
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.getByKey(key);
    return setting?.value ?? null;
  }

  async getNumberValue(key: string, defaultValue: number): Promise<number> {
    const value = await this.getValue(key);
    if (value === null) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  async updateByKey(key: string, value: string, description?: string) {
    return this.prisma.settings.upsert({
      where: { key },
      update: { value, ...(description && { description }) },
      create: { key, value, description },
    });
  }

  async getSimilarityThreshold(): Promise<number> {
    return this.getNumberValue(SETTINGS_KEYS.FACE_SIMILARITY_THRESHOLD, 0.7);
  }

  async updateSimilarityThreshold(value: number) {
    // Validate range
    if (value < 0.1 || value > 1.0) {
      throw new Error('Distance threshold must be between 0.1 and 1.0');
    }
    return this.updateByKey(
      SETTINGS_KEYS.FACE_SIMILARITY_THRESHOLD,
      value.toString(),
      'Distance threshold untuk face recognition (0.1 - 1.0). Semakin besar = semakin longgar (mudah match)',
    );
  }
}
