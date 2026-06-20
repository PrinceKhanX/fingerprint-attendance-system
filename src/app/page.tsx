import Link from 'next/link'

const cards = [
  {
    title: 'Admin',
    description: 'Manage users, classes, and attendance settings.',
    href: '/login?role=ADMIN',
  },
  {
    title: 'Teacher',
    description: 'Track classes and mark attendance.',
    href: '/login?role=TEACHER',
  },
  {
    title: 'Student',
    description: 'Review your attendance records.',
    href: '/login?role=STUDENT',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
        <h1 className="text-4xl font-semibold text-slate-900">Fingerprint Attendance</h1>
        <p className="mt-4 text-slate-600">
          Click a role card to go to login and access your dashboard.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:border-blue-300 hover:shadow-lg"
            >
              <h2 className="text-2xl font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-3 text-slate-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
