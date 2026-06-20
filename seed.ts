import { prisma } from './src/lib/prisma'
import { hashPassword } from './src/lib/auth'

async function seed() {
  console.log('Seeding database...')

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.attendance.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.student.deleteMany()
  await prisma.user.deleteMany()

  // Create demo users
  const adminPassword = await hashPassword('admin123')
  const teacherPassword = await hashPassword('teacher123')
  const studentPassword = await hashPassword('student123')

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const teacher = await prisma.user.create({
    data: {
      name: 'John Teacher',
      email: 'teacher@example.com',
      password: teacherPassword,
      role: 'TEACHER',
    },
  })

  const student = await prisma.user.create({
    data: {
      name: 'Jane Student',
      email: 'student@example.com',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  // Create a Teacher record for the teacher user
  const teacherRecord = await prisma.teacher.create({
    data: {
      userId: teacher.id,
      employee_id: 'T001',
    },
  })

  // Create a Student record for the student user
  const studentRecord = await prisma.student.create({
    data: {
      userId: student.id,
      student_id: 'S001',
      fingerprint_id: 'FP001',
      guardian_email: 'guardian@example.com',
    },
  })

  // Create a class
  const class1 = await prisma.class.create({
    data: {
      name: 'Mathematics 101',
      teacherId: teacherRecord.id,
      schedule: 'Mon, Wed, Fri - 10:00 AM',
    },
  })

  // Enroll student
  await prisma.enrollment.create({
    data: {
      studentId: studentRecord.id,
      classId: class1.id,
    },
  })

  console.log('✓ Database seeded successfully!')
  console.log('\nDemo credentials:')
  console.log('Admin - admin@example.com / admin123')
  console.log('Teacher - teacher@example.com / teacher123')
  console.log('Student - student@example.com / student123')
}

seed()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
