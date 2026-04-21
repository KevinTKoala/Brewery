import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/lib/auth-context"
import { ToastProvider } from "@/lib/toast-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Brewery - Coffee Community Marketplace",
  description: "Discover roasteries, cafes, and connect with coffee enthusiasts",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
