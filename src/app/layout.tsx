import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Filedoc - Document Management System",
  description: "Modern document management system powered by NeonDB and Vercel. Organize, share, and collaborate on documents with serverless PostgreSQL.",
  keywords: ["Filedoc", "document management", "NeonDB", "Vercel", "Next.js", "TypeScript", "PostgreSQL"],
  authors: [{ name: "Filedoc Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Filedoc - Document Management System",
    description: "Organize, share, and collaborate on documents with serverless PostgreSQL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
