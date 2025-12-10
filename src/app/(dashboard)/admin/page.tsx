'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, FolderTree, FileText, Settings, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { UsersView } from '@/components/admin/views/users-view'
import { CategoriesView } from '@/components/admin/views/categories-view'
import { AuditLogView } from '@/components/admin/views/audit-view'
import { SettingsView } from '@/components/admin/views/settings-view'

const navItems = [
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    view: UsersView,
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: FolderTree,
    view: CategoriesView,
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: FileText,
    view: AuditLogView,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    view: SettingsView,
  },
]

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [activeTab, setActiveTab] = useState(tabParam || 'users')

  // Sync state with URL param
  useEffect(() => {
    if (tabParam && navItems.some(item => item.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // Update URL without full reload
    router.push(`/admin?tab=${tabId}`, { scroll: false })
  }

  const ActiveView = navItems.find(item => item.id === activeTab)?.view || UsersView

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
            <p className="text-muted-foreground">
              Manage system settings, users, and content
            </p>
          </div>
          {/* Back Button removed as per user request to 'not back to dashboard' in this context, 
              but standard navigation back out might still be desired. 
              The user specifically said "I mean not back to the dashbboard" regarding the previous button I added.
              So I will omit it here to be safe and clean.
          */}
        </div>

        <nav className="flex items-center gap-1 p-1 bg-muted/50 backdrop-blur-md rounded-xl w-fit border border-white/10">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-nav-pill"
                    className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-2 text-foreground">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveView />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
