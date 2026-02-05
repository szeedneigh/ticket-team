'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { getCategories } from '@/app/actions/categories'
import { getAuditLogPageData } from '@/app/actions/audit'
import { getFeedbackAnalytics } from '@/app/actions/feedback'
import { getSystemConfig } from '@/lib/settings/actions'
import { getSetting } from '@/lib/settings/actions'
import { getDepartments } from '@/lib/departments/actions'

type TabPrefetchCache = Record<string, unknown>

type TabPrefetchContextValue = {
  cache: TabPrefetchCache
  prefetch: (tabId: string) => Promise<void>
}

const TabPrefetchContext = createContext<TabPrefetchContextValue | null>(null)

const TOP_LEVEL_FETCHERS: Record<string, () => Promise<unknown>> = {
  categories: () => getCategories().then((r) => (r.error ? null : r.data)),
  audit: () =>
    getAuditLogPageData({}, 1, 50, {
      field: 'performed_at',
      order: 'desc',
    }).then((r) => (r.success ? r.data : null)),
  feedback: () =>
    getFeedbackAnalytics('all').then((r) =>
      r.error ? null : { feedback: r.feedback, summary: r.summary }
    ),
  settings: () => Promise.resolve(null), // SettingsView has sub-tabs, prefetch on sub-tab hover
}

const SETTINGS_SUB_FETCHERS: Record<string, () => Promise<unknown>> = {
  system: () => getSystemConfig(),
  email: () => getSetting('email_notifications_config'),
  departments: () => getDepartments().then((r) => (r.success ? r.data : null)),
  categories: () => getCategories().then((r) => (r.error ? null : r.data)),
}

export function TabPrefetchProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<TabPrefetchCache>({})

  const prefetch = useCallback((tabId: string): Promise<void> => {
    const fetcher = TOP_LEVEL_FETCHERS[tabId] ?? SETTINGS_SUB_FETCHERS[tabId]
    if (!fetcher) return Promise.resolve()
    // Use setTimeout(0) to defer to a new macrotask - queueMicrotask still runs
    // within the same event loop tick and can trigger "Cannot update component
    // while rendering another" errors in React Strict Mode or concurrent rendering.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setCache((prev) => {
          if (prev[tabId]) {
            resolve()
            return prev
          }
          fetcher()
            .then((data) => setCache((c) => ({ ...c, [tabId]: data })))
            .catch(() => {})
            .finally(() => resolve())
          return prev
        })
      }, 0)
    })
  }, [])

  return (
    <TabPrefetchContext.Provider value={{ cache, prefetch }}>
      {children}
    </TabPrefetchContext.Provider>
  )
}

export function useTabPrefetch() {
  const ctx = useContext(TabPrefetchContext)
  return ctx ?? { cache: {} as TabPrefetchCache, prefetch: async () => {} }
}
