async function testFingerprintAttendance() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('=== Testing POST /api/attendance/mark (Fingerprint Scan) ===\n')

  const fingerprint_id = 'FP001'
  const class_id = '873677de-c444-4a7f-a848-dc8ec72479ff'

  // First, clear existing attendance for today to test fresh SENSOR marking
  console.log('0. Clearing existing attendance for today...')
  const { prisma } = await import('./src/lib/prisma')
  
  const today = new Date().toISOString().split('T')[0]
  await prisma.attendance.deleteMany({
    where: {
      classId: class_id,
      timestamp: {
        gte: new Date(today),
        lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })
  console.log('✅ Existing attendance cleared')
  await prisma.$disconnect()

  console.log(`\n1. Simulating fingerprint scan for fingerprint_id: ${fingerprint_id}`)
  console.log(`   Class ID: ${class_id}`)

  const response = await fetch(`${baseUrl}/api/attendance/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fingerprint_id,
      class_id
    })
  })

  console.log(`   Response status: ${response.status}`)

  if (!response.ok) {
    console.log('❌ Fingerprint scan failed')
    console.log(await response.text())
    return
  }

  const data = await response.json()
  console.log('✅ Fingerprint scan successful')
  console.log(`   Result: ${JSON.stringify(data, null, 2)}`)

  // Verify the attendance was created with SENSOR marked_by
  if (data.attendance) {
    console.log('\n2. Verifying attendance record:')
    console.log(`   Status: ${data.attendance.status}`)
    console.log(`   Marked by: ${data.attendance.marked_by}`)
    
    if (data.attendance.status === 'PRESENT' && data.attendance.marked_by === 'SENSOR') {
      console.log('✅ Attendance correctly marked as PRESENT with marked_by SENSOR')
    } else {
      console.log('❌ Attendance not correctly marked')
    }
  }

  console.log('\n=== Test Complete ===')
}

testFingerprintAttendance()
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
