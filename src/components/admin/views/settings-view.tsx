'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2, Mail, Building2, Tag, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SystemConfigSettings } from '@/components/settings/system-config-settings'
import { DepartmentSettings } from '@/components/settings/department-settings'
import { EmailSettings } from '@/components/settings/email-settings'
import { CategorySettings } from '@/components/settings/category-settings'

const subTabs = [
  {
    id: 'system',
    label: 'System Config',
    icon: Settings2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Configure SLA settings, response times, and system behavior',
    component: SystemConfigSettings
  },
  {
    id: 'email',
    label: 'Email Notifications',
    icon: Mail,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Configure email notification preferences and templates',
    component: EmailSettings
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: Building2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    description: 'Manage organizational departments and teams',
    component: DepartmentSettings
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Tag,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    description: 'Manage ticket and knowledge base categories',
    component: CategorySettings
  }
]

const VALID_SUB_IDS = ['system', 'email', 'departments', 'categories'] as const

export function SettingsView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subParam = searchParams.get('sub')
  const [activeTab, setActiveTab] = useState(
    subParam && VALID_SUB_IDS.includes(subParam as (typeof VALID_SUB_IDS)[number])
      ? subParam
      : 'system'
  )

  useEffect(() => {
    if (subParam && VALID_SUB_IDS.includes(subParam as (typeof VALID_SUB_IDS)[number])) {
      setActiveTab(subParam)
    }
  }, [subParam])

  const handleSubTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'settings')
    params.set('sub', tabId)
    router.push(`/admin/settings?${params.toString()}`, { scroll: false })
  }

  const ActiveComponent = subTabs.find(tab => tab.id === activeTab)?.component || SystemConfigSettings
  const activeTabDetails = subTabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Floating Glass Sidebar */}
      <aside className="lg:w-72 flex-shrink-0">
        <div className="sticky top-8 bg-muted/50 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-xl shadow-black/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          <nav className="relative flex flex-col space-y-1">
            {subTabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                    isActive 
                      ? "text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-settings-tab"
                      className="absolute inset-0 bg-background border border-border/50 rounded-xl shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  {/* Icon Container */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                    isActive ? tab.bgColor : "bg-muted group-hover:bg-muted/80"
                  )}>
                    <Icon className={cn("w-4 h-4 transition-colors", isActive ? tab.color : "text-muted-foreground group-hover:text-foreground")} />
                  </div>

                  <div className="relative z-10 flex flex-col items-start gap-0.5 flex-1">
                    <span className={cn("leading-none transition-colors", isActive ? "font-semibold text-foreground" : "")}>
                      {tab.label}
                    </span>
                  </div>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-10"
                    >
                      <ChevronRight className="w-4 h-4 text-primary/50" />
                    </motion.div>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="space-y-1 px-1">
              <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                {activeTabDetails?.label}
              </h2>
              <p className="text-muted-foreground text-lg">
                {activeTabDetails?.description}
              </p>
            </div>
            
            {/* Content Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <ActiveComponent />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
