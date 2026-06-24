import type { Metadata } from "next";
import "../styles/globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Fingerprint Attendance",
  description: "Admin, teacher, and student attendance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900">
        <ThemeProvider defaultTheme="light" storageKey="fingerprint-attendance-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
