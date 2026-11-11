import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import "./globals.css"
import { NavigationSidebar } from "@/components/navigation/Sidebar"
import { DashboardHeader } from "@/components/navigation/Header"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FPL Analytics",
  description:
    "Premium Fantasy Premier League analytics dashboard for team 6906082.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <NavigationSidebar />

        {/* Content column — offset by the fixed sidebar */}
        <div className="pl-60">
          <DashboardHeader />
          <main className="mx-auto w-full max-w-[1440px] px-6 py-7 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
