import { useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [email, setEmail] = useState('admin@gmail.com')
  const [password, setPassword] = useState('Admin123')
  const [message, setMessage] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      setMessage('Login failed: ' + error.message)
      setLoggedIn(false)
    } else {
      setMessage('Success! Logged in as: ' + data.user.email)
      setLoggedIn(true)
      setUser(data.user)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setLoggedIn(false)
    setUser(null)
    setMessage('')
  }

  if (loggedIn) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Dashboard</h1>
        <p>Welcome, {user?.email}!</p>
        <p>Role: Admin</p>
        <button onClick={handleLogout} style={{ padding: '10px 20px', marginTop: '20px' }}>
          Logout
        </button>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Fingerprint Attendance System</h1>
      
      <div style={{ marginTop: '30px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', margin: '10px auto', padding: '8px', width: '250px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', margin: '10px auto', padding: '8px', width: '250px' }}
        />
        <button onClick={handleLogin} style={{ padding: '10px 30px', marginTop: '10px' }}>
          Login
        </button>
        
        {message && (
          <p style={{ marginTop: '20px', color: message.includes('Success') ? 'green' : 'red' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export default App