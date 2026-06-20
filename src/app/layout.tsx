import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Fingerprint Attendance",
  description: "Admin, teacher, and student attendance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
