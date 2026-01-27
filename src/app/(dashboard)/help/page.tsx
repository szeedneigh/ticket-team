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
  Lightbulb, 
  ArrowRight,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCenterClient } from '@/components/help/help-center-client'

export const metadata = {
  title: 'Help Center | Ticket Team',
  description: 'Get help with Ticket Team - tutorials, guides, and FAQs',
}

// Static generation - content doesn't change frequently
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

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
          <h1 className="text-3xl font-bold">How can we help you?</h1>
          <p className="text-base text-muted-foreground">
            Search our help center or browse by category
          </p>
        </div>
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

      {/* Searchable Popular Topics & Video Tutorials */}
      <HelpCenterClient />

      {/* Still Need Help? */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
          <CardDescription>
            Can&apos;t find what you&apos;re looking for? We&apos;re here to help!
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

