import { prisma } from './src/lib/prisma'
import { hashPassword } from './src/lib/auth'

// Student data with Bangladeshi names
const students = [
  { name: 'Sajid', email: 'sajid@example.com' },
  { name: 'Ishfar', email: 'ishfar@example.com' },
  { name: 'Tasfir', email: 'tasfir@example.com' },
  { name: 'Mahdi', email: 'mahdi@example.com' },
  { name: 'Srijon', email: 'srijon@example.com' },
  { name: 'Sudipto', email: 'sudipto@example.com' },
  { name: 'Rafiul', email: 'rafiul@example.com' },
  { name: 'Tanvir', email: 'tanvir@example.com' },
  { name: 'Nahid', email: 'nahid@example.com' },
  { name: 'Shoumik', email: 'shoumik@example.com' },
  { name: 'Arif', email: 'arif@example.com' },
  { name: 'Rakib', email: 'rakib@example.com' },
  { name: 'Fahim', email: 'fahim@example.com' },
  { name: 'Adnan', email: 'adnan@example.com' },
  { name: 'Tamim', email: 'tamim@example.com' },
]

// Teacher data
const teachers = [
  { name: 'Mubin Sir', email: 'mubin@example.com', employee_id: 'T001' },
  { name: 'Biplob Sir', email: 'biplob@example.com', employee_id: 'T002' },
  { name: 'Jamil Sir', email: 'jamil@example.com', employee_id: 'T003' },
  { name: 'Rayhanuzzaman Sir', email: 'rayhan@example.com', employee_id: 'T004' },
]

// Course data
const courses = [
  { name: 'Data Structures', schedule: 'Mon, Wed, Fri - 09:00 AM' },
  { name: 'Database Systems', schedule: 'Tue, Thu - 10:00 AM' },
  { name: 'Computer Networks', schedule: 'Mon, Wed - 02:00 PM' },
  { name: 'Software Engineering', schedule: 'Tue, Thu - 11:00 AM' },
]

// Attendance patterns: high (85-95%), moderate (65-75%), poor (40-55%)
function getAttendancePattern(studentIndex: number): { presentRate: number, lateRate: number } {
  const pattern = studentIndex % 3
  if (pattern === 0) return { presentRate: 0.90, lateRate: 0.08 } // High attendance
  if (pattern === 1) return { presentRate: 0.70, lateRate: 0.12 } // Moderate attendance
  return { presentRate: 0.48, lateRate: 0.15 } // Poor attendance
}

// Generate dates for the last 4 weeks (weekdays only)
function generateWeekdays(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today)
      date.setDate(today.getDate() - (week * 7) - day)
      const dayOfWeek = date.getDay()
      
      // Only include weekdays (1-5, Monday-Friday)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        dates.push(date)
      }
    }
  }
  
  return dates.sort((a, b) => a.getTime() - b.getTime())
}

async function seed() {
  console.log('Seeding database with realistic demo data...')

  await prisma.pushSubscription.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.student.deleteMany()
  await prisma.guardian.deleteMany()
  await prisma.user.deleteMany()

  const adminPassword = await hashPassword('admin123')
  const teacherPassword = await hashPassword('teacher123')
  const studentPassword = await hashPassword('student123')
  const guardianPassword = await hashPassword('guardian123')

  // Create admin
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log('✓ Created admin user')

  // Create teachers
  const teacherRecords = []
  for (const teacher of teachers) {
    const user = await prisma.user.create({
      data: {
        name: teacher.name,
        email: teacher.email,
        password: teacherPassword,
        role: 'TEACHER',
      },
    })

    const teacherRecord = await prisma.teacher.create({
      data: {
        userId: user.id,
        employee_id: teacher.employee_id,
      },
    })

    teacherRecords.push(teacherRecord)
    console.log(`✓ Created teacher: ${teacher.name}`)
  }

  // Create students with guardians
  const studentRecords = []
  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    
    // Create guardian for each student
    const guardian = await prisma.guardian.create({
      data: {
        name: `${student.name}'s Guardian`,
        email: `guardian.${student.name.toLowerCase()}@example.com`,
        password: guardianPassword,
        phone: `+8801${Math.floor(100000000 + Math.random() * 900000000)}`,
      },
    })

    const user = await prisma.user.create({
      data: {
        name: student.name,
        email: student.email,
        password: studentPassword,
        role: 'STUDENT',
      },
    })

    const studentRecord = await prisma.student.create({
      data: {
        userId: user.id,
        student_id: `S${String(i + 1).padStart(3, '0')}`,
        fingerprint_id: `FP${String(i + 1).padStart(3, '0')}`,
        guardian_email: guardian.email,
        guardian_phone: guardian.phone || undefined,
      },
    })

    studentRecords.push(studentRecord)
    console.log(`✓ Created student: ${student.name} with guardian`)
  }

  // Create courses and enroll students
  const classRecords = []
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]
    const teacherRecord = teacherRecords[i % teacherRecords.length]
    
    const classRecord = await prisma.class.create({
      data: {
        name: course.name,
        teacherId: teacherRecord.id,
        schedule: course.schedule,
      },
    })

    classRecords.push(classRecord)
    console.log(`✓ Created course: ${course.name} (taught by ${teachers[i % teachers.length].name})`)

    // Enroll 6-8 students in each course (mix it up)
    const enrolledCount = 6 + Math.floor(Math.random() * 3) // 6-8 students
    const shuffledStudents = [...studentRecords].sort(() => Math.random() - 0.5)
    
    for (let j = 0; j < enrolledCount; j++) {
      const student = shuffledStudents[j]
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: classRecord.id,
        },
      })
    }
    
    console.log(`  ✓ Enrolled ${enrolledCount} students in ${course.name}`)
  }

  // Generate attendance records
  const weekdays = generateWeekdays()
  let totalAttendanceRecords = 0

  for (const classRecord of classRecords) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: classRecord.id },
      include: { student: true },
    })

    for (const enrollment of enrollments) {
      const studentIndex = studentRecords.findIndex(s => s.id === enrollment.studentId)
      const pattern = getAttendancePattern(studentIndex)
      
      for (const date of weekdays) {
        const random = Math.random()
        
        let status: 'PRESENT' | 'LATE' | 'ABSENT'
        if (random < pattern.presentRate) {
          // Present or Late
          status = random < pattern.lateRate ? 'LATE' : 'PRESENT'
        } else {
          status = 'ABSENT'
        }

        // Mark most as SENSOR, some as MANUAL
        const markedBy = Math.random() < 0.85 ? 'SENSOR' : 'MANUAL'

        await prisma.attendance.create({
          data: {
            studentId: enrollment.studentId,
            classId: classRecord.id,
            timestamp: date,
            status,
            marked_by: markedBy,
          },
        })

        totalAttendanceRecords++
      }
    }
  }

  console.log(`\n✓ Database seeded successfully!`)
  console.log(`\nSummary:`)
  console.log(`- Teachers: ${teachers.length}`)
  console.log(`- Students: ${students.length}`)
  console.log(`- Courses: ${courses.length}`)
  console.log(`- Total attendance records: ${totalAttendanceRecords}`)
  console.log(`- Date range: Last 4 weeks (weekdays only)`)
  console.log(`\nDemo credentials:`)
  console.log(`Admin - admin@example.com / admin123`)
  console.log(`Teachers - ${teachers.map(t => `${t.email} / teacher123`).join(', ')}`)
  console.log(`Students - ${students[0].email} / student123 (and others)`)
  console.log(`Guardians - guardian.sajid@example.com / guardian123 (and others)`)
}

seed()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
