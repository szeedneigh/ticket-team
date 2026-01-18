/**
 * Analytics Layout
 *
 * Shared layout for analytics pages that provides persistent navigation tabs.
 * This ensures tabs remain visible during content loading transitions.
 */

import { AnalyticsLayout } from '@/components/analytics/analytics-layout'

export default function AnalyticsRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <AnalyticsLayout>{children}</AnalyticsLayout>
    </div>
  )
}
