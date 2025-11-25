import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

/**
 * Service untuk integrasi dengan Python Face Recognition microservice
 */
@Injectable()
export class FaceRecognitionMlService {
  private readonly logger = new Logger(FaceRecognitionMlService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly faceServiceUrl: string;

  constructor() {
    this.faceServiceUrl =
      process.env.FACE_RECOGNITION_SERVICE_URL || 'http://localhost:5000';

    this.axiosInstance = axios.create({
      baseURL: this.faceServiceUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(
      `Face Recognition ML Service initialized. URL: ${this.faceServiceUrl}`,
    );
  }

  /**
   * Extract face embedding dari base64 image menggunakan Python service
   * @param base64Image Base64 encoded image string
   * @returns Face embedding array (128-dimensional)
   */
  async extractFaceEmbedding(base64Image: string): Promise<number[]> {
    try {
      this.logger.debug('Calling Python service to extract face embedding...');

      const response = await this.axiosInstance.post('/extract-embedding', {
        image: base64Image,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to extract embedding');
      }

      const embedding: number[] = response.data.embedding;

      this.logger.debug(
        `Successfully extracted face embedding (${embedding.length} dimensions)`,
      );

      return embedding;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error ||
          error.message ||
          'Unknown error from face recognition service';

        this.logger.error(
          `Face recognition service error: ${message}`,
          error.stack,
        );

        // Check if service is unavailable
        if (error.code === 'ECONNREFUSED') {
          throw new InternalServerErrorException(
            'Face recognition service is not available. Please ensure the Python service is running on port 5000.',
          );
        }

        // Return specific error from face recognition service
        if (error.response?.status === 400) {
          throw new Error(message);
        }

        throw new InternalServerErrorException(
          `Face recognition failed: ${message}`,
        );
      }

      this.logger.error('Unexpected error in face recognition:', error);
      throw new InternalServerErrorException(
        'Unexpected error during face recognition',
      );
    }
  }

  /**
   * Compare two face embeddings
   * @param embedding1 First face embedding
   * @param embedding2 Second face embedding
   * @returns Similarity score and match status
   */
  async compareFaceEmbeddings(
    embedding1: number[],
    embedding2: number[],
  ): Promise<{
    similarity: number;
    distance: number;
    isMatch: boolean;
    tolerance: number;
  }> {
    try {
      this.logger.debug('Comparing face embeddings...');

      const response = await this.axiosInstance.post('/compare-faces', {
        embedding1,
        embedding2,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to compare faces');
      }

      return {
        similarity: response.data.similarity,
        distance: response.data.distance,
        isMatch: response.data.is_match,
        tolerance: response.data.tolerance,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.error || 'Face comparison failed';
        this.logger.error(`Face comparison error: ${message}`, error.stack);

        if (error.code === 'ECONNREFUSED') {
          throw new InternalServerErrorException(
            'Face recognition service is not available',
          );
        }

        throw new InternalServerErrorException(message);
      }

      this.logger.error('Unexpected error comparing faces:', error);
      throw new InternalServerErrorException(
        'Unexpected error during face comparison',
      );
    }
  }

  /**
   * Health check untuk Python face recognition service
   * @returns true jika service available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health', {
        timeout: 5000,
      });
      return response.data.status === 'ok';
    } catch (error) {
      this.logger.warn('Face recognition service health check failed');
      return false;
    }
  }
}
