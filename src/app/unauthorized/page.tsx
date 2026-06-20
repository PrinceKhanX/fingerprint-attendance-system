import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-2xl text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Unauthorized</h2>
        <p className="text-slate-600 mb-6">You don't have permission to access this page.</p>
        <Link href="/login" className="inline-block px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
          Back to Login
        </Link>
      </div>
    </main>
  )
}
