import 'dotenv/config';
import { PrismaClient, AttendanceType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Setup Prisma with pg adapter (same as in prisma.service.ts)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

// 10 dummy identities (phone numbers as unique identifier)
const dummyPhones = [
  '081234567001',
  '081234567002',
  '081234567003',
  '081234567004',
  '081234567005',
  '081234567006',
  '081234567007',
  '081234567008',
  '081234567009',
  '081234567010',
];

async function main() {
  console.log('Finding existing dummy employees...');

  // Find existing dummy users by phone
  const existingUsers = await prisma.user.findMany({
    where: {
      phone: { in: dummyPhones },
    },
  });

  if (existingUsers.length === 0) {
    console.log('No dummy employees found! Please run the initial seed first.');
    console.log('Run: npm run prisma:seed (with the original seed script)');
    return;
  }

  console.log(`Found ${existingUsers.length} dummy employees`);

  // Delete existing attendance for these users (to avoid duplicates)
  const userIds = existingUsers.map(u => u.id);
  const deletedAttendance = await prisma.attendance.deleteMany({
    where: {
      userId: { in: userIds },
    },
  });
  console.log(`Deleted ${deletedAttendance.count} old attendance records`);

  // Generate attendance from Nov 1 to Nov 25, 2025
  const startDate = new Date(2025, 10, 1); // Nov 1, 2025 (month is 0-indexed)
  const endDate = new Date(2025, 10, 25);  // Nov 25, 2025

  let totalRecords = 0;
  const currentDate = new Date(startDate);

  console.log(`\nGenerating attendance from ${startDate.toDateString()} to ${endDate.toDateString()}...`);

  while (currentDate <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const dateStr = currentDate.toISOString().split('T')[0];
    let dayRecords = 0;

    for (const user of existingUsers) {
      // 90% chance of attendance (some days absent)
      if (Math.random() > 0.9) {
        continue; // Skip this user for this day (absent)
      }

      // Random check-in time between 07:00 and 08:45
      const checkInHour = 7 + Math.floor(Math.random() * 2); // 7 or 8
      const checkInMinute = Math.floor(Math.random() * (checkInHour === 8 ? 46 : 60));
      const checkInTime = new Date(currentDate);
      checkInTime.setHours(checkInHour, checkInMinute, Math.floor(Math.random() * 60), 0);

      // Random check-out time between 16:30 and 18:00
      const checkOutHour = 16 + Math.floor(Math.random() * 2); // 16 or 17
      const checkOutMinute = checkOutHour === 16
        ? 30 + Math.floor(Math.random() * 30)
        : Math.floor(Math.random() * 60);
      const checkOutTime = new Date(currentDate);
      checkOutTime.setHours(checkOutHour, checkOutMinute, Math.floor(Math.random() * 60), 0);

      // Calculate late/early status (schedule: 08:00 - 17:00)
      const scheduledCheckInMinutes = 8 * 60; // 08:00
      const scheduledCheckOutMinutes = 17 * 60; // 17:00

      const actualCheckInMinutes = checkInHour * 60 + checkInMinute;
      const actualCheckOutMinutes = checkOutHour * 60 + checkOutMinute;

      const isLate = actualCheckInMinutes > scheduledCheckInMinutes;
      const lateMinutes = isLate ? actualCheckInMinutes - scheduledCheckInMinutes : null;

      const isEarlyCheckout = actualCheckOutMinutes < scheduledCheckOutMinutes;
      const earlyMinutes = isEarlyCheckout ? scheduledCheckOutMinutes - actualCheckOutMinutes : null;

      // Random similarity between 0.85 and 0.98
      const similarity = 0.85 + Math.random() * 0.13;

      // Create CHECK_IN record
      await prisma.attendance.create({
        data: {
          userId: user.id,
          type: AttendanceType.CHECK_IN,
          timestamp: checkInTime,
          similarity: parseFloat(similarity.toFixed(4)),
          isLate,
          lateMinutes,
          scheduledTime: '08:00',
          isVerified: true,
        },
      });

      // Create CHECK_OUT record
      await prisma.attendance.create({
        data: {
          userId: user.id,
          type: AttendanceType.CHECK_OUT,
          timestamp: checkOutTime,
          similarity: parseFloat(similarity.toFixed(4)),
          isEarlyCheckout,
          earlyMinutes,
          scheduledTime: '17:00',
          isVerified: true,
        },
      });

      dayRecords += 2;
      totalRecords += 2;
    }

    console.log(`  ${dateStr}: ${dayRecords / 2} employees attended`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Summary
  const allAttendances = await prisma.attendance.findMany({
    where: {
      userId: { in: userIds },
    },
  });

  const checkIns = allAttendances.filter(a => a.type === AttendanceType.CHECK_IN);
  const lateCount = checkIns.filter(a => a.isLate).length;
  const checkOuts = allAttendances.filter(a => a.type === AttendanceType.CHECK_OUT);
  const earlyCount = checkOuts.filter(a => a.isEarlyCheckout).length;

  console.log(`\n========================================`);
  console.log(`Total Records Created: ${totalRecords}`);
  console.log(`----------------------------------------`);
  console.log(`Check-ins: ${checkIns.length}`);
  console.log(`  - Late: ${lateCount} (${((lateCount/checkIns.length)*100).toFixed(1)}%)`);
  console.log(`Check-outs: ${checkOuts.length}`);
  console.log(`  - Early: ${earlyCount} (${((earlyCount/checkOuts.length)*100).toFixed(1)}%)`);
  console.log(`========================================`);
  console.log('\nDummy attendance data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
