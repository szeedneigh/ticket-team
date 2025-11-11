/**
 * KB Analytics Dashboard Page
 *
 * Comprehensive analytics dashboard for knowledge base performance.
 * Displays statistics, charts, and tables for admins.
 *
 * Access: Admin+ only
 */

import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/session'
import { isAdmin } from '@/lib/types/database'
import {
  getKBAnalyticsStats,
  getViewsOverTime,
  getCategoryDistribution,
  getTopArticles,
  getMostHelpfulArticles,
  getRecentArticles
} from '@/lib/kb/analytics-queries'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ViewsOverTimeChart } from '@/components/kb/analytics/views-over-time-chart'
import { CategoryDistributionChart } from '@/components/kb/analytics/category-distribution-chart'
import { TopArticlesChart } from '@/components/kb/analytics/top-articles-chart'
import { ArticleDataTable } from '@/components/kb/analytics/article-data-table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  FileText,
  CheckCircle,
  FileEdit,
  Eye,
  ThumbsUp
} from 'lucide-react'

export const metadata = {
  title: 'Analytics - Knowledge Base',
  description: 'Knowledge base performance analytics and insights'
}

export default async function KBAnalyticsPage() {
  // Check authentication and authorization
  const user = await requireAuth()

  if (!isAdmin(user.role)) {
    redirect('/kb')
  }

  // Fetch all analytics data in parallel
  const [
    stats,
    viewsData,
    categoryData,
    topArticles,
    helpfulArticles,
    recentArticles
  ] = await Promise.all([
    getKBAnalyticsStats(),
    getViewsOverTime(30),
    getCategoryDistribution(),
    getTopArticles(10),
    getMostHelpfulArticles(10),
    getRecentArticles(10)
  ])

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/kb">Knowledge Base</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Knowledge base performance metrics and insights
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total Articles"
          value={stats.total}
          icon={FileText}
          description={`${stats.published} published`}
        />
        <StatsCard
          title="Published"
          value={stats.published}
          icon={CheckCircle}
          description={`${stats.draft} drafts`}
        />
        <StatsCard
          title="Draft Articles"
          value={stats.draft}
          icon={FileEdit}
          description={`${stats.archived} archived`}
          variant={stats.draft > 10 ? 'warning' : 'default'}
        />
        <StatsCard
          title="Total Views"
          value={stats.total_views.toLocaleString()}
          icon={Eye}
          description={`${stats.published > 0 ? Math.round(stats.total_views / stats.published) : 0} avg per article`}
        />
        <StatsCard
          title="Helpfulness"
          value={`${stats.avg_helpfulness_rate}%`}
          icon={ThumbsUp}
          description="Average rating"
          variant={stats.avg_helpfulness_rate < 60 ? 'warning' : 'default'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViewsOverTimeChart data={viewsData} days={30} />
        <CategoryDistributionChart data={categoryData} />
      </div>

      {/* Top Articles Chart */}
      <div className="grid grid-cols-1 gap-6">
        <TopArticlesChart data={topArticles} limit={10} />
      </div>

      {/* Data Tables Section */}
      <div className="space-y-6">
        <ArticleDataTable
          data={topArticles}
          title="Most Viewed Articles"
          description="Top 10 articles by view count"
        />

        <ArticleDataTable
          data={helpfulArticles}
          title="Most Helpful Articles"
          description="Top 10 articles by helpfulness rating"
        />

        <ArticleDataTable
          data={recentArticles}
          title="Recently Published"
          description="Latest 10 published articles"
        />
      </div>
    </div>
  )
}
