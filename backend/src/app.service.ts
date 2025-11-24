import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Absensi API - Face Recognition & GPS Attendance System';
  }
}
