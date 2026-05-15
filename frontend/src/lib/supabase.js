import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xdycghwnqmmdajfjofeo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkeWNnaHducW1tZGFqZmpvZmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzgxNDAsImV4cCI6MjA5NDQxNDE0MH0.bIF26cfRSU6n3Sgo96mJ1dIKQqWE-CqOz4ea34aGkhI'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
})