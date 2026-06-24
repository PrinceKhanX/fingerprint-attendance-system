import type { Metadata } from "next";
import "../styles/globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Fingerprint Attendance",
  description: "Admin, teacher, and student attendance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider defaultTheme="light" storageKey="fingerprint-attendance-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
