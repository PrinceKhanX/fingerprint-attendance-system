import { prisma } from './src/lib/prisma'
import { notifyAttendanceAlert } from './src/lib/notify'

async function testEmailNotification() {
  console.log('=== Testing Email Notification System ===\n')

  try {
    // Step 1: Find a student with a guardian
    console.log('Step 1: Finding a student with guardian...')
    const student = await prisma.student.findFirst({
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    if (!student) {
      console.error('❌ No students found in database')
      return
    }

    console.log(`✓ Found student: ${student.user.name} (ID: ${student.id})`)
    console.log(`  Guardian email: ${student.guardian_email}`)

    // Step 2: Update guardian email to test email
    console.log('\nStep 2: Updating guardian email to tasfirprince@gmail.com...')
    const originalEmail = student.guardian_email
    
    await prisma.student.update({
      where: { id: student.id },
      data: { guardian_email: 'tasfirprince@gmail.com' },
    })
    
    console.log(`✓ Updated guardian email from ${originalEmail} to tasfirprince@gmail.com`)

    // Step 3: Find a class for this student
    console.log('\nStep 3: Finding a class for this student...')
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id },
      include: {
        class: { select: { id: true, name: true } },
      },
    })

    if (!enrollment) {
      console.error('❌ Student is not enrolled in any classes')
      // Restore original email
      await prisma.student.update({
        where: { id: student.id },
        data: { guardian_email: originalEmail },
      })
      return
    }

    console.log(`✓ Found class: ${enrollment.class.name} (ID: ${enrollment.class.id})`)

    // Step 4: Trigger the notification (simulate ABSENT status)
    console.log('\nStep 4: Triggering attendance alert notification...')
    console.log('  Status: ABSENT')
    console.log('  Date:', new Date().toISOString().split('T')[0])
    console.log('  Target email: tasfirprince@gmail.com')
    console.log('\n--- Sending Email ---\n')

    // Check SMTP configuration
    console.log('SMTP Configuration Check:')
    console.log('  SMTP_HOST:', process.env.SMTP_HOST ? 'SET' : 'NOT SET')
    console.log('  SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET')
    console.log('  SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET')
    console.log('  SMTP_PORT:', process.env.SMTP_PORT || '587 (default)')
    console.log('')

    await notifyAttendanceAlert(
      student.id,
      enrollment.class.id,
      'ABSENT',
      new Date().toISOString().split('T')[0]
    )

    console.log('\n--- Notification Trigger Complete ---\n')

    // Step 5: Restore original guardian email
    console.log('Step 5: Restoring original guardian email...')
    await prisma.student.update({
      where: { id: student.id },
      data: { guardian_email: originalEmail },
    })
    
    console.log(`✓ Restored guardian email to ${originalEmail}`)

    console.log('\n=== Test Complete ===')
    console.log('Check the server logs above for email sending details.')
    console.log('If SMTP is not configured, you should see [email:dev] logs.')
    console.log('If SMTP is configured, you should see success or error logs.')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailNotification()
