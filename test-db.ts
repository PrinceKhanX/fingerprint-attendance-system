import { prisma } from './src/lib/prisma'

async function testDatabase() {
  console.log('=== Testing Database State ===\n')

  // 1. Check Student table for guardian_email
  console.log('1. Checking Student table for guardian_email:')
  const students = await prisma.student.findMany({
    include: { user: { select: { name: true, email: true } } }
  })
  console.log(`Found ${students.length} student(s):`)
  students.forEach(s => {
    console.log(`  - ${s.user.name} (${s.user.email})`)
    console.log(`    guardian_email: ${s.guardian_email}`)
    console.log(`    fingerprint_id: ${s.fingerprint_id}`)
    console.log(`    student_id: ${s.student_id}`)
  })

  // 2. Check Class table
  console.log('\n2. Checking Class table:')
  const classes = await prisma.class.findMany({
    include: { teacher: { include: { user: { select: { name: true, email: true } } } } }
  })
  console.log(`Found ${classes.length} class(es):`)
  classes.forEach(c => {
    console.log(`  - ${c.name} (ID: ${c.id})`)
    console.log(`    Teacher: ${c.teacher.user.name}`)
    console.log(`    Schedule: ${c.schedule}`)
  })

  // 3. Check Enrollment table
  console.log('\n3. Checking Enrollment table:')
  const enrollments = await prisma.enrollment.findMany({
    include: {
      student: { 
        include: { user: { select: { name: true } } }
      },
      class: { select: { name: true } }
    }
  })
  console.log(`Found ${enrollments.length} enrollment(s):`)
  enrollments.forEach(e => {
    console.log(`  - ${e.student.user.name} enrolled in ${e.class.name}`)
    console.log(`    student_id: ${e.studentId}`)
    console.log(`    class_id: ${e.classId}`)
  })

  // 4. Check Guardian table
  console.log('\n4. Checking Guardian table:')
  const guardians = await prisma.guardian.findMany()
  console.log(`Found ${guardians.length} guardian(s):`)
  guardians.forEach(g => {
    console.log(`  - ${g.name} (${g.email})`)
  })

  // 5. Check Attendance table
  console.log('\n5. Checking Attendance table:')
  const attendance = await prisma.attendance.findMany({
    include: {
      student: { include: { user: { select: { name: true } } } },
      class: { select: { name: true } }
    }
  })
  console.log(`Found ${attendance.length} attendance record(s)`)
  
  await prisma.$disconnect()
}

testDatabase()
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
