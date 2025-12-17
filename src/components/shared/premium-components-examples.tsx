/**
 * Premium UI Components Examples
 *
 * This file contains examples of how to use the premium UI enhancements
 * implemented in Phase 5. Copy and adapt these patterns to your actual components.
 *
 * DO NOT import this file in production code - it's for reference only.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useCountUp, useCountUpOnView } from '@/lib/hooks/use-count-up'
import { StaggerContainer, StaggerItem } from './page-transition'

/**
 * Example 1: Stats Card with Count-Up Animation
 * Perfect for dashboard KPIs and metrics
 */
export function StatsCardExample() {
  // Basic count-up (starts immediately)
  const totalTickets = useCountUp(156, 1500)

  // Count-up with intersection observer (starts when visible)
  const [resolvedTickets, resolvedRef] = useCountUpOnView(98)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Basic stats card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTickets}</div>
          <p className="text-xs text-muted-foreground mt-1">
            +12% from last month
          </p>
        </CardContent>
      </Card>

      {/* Stats card with gradient text */}
      <Card ref={resolvedRef}>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Resolved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold gradient-text">
            {resolvedTickets}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            62.8% resolution rate
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Example 2: Card with Gradient Border Glow
 * Use for featured content or important CTAs
 */
export function GlowCardExample() {
  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle>Featured Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This card has a premium gradient border glow on hover.
          Perfect for highlighting premium features or important actions.
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Example 3: Activity Feed with Staggered Animation
 * Great for recent activity lists, notifications, or timelines
 */
export function ActivityFeedExample() {
  const activities = [
    { id: 1, text: 'Ticket #123 was created', time: '2 minutes ago' },
    { id: 2, text: 'Ticket #122 was resolved', time: '15 minutes ago' },
    { id: 3, text: 'New comment on #121', time: '1 hour ago' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <StaggerContainer>
          {activities.map((activity) => (
            <StaggerItem key={activity.id}>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className="flex-1">
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </CardContent>
    </Card>
  )
}

/**
 * Example 4: Premium KPI Dashboard Section
 * Combines multiple premium features for maximum impact
 */
export function PremiumKPIDashboard() {
  const openTickets = useCountUp(28, 1000)
  const avgResponseTime = useCountUp(4, 1200)
  const satisfaction = useCountUp(94, 1500)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="card-glow">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{openTickets}</div>
            <div className="text-sm text-muted-foreground">Open Tickets</div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-glow">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text mb-2">
              {avgResponseTime}h
            </div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-glow">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{satisfaction}%</div>
            <div className="text-sm text-muted-foreground">Satisfaction</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * USAGE NOTES:
 *
 * 1. Count-Up Hook:
 *    - useCountUp(targetNumber, durationMs) - Starts immediately
 *    - useCountUpOnView(targetNumber) - Starts when element enters viewport
 *    - Perfect for dashboard stats, KPIs, metrics
 *
 * 2. Card Gradient Glow:
 *    - Add 'card-glow' className to any Card component
 *    - Automatically shows gradient border on hover
 *    - Uses brand colors from your design system
 *
 * 3. Gradient Text:
 *    - Add 'gradient-text' className to any text element
 *    - Creates premium gradient text effect
 *    - Works best on large, bold text (headings, numbers)
 *
 * 4. Stagger Animations:
 *    - Wrap list in <StaggerContainer>
 *    - Wrap each item in <StaggerItem>
 *    - Items fade in sequentially with 80ms delay
 *    - Perfect for activity feeds, lists, grids
 */
