import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Swedish City Calendar - Klimatkalendern.nu",
  description: "Prenumerera på klimatevent i din stad. Filtrerade kalendrar från klimatkalendern.nu för alla svenska städer.",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laddar...</div>}>
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
