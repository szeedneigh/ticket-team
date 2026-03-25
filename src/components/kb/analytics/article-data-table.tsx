/**
 * Article Data Table Component
 *
 * Reusable data table for displaying articles with sorting.
 * Features:
 * - Sortable columns
 * - Responsive design (table on desktop, cards on mobile)
 * - Link to article detail
 * - Category badges
 */

'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpDown, ExternalLink, Eye, ThumbsUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { CategoryBadge } from '../category-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface ArticleData {
  id: string
  title: string
  category: string
  view_count: number
  helpful_votes: number
  total_votes: number
  helpfulness_rate: number
  published_at: string | null
  author: {
    full_name: string
    avatar_url: string | null
  }
}

interface ArticleDataTableProps {
  data: ArticleData[]
  title: string
  description?: string
}

type SortField = 'title' | 'view_count' | 'helpfulness_rate' | 'published_at'
type SortDirection = 'asc' | 'desc'

export const ArticleDataTable = memo(function ArticleDataTable({ data, title, description }: ArticleDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('view_count')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sort data - memoize expensive sort operation
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal: string | number | null = a[sortField]
      let bVal: string | number | null = b[sortField]

      // Handle null values
      if (aVal === null) aVal = sortDirection === 'asc' ? Infinity : -Infinity
      if (bVal === null) bVal = sortDirection === 'asc' ? Infinity : -Infinity

      // Handle dates
      if (sortField === 'published_at') {
        aVal = aVal ? new Date(aVal as string).getTime() : 0
        bVal = bVal ? new Date(bVal as string).getTime() : 0
      }

      if (sortDirection === 'asc') {
        return (aVal as number) > (bVal as number) ? 1 : -1
      } else {
        return (aVal as number) < (bVal as number) ? 1 : -1
      }
    })
  }, [data, sortField, sortDirection])

  // Handle sort - useCallback for stable reference
  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDir) => prevDir === 'asc' ? 'desc' : 'asc')
        return prevField
      } else {
        setSortDirection('desc')
        return field
      }
    })
  }, [])

  // Format date - useCallback for stable reference
  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 opacity-50" />
    }
    return (
      <ArrowUpDown
        className={`h-4 w-4 ml-2 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
      />
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No articles to display
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('title')}
                    className="h-8 -ml-3"
                  >
                    Article
                    <SortIcon field="title" />
                  </Button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('view_count')}
                    className="h-8"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Views
                    <SortIcon field="view_count" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('helpfulness_rate')}
                    className="h-8"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful
                    <SortIcon field="helpfulness_rate" />
                  </Button>
                </TableHead>
                <TableHead>Author</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('published_at')}
                    className="h-8 -ml-3"
                  >
                    Published
                    <SortIcon field="published_at" />
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((article) => (
                <TableRow key={article.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1 max-w-md">
                      <span className="line-clamp-1">{article.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={article.category} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {article.view_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {article.total_votes > 0 ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-semibold">{article.helpfulness_rate}%</span>
                        <span className="text-xs text-muted-foreground">
                          {article.helpful_votes}/{article.total_votes}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No votes</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <Image
                          src={article.author.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${article.author.full_name}`}
                          alt={article.author.full_name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </Avatar>
                      <span className="text-sm">{article.author.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(article.published_at)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/kb/${article.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {sortedData.map((article) => (
            <Card key={article.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Title and Category */}
                  <div className="space-y-2">
                    <Link
                      href={`/kb/${article.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary line-clamp-2"
                    >
                      {article.title}
                    </Link>
                    <CategoryBadge category={article.category} />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{article.view_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      <span>
                        {article.total_votes > 0
                          ? `${article.helpfulness_rate}%`
                          : 'No votes'}
                      </span>
                    </div>
                  </div>

                  {/* Author and Date */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <Image
                          src={article.author.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${article.author.full_name}`}
                          alt={article.author.full_name}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      </Avatar>
                      <span>{article.author.full_name}</span>
                    </div>
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
