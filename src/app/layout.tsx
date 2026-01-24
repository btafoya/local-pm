import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Local PM - Project Management',
  description: 'Linear-like project management with Kanban boards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white antialiased">{children}</body>
    </html>
  )
}
