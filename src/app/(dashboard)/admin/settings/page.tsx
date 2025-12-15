'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderTree, FileText, Settings, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoriesView } from '@/components/admin/views/categories-view'
import { AuditLogView } from '@/components/admin/views/audit-view'
import { FeedbackView } from '@/components/admin/views/feedback-view'
import { SettingsView } from '@/components/admin/views/settings-view'

const navItems = [
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
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    view: FeedbackView,
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: Settings,
    view: SettingsView,
  },
]

export default function SystemSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  const [activeTab, setActiveTab] = useState(tabParam || 'categories')

  // Sync state with URL param
  useEffect(() => {
    if (tabParam && navItems.some(item => item.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    // Update URL without full reload
    router.push(`/admin/settings?tab=${tabId}`, { scroll: false })
  }

  const ActiveView = navItems.find(item => item.id === activeTab)?.view || CategoriesView

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
              <p className="text-muted-foreground">
                Manage categories, audit logs, and system configuration
              </p>
            </div>
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
                      layoutId="settings-nav-pill"
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
    </div>
  )
}
