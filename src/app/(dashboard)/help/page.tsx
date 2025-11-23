/**
 * Help Center - Home Page
 *
 * Main entry point for help resources, tutorials, and documentation
 */

import Link from 'next/link'
import { 
  BookOpen, 
  MessageSquare, 
  FileQuestion, 
  Video, 
  Lightbulb, 
  Search,
  ArrowRight,
  HelpCircle,
  Book,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const metadata = {
  title: 'Help Center | Ticket Team',
  description: 'Get help with Ticket Team - tutorials, guides, and FAQs',
}

export default function HelpCenterPage() {
  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">How can we help you?</h1>
          <p className="text-xl text-muted-foreground">
            Search our help center or browse by category
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles, guides, and tutorials..."
            className="pl-10 h-12 text-base"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Try searching for "create ticket", "knowledge base", or "notifications"
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/help/getting-started">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="mt-4">Getting Started</CardTitle>
              <CardDescription>
                New to Ticket Team? Start here to learn the basics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between group">
                Read Guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/help/faq">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <FileQuestion className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="mt-4">FAQs</CardTitle>
              <CardDescription>
                Find answers to commonly asked questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between group">
                Browse FAQs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/kb">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="mt-4">Knowledge Base</CardTitle>
              <CardDescription>
                Browse detailed articles and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between group">
                Explore Articles
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Popular Topics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Popular Topics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/help/getting-started#create-ticket">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  How to Create a Ticket
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/help/getting-started#ai-chat">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Using AI Chat Assistant
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/help/getting-started#knowledge-base">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Book className="h-4 w-4 text-primary" />
                  Searching the Knowledge Base
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/help/getting-started#notifications">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Managing Notifications
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/help/faq#ticket-status">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Understanding Ticket Status
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/help/faq#response-time">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Expected Response Times
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Video Tutorials (Placeholder) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Video Tutorials</h2>
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Quick Start Guide</h3>
                <p className="text-sm text-muted-foreground">Learn the basics in 5 minutes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Creating Your First Ticket</h3>
                <p className="text-sm text-muted-foreground">Step-by-step tutorial</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">Using AI Chat</h3>
                <p className="text-sm text-muted-foreground">Get help instantly</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Still Need Help? */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? We're here to help!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask AI Assistant
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tickets/new">
              <FileQuestion className="mr-2 h-4 w-4" />
              Create Support Ticket
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/kb">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse Knowledge Base
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

