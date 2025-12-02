import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing local database...\n');

  // Hash password for admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@absensi.com' },
    update: {},
    create: {
      email: 'admin@absensi.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create default Department
  const department = await prisma.department.upsert({
    where: { id: 'dept-default' },
    update: {},
    create: {
      id: 'dept-default',
      name: 'General',
      description: 'Default department',
    },
  });
  console.log('✅ Default department created:', department.name);

  // Create default Work Schedule
  const schedule = await prisma.workSchedule.upsert({
    where: { departmentId: department.id },
    update: {},
    create: {
      departmentId: department.id,
      checkInTime: '08:00',
      checkOutTime: '17:00',
    },
  });
  console.log('✅ Default work schedule created for department:', department.name);

  // Create 10 dummy employees
  const dummyEmployees = [
    { name: 'Budi Santoso', phone: '081234567001', position: 'Staff IT' },
    { name: 'Dewi Anggraini', phone: '081234567002', position: 'Staff HR' },
    { name: 'Ahmad Fauzi', phone: '081234567003', position: 'Staff Finance' },
    { name: 'Siti Nurhaliza', phone: '081234567004', position: 'Staff Marketing' },
    { name: 'Rudi Hartono', phone: '081234567005', position: 'Staff Operasional' },
    { name: 'Maya Sari', phone: '081234567006', position: 'Staff Admin' },
    { name: 'Eko Prasetyo', phone: '081234567007', position: 'Staff IT' },
    { name: 'Rina Wulandari', phone: '081234567008', position: 'Staff HR' },
    { name: 'Agus Setiawan', phone: '081234567009', position: 'Staff Finance' },
    { name: 'Linda Permata', phone: '081234567010', position: 'Staff Marketing' },
  ];

  console.log('\n📝 Creating dummy employees...');
  for (const emp of dummyEmployees) {
    // Check if employee already exists by phone
    const existing = await prisma.user.findFirst({
      where: { phone: emp.phone },
    });

    if (existing) {
      console.log(`   ✓ ${existing.name} (already exists)`);
      continue;
    }

    const employee = await prisma.user.create({
      data: {
        name: emp.name,
        phone: emp.phone,
        position: emp.position,
        role: 'EMPLOYEE',
        departmentId: department.id,
        isActive: true,
        startDate: new Date('2024-01-01'),
      },
    });
    console.log(`   ✓ ${employee.name}`);
  }

  console.log('\n========================================');
  console.log('🎉 Local database initialized!');
  console.log('========================================');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@absensi.com');
  console.log('   Password: admin123');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
