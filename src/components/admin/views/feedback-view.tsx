/**
 * Feedback View Component
 *
 * View and analyze ticket feedback from users
 * Used in Settings tabs
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Download, Star, TrendingUp, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getFeedbackAnalytics } from '@/app/actions/feedback'
import type { FeedbackWithDetails, FeedbackSummary } from '@/lib/types/templates'

export function FeedbackView() {
  const { toast } = useToast()

  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>([])
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getFeedbackAnalytics(ratingFilter)

      if (result.error) {
        throw new Error(result.error)
      }

      setFeedback(result.feedback || [])
      setSummary(result.summary ?? null)
    } catch (error) {
      console.error('Error fetching feedback:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load feedback',
        variant: 'destructive',
      })
      setFeedback([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [ratingFilter, toast])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback, ratingFilter])

  const handleExportCSV = () => {
    if (feedback.length === 0) {
      toast({
        title: 'No Data',
        description: 'No feedback to export',
        variant: 'destructive',
      })
      return
    }

    const headers = ['Date', 'Ticket', 'Category', 'User', 'Rating', 'Comment']
    const rows = feedback.map((f) => [
      new Date(f.created_at).toLocaleDateString(),
      f.ticket?.title || 'Unknown',
      f.ticket?.category || 'Unknown',
      f.user?.full_name || 'Unknown',
      f.rating.toString(),
      f.comment || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `feedback-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Export Complete',
      description: `Exported ${feedback.length} feedback entries to CSV`,
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
    if (rating >= 3) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Feedback Analytics</h3>
          <p className="text-muted-foreground">
            View and analyze ticket satisfaction ratings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={feedback.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchFeedback} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalFeedback}</div>
              <p className="text-xs text-muted-foreground">All time responses</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{summary.averageRating}</span>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground">Out of 5 stars</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Positive Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.ratingDistribution
                  .filter((d) => d.rating >= 4)
                  .reduce((sum, d) => sum + d.percentage, 0)}%
              </div>
              <p className="text-xs text-muted-foreground">4+ star ratings</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.recentTrend.length > 0 ? (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {summary.recentTrend[summary.recentTrend.length - 1]?.avgRating || '-'}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold">-</span>
              )}
              <p className="text-xs text-muted-foreground">Last 30 days avg</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {summary && (
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of feedback by star rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...summary.ratingDistribution].reverse().map((d) => (
                <div key={d.rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{d.rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm text-muted-foreground">
                      {d.count} ({d.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            {feedback.length} feedback entr{feedback.length !== 1 ? 'ies' : 'y'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground text-center px-4">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p>No individual feedback to display</p>
              <p className="text-sm">
                {summary && summary.totalFeedback > 0
                  ? 'Individual feedback details are visible to super admins only. Aggregate metrics are shown above.'
                  : 'Feedback will appear here after tickets are resolved.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(f.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{f.ticket?.title || 'Unknown'}</p>
                        <Badge variant="outline" className="text-xs">
                          {f.ticket?.category || 'Unknown'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {f.user?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStars(f.rating)}
                        <Badge className={getRatingColor(f.rating)}>{f.rating}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {f.comment ? (
                        <p className="text-sm text-muted-foreground truncate">{f.comment}</p>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No comment</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
