async function testTeacherAttendance() {
  const baseUrl = 'http://localhost:3001'
  const cookieJar: { [key: string]: string } = {}
  
  console.log('=== Testing Teacher Manual Attendance Flow ===\n')

  // Helper to get cookie string
  const getCookieString = () => {
    return Object.entries(cookieJar)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  // Helper to update cookies from response
  const updateCookies = (response: Response) => {
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      setCookie.split(',').forEach(cookie => {
        const [nameValue] = cookie.trim().split(';')
        const [name, value] = nameValue.split('=')
        if (name && value) {
          cookieJar[name.trim()] = value.trim()
        }
      })
    }
  }

  // Step 1: Login as teacher to get token
  console.log('1. Logging in as teacher...')
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'teacher@example.com',
      password: 'teacher123'
    })
  })

  if (!loginResponse.ok) {
    console.log('❌ Teacher login failed')
    console.log(await loginResponse.text())
    return
  }

  updateCookies(loginResponse)
  const loginData = await loginResponse.json()
  
  if (!cookieJar['auth_token']) {
    console.log('❌ No auth_token cookie found')
    return
  }
  
  console.log('✅ Teacher login successful')
  console.log(`   Token: ${cookieJar['auth_token'].substring(0, 20)}...`)

  // Step 2: Get teacher's classes
  console.log('\n2. Getting teacher classes...')
  const classesResponse = await fetch(`${baseUrl}/api/teacher/classes`, {
    headers: {
      'Cookie': getCookieString(),
      'Content-Type': 'application/json'
    }
  })

  if (!classesResponse.ok) {
    console.log('❌ Failed to get classes')
    console.log(await classesResponse.text())
    return
  }

  const classesData = await classesResponse.json()
  console.log('✅ Classes retrieved')
  console.log(`   Classes: ${JSON.stringify(classesData, null, 2)}`)

  const classId = classesData.classes?.[0]?.id || '873677de-c444-4a7f-a848-dc8ec72479ff'
  const today = new Date().toISOString().split('T')[0]
  const studentId = '29f6d72a-b14c-4e67-bfc0-ac4914d141c8'

  // Step 3: Mark attendance manually - PRESENT
  console.log('\n3. Marking student as PRESENT manually...')
  const presentResponse = await fetch(`${baseUrl}/api/teacher/attendance`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieString(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      classId,
      date: today,
      records: [
        { studentId, status: 'PRESENT' }
      ]
    })
  })

  if (!presentResponse.ok) {
    console.log('❌ Failed to mark attendance as PRESENT')
    console.log(await presentResponse.text())
    return
  }

  const presentData = await presentResponse.json()
  console.log('✅ Attendance marked as PRESENT')
  console.log(`   Result: ${JSON.stringify(presentData, null, 2)}`)

  // Step 4: Mark attendance manually - ABSENT
  console.log('\n4. Marking student as ABSENT manually...')
  const absentResponse = await fetch(`${baseUrl}/api/teacher/attendance`, {
    method: 'POST',
    headers: {
      'Cookie': getCookieString(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      classId,
      date: today,
      records: [
        { studentId, status: 'ABSENT' }
      ]
    })
  })

  if (!absentResponse.ok) {
    console.log('❌ Failed to mark attendance as ABSENT')
    console.log(await absentResponse.text())
    return
  }

  const absentData = await absentResponse.json()
  console.log('✅ Attendance marked as ABSENT')
  console.log(`   Result: ${JSON.stringify(absentData, null, 2)}`)

  // Step 5: Verify attendance records
  console.log('\n5. Verifying attendance records...')
  const verifyResponse = await fetch(`${baseUrl}/api/teacher/attendance?classId=${classId}&date=${today}`, {
    headers: {
      'Cookie': getCookieString(),
      'Content-Type': 'application/json'
    }
  })

  if (!verifyResponse.ok) {
    console.log('❌ Failed to verify attendance')
    console.log(await verifyResponse.text())
    return
  }

  const verifyData = await verifyResponse.json()
  console.log('✅ Attendance records verified')
  console.log(`   Records: ${JSON.stringify(verifyData, null, 2)}`)

  console.log('\n=== Test Complete ===')
}

testTeacherAttendance()
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
