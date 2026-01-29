'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  MessageSquare, 
  Search,
  Book,
  Play,
  AlertCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface HelpTopic {
  id: string
  title: string
  href: string
  icon: typeof MessageSquare
  category: string
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'create-ticket',
    title: 'How to Create a Ticket',
    href: '/help/getting-started#create-ticket',
    icon: MessageSquare,
    category: 'Tickets',
  },
  {
    id: 'ai-chat',
    title: 'Using AI Chat Assistant',
    href: '/help/getting-started#ai-chat',
    icon: MessageSquare,
    category: 'AI Chat',
  },
  {
    id: 'kb-search',
    title: 'Searching the Knowledge Base',
    href: '/help/getting-started#knowledge-base',
    icon: Book,
    category: 'Knowledge Base',
  },
  {
    id: 'notifications',
    title: 'Managing Notifications',
    href: '/help/getting-started#notifications',
    icon: MessageSquare,
    category: 'Account',
  },
  {
    id: 'ticket-status',
    title: 'Understanding Ticket Status',
    href: '/help/faq#ticket-status',
    icon: MessageSquare,
    category: 'Tickets',
  },
  {
    id: 'response-time',
    title: 'Expected Response Times',
    href: '/help/faq#response-time',
    icon: MessageSquare,
    category: 'Support',
  },
]

interface VideoTutorial {
  id: string
  title: string
  description: string
  comingSoon: boolean
}

const VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: 'quickstart',
    title: 'Quick Start Guide',
    description: 'Learn the basics in 5 minutes',
    comingSoon: true,
  },
  {
    id: 'first-ticket',
    title: 'Creating Your First Ticket',
    description: 'Step-by-step tutorial',
    comingSoon: true,
  },
  {
    id: 'ai-chat-tutorial',
    title: 'Using AI Chat',
    description: 'Get help instantly',
    comingSoon: true,
  },
]

interface HelpCenterClientProps {
  className?: string
}

export function HelpCenterClient({ className }: HelpCenterClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return HELP_TOPICS
    }

    const query = searchQuery.toLowerCase()
    return HELP_TOPICS.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Group filtered topics by category
  const groupedTopics = useMemo(() => {
    const groups: Record<string, HelpTopic[]> = {}
    filteredTopics.forEach((topic) => {
      if (!groups[topic.category]) {
        groups[topic.category] = []
      }
      groups[topic.category].push(topic)
    })
    return groups
  }, [filteredTopics])

  const handleVideoClick = (video: VideoTutorial) => {
    if (video.comingSoon) {
      toast.info('Coming Soon', {
        description: 'Video tutorials are currently being prepared. Check back soon!',
      })
    }
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles, guides, and tutorials..."
            className="pl-10 h-12 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Try searching for &quot;create ticket&quot;, &quot;knowledge base&quot;, or &quot;notifications&quot;
        </p>
      </div>

      {/* Popular Topics with Search Results */}
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl font-bold text-center">
          {searchQuery ? 'Search Results' : 'Popular Topics'}
        </h2>
        
        {filteredTopics.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No results found for &quot;{searchQuery}&quot;. Try different keywords or browse our guides below.
            </AlertDescription>
          </Alert>
        ) : searchQuery ? (
          // Show grouped results when searching
          <div className="space-y-6">
            {Object.entries(groupedTopics).map(([category, topics]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 text-primary">{category}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topics.map((topic) => {
                    const Icon = topic.icon
                    return (
                      <Link key={topic.id} href={topic.href}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              {topic.title}
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Show normal grid when not searching
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {HELP_TOPICS.map((topic) => {
              const Icon = topic.icon
              return (
                <Link key={topic.id} href={topic.href}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        {topic.title}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Video Tutorials */}
      {!searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <h2 className="text-2xl font-bold">Video Tutorials</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {VIDEO_TUTORIALS.map((video) => (
              <Card
                key={video.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                <div className="p-0">
                  <div className="aspect-video bg-muted flex flex-col items-center justify-center rounded-t-lg relative">
                    <Play className="h-12 w-12 text-muted-foreground mb-2" />
                    {video.comingSoon && (
                      <Badge variant="secondary" className="absolute top-2 right-2">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Video tutorials are currently being prepared. Check back soon for step-by-step guides!
          </p>
        </div>
      )}
    </div>
  )
}
