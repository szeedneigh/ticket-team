import { requireAuth } from '@/lib/auth/session'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar } from '@/components/shared/sidebar'
import { Footer } from '@/components/shared/footer'
import { PresenceTracker } from '@/components/shared/presence-tracker'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#d4e8f0] via-[#e8f4f8] to-[#0a4d7e] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PresenceTracker user={user} />
      <Navbar user={user} />
      <div className="flex flex-1">
        <Sidebar user={user} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
