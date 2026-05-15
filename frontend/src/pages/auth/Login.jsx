import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('admin@gmail.com')
  const [password, setPassword] = useState('Admin123')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      setMessage('❌ ' + error.message)
    } else {
      setMessage('✅ Logged in! User: ' + data.user.email)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Login</h1>
      <div>
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
        {message && <p style={{ marginTop: '20px' }}>{message}</p>}
      </div>
    </div>
  )
}