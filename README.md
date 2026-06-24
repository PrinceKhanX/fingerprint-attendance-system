# 🔐 Fingerprint Attendance System

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.12-2d3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

A modern, full-stack biometric attendance management system built with Next.js, featuring real-time fingerprint scanning, role-based access control, and comprehensive analytics.

---

## ✨ Features

### 🎯 Core Functionality
- **Biometric Authentication**: Real-time fingerprint scanning for student attendance
- **Role-Based Access Control**: Four distinct user roles with tailored dashboards
- **Real-Time Updates**: WebSocket integration for live attendance tracking
- **Push Notifications**: Web push notifications for attendance alerts
- **Comprehensive Analytics**: Visual charts and statistics for attendance data

### 👥 User Roles

#### 🛡️ Admin
- User management (create, edit, delete users)
- Class and teacher management
- System-wide analytics and reports
- Attendance monitoring across all classes
- Guardian account management

#### 👨‍🏫 Teacher
- Class-specific attendance management
- Real-time student attendance tracking
- Manual attendance marking
- Class schedule management
- Attendance reports and statistics

#### 🎓 Student
- View personal attendance history
- Check class schedules
- Real-time attendance status
- Attendance statistics and trends

#### 👨‍👩‍👧 Guardian
- Monitor child's attendance in real-time
- Receive attendance notifications
- View attendance reports
- Track attendance patterns

### 🎨 UI/UX Features
- **Modern Design**: Clean, professional interface with shadcn/ui components
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Fully responsive across all devices
- **Smooth Animations**: Micro-interactions and transitions
- **Role-Based Theming**: Dynamic color schemes per role
  - Admin: Blue (#2563EB)
  - Teacher: Teal (#0D9488)
  - Student: Amber (#F59E0B)
  - Guardian: Purple (#7C3AED)

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Hooks
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma 5.12
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Push Notifications**: Web Push API

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Code Formatting**: Prettier (configured)
- **Type Checking**: TypeScript Compiler

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd fingerprint-attendance-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fingerprint_attendance?schema=public"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Email Configuration (optional, for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@fingerprint-attendance.com"

# Web Push Notifications (optional)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="mailto:your-email@example.com"
```

### 4. Database Setup

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

Seed the database with initial data:

```bash
npm run seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

---

## 📱 Usage

### Accessing the Application

1. **Landing Page**: Navigate to `/` to see role selection cards
2. **Login Page**: Navigate to `/login` to sign in
3. **Guardian Login**: Navigate to `/guardian/login` for guardian-specific login

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | admin123 |
| **Teacher** | teacher@example.com | teacher123 |
| **Student** | student@example.com | student123 |
| **Guardian** | guardian@example.com | guardian123 |

---

## 🏗️ Project Structure

```
fingerprint-attendance-system/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── analytics/         # Analytics page
│   │   ├── guardian/          # Guardian pages
│   │   ├── login/             # Login page
│   │   ├── page.tsx           # Landing page
│   │   ├── student/           # Student dashboard pages
│   │   └── teacher/           # Teacher dashboard pages
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── dashboard-sidebar.tsx  # Sidebar component
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   └── styles/
│       └── globals.css         # Global styles
├── components.json             # shadcn/ui config
├── next.config.mjs            # Next.js config
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind config
├── tsconfig.json              # TypeScript config
└── server.js                  # Custom server with Socket.io
```

---

## 🗄️ Database Schema

### Models

#### User
- `id`: UUID (primary key)
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `role`: Enum (ADMIN, TEACHER, STUDENT)

#### Student
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to User)
- `student_id`: String (unique)
- `class_id`: UUID (foreign key to Class)
- `fingerprint_id`: String (unique)
- `guardian_email`: String
- `guardian_phone`: String (optional)

#### Teacher
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to User)
- `employee_id`: String (unique)

#### Class
- `id`: UUID (primary key)
- `name`: String
- `teacher_id`: UUID (foreign key to Teacher)
- `schedule`: String

#### Attendance
- `id`: UUID (primary key)
- `student_id`: UUID (foreign key to Student)
- `class_id`: UUID (foreign key to Class)
- `timestamp`: DateTime
- `status`: Enum (PRESENT, LATE, ABSENT)
- `marked_by`: Enum (SENSOR, MANUAL)

#### Guardian
- `id`: UUID (primary key)
- `email`: String (unique)
- `password`: String (hashed)
- `name`: String
- `phone`: String (optional)

---

## 🔐 Authentication Flow

1. **Login**: User submits credentials via `/api/auth/login`
2. **Verification**: Server validates email and password
3. **Token Generation**: JWT token is generated with user role
4. **Session Storage**: Token is stored in HTTP-only cookie
5. **Protected Routes**: Middleware verifies token on protected routes
6. **Role-Based Access**: User is redirected to appropriate dashboard

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/classes` - List all classes
- `GET /api/admin/analytics` - System analytics

### Teacher
- `GET /api/teacher/classes` - List teacher's classes
- `GET /api/teacher/attendance` - Get class attendance
- `POST /api/teacher/attendance` - Mark attendance manually

### Student
- `GET /api/student/attendance` - Get student attendance history
- `GET /api/student/schedule` - Get class schedule

### Guardian
- `GET /api/guardian/attendance` - Get child's attendance
- `POST /api/guardian/push-subscribe` - Subscribe to notifications

---

## 🎨 Design System

### Color Palette

| Role | Primary Color | Hex Code |
|------|--------------|----------|
| Admin | Blue | #2563EB |
| Teacher | Teal | #0D9488 |
| Student | Amber | #F59E0B |
| Guardian | Purple | #7C3AED |

### Typography
- **Font Family**: Geist Sans (default)
- **Headings**: Bold, 600-700 weight
- **Body**: Regular, 400-500 weight
- **Labels**: Semibold, uppercase with tracking

### Components
- Built with shadcn/ui (Radix UI primitives)
- Fully accessible
- Dark mode support
- Customizable via Tailwind CSS

---

## 🔧 Configuration

### Tailwind CSS

Custom configuration in `tailwind.config.js`:

```javascript
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... more custom colors
      }
    }
  }
}
```

### Prisma

Database schema defined in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🧪 Testing

### Run Test Scripts

```bash
# Test database connection
npm run test-db

