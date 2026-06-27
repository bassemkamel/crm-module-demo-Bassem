import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM · Sales pipeline",
  description: "Track clients and sales opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/opportunities" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                C
              </span>
              <span className="text-base font-semibold text-zinc-900">
                CRM
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium text-zinc-600">
              <Link
                href="/opportunities"
                className="rounded-md px-3 py-1.5 hover:bg-zinc-100"
              >
                Opportunities
              </Link>
              <Link
                href="/clients"
                className="rounded-md px-3 py-1.5 hover:bg-zinc-100"
              >
                Clients
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
