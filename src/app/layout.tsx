import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AgencyHeader } from "@/components/layout/agency-header";
import { AgencySidebar } from "@/components/layout/agency-sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Agency Website Engine | Phase 1 Foundation",
  description:
    "Internal website production platform for web development agencies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans">
        <AgencyHeader />
        <div className="flex flex-1 w-full overflow-hidden">
          <AgencySidebar />
          <main className="flex-1 overflow-y-auto bg-slate-900/40 p-6 md:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
