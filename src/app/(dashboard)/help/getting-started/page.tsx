/**
 * Getting Started Guide
 *
 * Introduction and quick start guide for new Ticket Team users
 */

import Link from 'next/link'
import { Lightbulb, ArrowLeft, Check, MessageSquare, BookOpen, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const metadata = {
  title: 'Getting Started | Help Center | Ticket Team',
  description: 'Quick start guide for new Ticket Team users',
}

// Static generation - tutorial content doesn't change frequently
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function GettingStartedPage() {
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/help">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Help Center
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Getting Started with Ticket Team</h1>
            <p className="text-muted-foreground">
              Everything you need to know to get started
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Welcome to Ticket Team!</AlertTitle>
        <AlertDescription>
          This guide will help you get familiar with the platform in just a few minutes. Follow along to learn how to create tickets, use AI chat, and more.
        </AlertDescription>
      </Alert>

      {/* Quick Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">What is Ticket Team?</h2>
        <div className="prose dark:prose-invert">
          <p>
            Ticket Team is La Verdad Christian College&apos;s helpdesk platform that makes it easy to:
          </p>
          <ul>
            <li>Get IT support quickly and efficiently</li>
            <li>Track the status of your requests</li>
            <li>Find answers in our knowledge base</li>
            <li>Get instant help from our AI assistant</li>
          </ul>
        </div>
      </div>

      {/* Step 1: First Login */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step 1: Sign In</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              Logging In for the First Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the Ticket Team website</li>
              <li>Click &quot;Sign In with Google&quot;</li>
              <li>Use your La Verdad email:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Faculty/Staff: yourname@laverdad.edu.ph</li>
                  <li>Students: yourname@student.laverdad.edu.ph</li>
                </ul>
              </li>
              <li>Authorize the application when prompted</li>
              <li>You&apos;ll be redirected to your dashboard</li>
            </ol>
            <Alert>
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                Only La Verdad email addresses are accepted. If you&apos;re having trouble, contact IT support.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Step 2: Dashboard Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step 2: Understanding the Dashboard</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              Your Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your dashboard is the main hub where you can:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">View Statistics</p>
                  <p className="text-sm text-muted-foreground">See your ticket counts and statuses at a glance</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Recent Tickets</p>
                  <p className="text-sm text-muted-foreground">Quick access to your latest support requests</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Quick Actions</p>
                  <p className="text-sm text-muted-foreground">Create new tickets, use AI chat, or browse KB</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Stay updated on ticket progress</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Create First Ticket */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" id="create-ticket">Step 3: Create Your First Ticket</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              Submitting a Support Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When you need IT support, create a ticket:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Click &quot;New Ticket&quot; in the sidebar or dashboard</li>
              <li>Fill in the form:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Title:</strong> Brief summary (e.g., &quot;Cannot access email&quot;)</li>
                  <li><strong>Description:</strong> Detailed explanation of the issue</li>
                  <li><strong>Category:</strong> Select the most relevant category</li>
                  <li><strong>Priority:</strong> Choose based on urgency (see FAQ)</li>
                </ul>
              </li>
              <li>Optionally attach screenshots or error logs</li>
              <li>Click &quot;Submit Ticket&quot;</li>
            </ol>
            <Alert>
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription>
                The more details you provide, the faster we can resolve your issue. Include error messages, steps to reproduce, and when the problem started.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Step 4: AI Chat */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" id="ai-chat">Step 4: Use the AI Chat Assistant</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                4
              </div>
              Get Instant Help with AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              For quick questions, try our AI assistant first:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click &quot;AI Chat&quot; in the sidebar</li>
              <li>Type your question (e.g., &quot;How do I reset my password?&quot;)</li>
              <li>The AI will search the knowledge base and provide an answer</li>
              <li>If needed, you can escalate to a ticket directly from the chat</li>
            </ol>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium">Example Questions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>&quot;How do I connect to campus Wi-Fi?&quot;</li>
                <li>&quot;What are the VPN setup instructions?&quot;</li>
                <li>&quot;How do I access my student email?&quot;</li>
                <li>&quot;Where can I find Microsoft Office?&quot;</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 5: Knowledge Base */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" id="knowledge-base">Step 5: Browse the Knowledge Base</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                5
              </div>
              Self-Service Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Find detailed guides and documentation:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click &quot;Knowledge Base&quot; in the sidebar</li>
              <li>Use the search bar or browse by category</li>
              <li>Click on an article to read the full content</li>
              <li>Vote whether the article was helpful</li>
            </ol>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/kb">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Knowledge Base
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 6: Notifications */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" id="notifications">Step 6: Stay Updated with Notifications</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                6
              </div>
              Managing Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You&apos;ll receive notifications for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Tickets assigned to you</li>
              <li>New comments on your tickets</li>
              <li>Status updates</li>
              <li>Knowledge base updates</li>
            </ul>
            <p className="text-muted-foreground">
              Access notifications:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click the bell icon (🔔) in the top navigation</li>
              <li>View your notifications in the dropdown</li>
              <li>Click a notification to go to the related item</li>
              <li>Mark notifications as read to clear them</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Step 7: Profile Management */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Step 7: Update Your Profile</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                7
              </div>
              Personalizing Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Keep your profile information up to date:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Click your avatar in the top-right corner</li>
              <li>Select &quot;Profile&quot;</li>
              <li>Update your information:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Full name</li>
                  <li>Department</li>
                  <li>Position/Role</li>
                  <li>Phone number</li>
                  <li>Profile photo (optional)</li>
                </ul>
              </li>
              <li>Click &quot;Save Changes&quot;</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Tips for Success</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Try AI Chat First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                For common questions, the AI assistant can provide instant answers 24/7. It&apos;s faster than waiting for a ticket response!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Provide Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                When creating tickets, include screenshots, error messages, and steps you&apos;ve already tried. This speeds up resolution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Check the Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Many common issues have step-by-step guides in the knowledge base. Search before creating a ticket.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Track Your Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You can view all your tickets in &quot;My Tickets&quot; and add comments any time. You&apos;ll get email notifications for updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>You&apos;re All Set!</CardTitle>
          <CardDescription>
            Now that you know the basics, explore the platform and don&apos;t hesitate to reach out if you need help.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Try AI Chat
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tickets/new">
              Create Your First Ticket
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

      {/* Additional Resources */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Additional Resources</h2>
        <div className="grid gap-4">
          <Link href="/help/faq">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Frequently Asked Questions
                  <ArrowLeft className="ml-auto h-4 w-4 rotate-180" />
                </CardTitle>
                <CardDescription>
                  Find answers to common questions about Ticket Team
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/kb">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Knowledge Base
                  <ArrowLeft className="ml-auto h-4 w-4 rotate-180" />
                </CardTitle>
                <CardDescription>
                  Detailed guides, tutorials, and documentation
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

