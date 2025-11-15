import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Klimatkalendern - Klimatevent i din stad",
  description: "Prenumerera på klimatevent i din stad. Filtrerade kalendrar från klimatkalendern.nu för alla svenska städer.",
  metadataBase: new URL('https://klimatkalendern.vercel.app'),
  openGraph: {
    title: "Klimatkalendern - Klimatevent i din stad",
    description: "Prenumerera på klimatevent i din stad. Filtrerade kalendrar från klimatkalendern.nu för alla svenska städer.",
    url: 'https://klimatkalendern.vercel.app',
    siteName: 'Klimatkalendern',
    locale: 'sv_SE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Klimatkalendern - Klimatevent i din stad",
    description: "Prenumerera på klimatevent i din stad",
  },
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
