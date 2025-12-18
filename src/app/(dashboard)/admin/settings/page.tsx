'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderTree, FileText, Settings, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
    description: 'Manage ticket and KB categories'
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: FileText,
    view: AuditLogView,
    description: 'View system activity logs'
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    view: FeedbackView,
    description: 'User feedback and ratings'
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: Settings,
    view: SettingsView,
    description: 'Global configuration'
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
    <div className="min-h-screen bg-background relative">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 pb-8">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl">
          {/* Header Content */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="space-y-4">
              {/* Back Navigation - Integrated subtly */}
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2 mb-2 p-0 h-auto font-normal hover:bg-transparent">
                <Link href="/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Admin Dashboard
                </Link>
              </Button>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1f3463] to-[#2cafdd] pb-2">
                System Administration
              </h1>
              <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 max-w-2xl">
                Manage system configurations, view audit logs, and oversee global settings.
                <Settings className="h-4 w-4 text-[#2cafdd]" />
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Glass Card Style */}
          <div className="bg-background/40 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 shadow-xl shadow-[#1f3463]/5 w-fit">
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "text-white shadow-lg shadow-[#1f3463]/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="settings-nav-pill"
                        className="absolute inset-0 bg-gradient-to-r from-[#1f3463] to-[#2cafdd] rounded-xl"
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
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
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