# Test fingerprint scanning
npm run test-fingerprint

# Test teacher attendance
npm run test-teacher-attendance

# Test guardian login
npm run test-guardian-login
```

---

## 📈 Screenshots

<!-- Add screenshots here -->
<!-- 
![Landing Page](screenshots/landing.png)
![Admin Dashboard](screenshots/admin-dashboard.png)
![Teacher Dashboard](screenshots/teacher-dashboard.png)
![Student Dashboard](screenshots/student-dashboard.png)
![Guardian Dashboard](screenshots/guardian-dashboard.png)
![Analytics Page](screenshots/analytics.png)
-->

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure JWT secret key
- `SMTP_*` - Email configuration (optional)
- `VAPID_*` - Web push configuration (optional)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Authors

- **PrinceKhanX** - Initial development

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Prisma](https://www.prisma.io/) for the excellent ORM
- [Next.js](https://nextjs.org/) for the React framework

---

## 📞 Support

For support, email support@fingerprint-attendance.com or open an issue in the repository.

---

## 🗺️ Roadmap

### Phase 1 (Completed)
- ✅ User authentication system
- ✅ Role-based dashboards
- ✅ Basic attendance tracking
- ✅ Real-time updates with Socket.io
- ✅ Modern UI with shadcn/ui
- ✅ Dark mode support
- ✅ Responsive design

### Phase 2 (In Progress)
- 🔄 Fingerprint sensor integration
- 🔄 Push notification system
- 🔄 Advanced analytics
- 🔄 Email notifications

### Phase 3 (Planned)
- 📋 Mobile app (React Native)
- 📋 Biometric face recognition
- 📋 Advanced reporting
- 📋 Multi-language support
- 📋 Integration with school management systems

---

**Built with ❤️ using Next.js and TypeScript**
