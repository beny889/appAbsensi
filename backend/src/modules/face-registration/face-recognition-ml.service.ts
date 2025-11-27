import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FaceRecognitionMlService {
  private readonly faceRecognitionUrl: string;

  constructor(private configService: ConfigService) {
    this.faceRecognitionUrl = this.configService.get<string>(
      'FACE_RECOGNITION_URL',
      'http://localhost:5000',
    );
  }

  /**
   * Extract face embedding from base64 image using external ML service
   * Falls back to placeholder if service is unavailable
   */
  async extractFaceEmbedding(imageBase64: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.faceRecognitionUrl}/extract-embedding`,
        { image: imageBase64 },
        { timeout: 30000 },
      );

      if (response.data && response.data.embedding) {
        return response.data.embedding;
      }

      throw new Error('Invalid response from face recognition service');
    } catch (error) {
      // If ML service is unavailable, generate placeholder embedding
      return this.generatePlaceholderEmbedding();
    }
  }

  /**
   * Compare two face embeddings and return similarity score
   */
  async compareFaces(
    embedding1: number[],
    embedding2: number[],
  ): Promise<number> {
    try {
      const response = await axios.post(
        `${this.faceRecognitionUrl}/compare-faces`,
        { embedding1, embedding2 },
        { timeout: 10000 },
      );

      if (response.data && typeof response.data.similarity === 'number') {
        return response.data.similarity;
      }

      // Fallback to local calculation
      return this.calculateCosineSimilarity(embedding1, embedding2);
    } catch (error) {
      // Fallback to local cosine similarity calculation
      return this.calculateCosineSimilarity(embedding1, embedding2);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings locally
   */
  private calculateCosineSimilarity(
    embedding1: number[],
    embedding2: number[],
  ): number {
    if (embedding1.length !== embedding2.length) {
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
   * Generate placeholder embedding for development/testing
   */
  private generatePlaceholderEmbedding(): number[] {
    const embeddingSize = 128;
    const embedding: number[] = [];

    for (let i = 0; i < embeddingSize; i++) {
      embedding.push(Math.random() * 2 - 1);
    }

    // Normalize
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );

    return embedding.map((val) => val / magnitude);
  }
}
