async function testGuardianLogin() {
  const baseUrl = 'http://localhost:3001'
  
  console.log('=== Testing Guardian Login Flow ===\n')

  console.log('1. Testing guardian login with email and password...')
  console.log('   Email: guardian@example.com')
  console.log('   Password: guardian123')

  const response = await fetch(`${baseUrl}/api/guardian/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'guardian@example.com',
      password: 'guardian123'
    })
  })

  console.log(`   Response status: ${response.status}`)

  if (!response.ok) {
    console.log('❌ Guardian login failed')
    console.log(await response.text())
    return
  }

  const data = await response.json()
  console.log('✅ Guardian login successful')
  console.log(`   Result: ${JSON.stringify(data, null, 2)}`)

  // Check if cookie was set
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    console.log('\n2. Checking authentication cookie...')
    console.log('✅ Guardian auth cookie set')
    console.log(`   Cookie: ${setCookie.substring(0, 100)}...`)
  } else {
    console.log('\n2. Checking authentication cookie...')
    console.log('⚠️ No guardian auth cookie found in response')
  }

  // Verify guardian data
  if (data.guardian) {
    console.log('\n3. Verifying guardian data...')
    console.log(`   Guardian ID: ${data.guardian.id}`)
    console.log(`   Guardian Email: ${data.guardian.email}`)
    console.log(`   Guardian Name: ${data.guardian.name}`)
    console.log('✅ Guardian data returned correctly')
  }

  console.log('\n=== Test Complete ===')
  console.log('\nSummary:')
  console.log('- Guardian login expects: email + password')
  console.log('- Working credentials: guardian@example.com / guardian123')
  console.log('- The guardian_email in Student table: guardian@example.com')
  console.log('- This matches the guardian account, so login should work')
}

testGuardianLogin()
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
