/**
 * FAQ Page
 *
 * Frequently Asked Questions about Ticket Team
 */

import Link from 'next/link'
import { FileQuestion, ArrowLeft, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata = {
  title: 'FAQs | Help Center | Ticket Team',
  description: 'Frequently asked questions about Ticket Team',
}

export default function FAQPage() {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <FileQuestion className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">
              Find answers to common questions about Ticket Team
            </p>
          </div>
        </div>
      </div>

      {/* General FAQs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">General</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>What is Ticket Team?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Ticket Team is La Verdad Christian College's official helpdesk platform designed to streamline IT support and service requests. It provides:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Easy ticket submission and tracking</li>
                  <li>AI-powered chat assistant for instant help</li>
                  <li>Comprehensive knowledge base</li>
                  <li>Real-time notifications</li>
                  <li>Self-service support resources</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="who-can-use">
            <AccordionTrigger>Who can use Ticket Team?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Ticket Team is available to all La Verdad Christian College community members with valid @laverdad.edu.ph or @student.laverdad.edu.ph email addresses:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Students:</strong> Can create tickets and use AI chat</li>
                  <li><strong>Faculty:</strong> Can create tickets and access knowledge base</li>
                  <li><strong>Staff:</strong> Can manage tickets and create knowledge articles</li>
                  <li><strong>Administrators:</strong> Have full system access</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-to-access">
            <AccordionTrigger>How do I access Ticket Team?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>Access Ticket Team by:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Visit the Ticket Team website</li>
                  <li>Click "Sign In with Google"</li>
                  <li>Use your La Verdad (@laverdad.edu.ph or @student.laverdad.edu.ph) email</li>
                  <li>Authorize the application</li>
                </ol>
                <p className="mt-2">
                  You'll be automatically redirected to the dashboard once signed in.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Tickets FAQs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" id="ticket-status">Tickets</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="create-ticket">
            <AccordionTrigger>How do I create a ticket?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Click the "New Ticket" button in the dashboard or sidebar</li>
                  <li>Fill in the required fields:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Title (brief description of your issue)</li>
                      <li>Detailed description</li>
                      <li>Category (select the most appropriate)</li>
                      <li>Priority (if urgent)</li>
                    </ul>
                  </li>
                  <li>Optionally attach files (screenshots, error logs)</li>
                  <li>Click "Submit Ticket"</li>
                </ol>
                <p className="mt-2">
                  You'll receive a confirmation and can track your ticket in the "My Tickets" section.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ticket-statuses">
            <AccordionTrigger>What do the different ticket statuses mean?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <ul className="space-y-2">
                  <li><strong>Open:</strong> Ticket has been created and is waiting for staff assignment</li>
                  <li><strong>In Progress:</strong> Staff is actively working on your issue</li>
                  <li><strong>On Hold:</strong> Waiting for additional information or external dependency</li>
                  <li><strong>Resolved:</strong> Issue has been fixed; please provide feedback</li>
                  <li><strong>Closed:</strong> Ticket is complete and archived</li>
                  <li><strong>Canceled:</strong> Ticket was canceled (duplicate, no longer needed, etc.)</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="response-time" id="response-time">
            <AccordionTrigger>How long until I get a response?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>Response times depend on ticket priority:</p>
                <ul className="space-y-2 ml-4">
                  <li><strong>High Priority:</strong> Within 2-4 hours during business hours</li>
                  <li><strong>Medium Priority:</strong> Within 1 business day</li>
                  <li><strong>Low Priority:</strong> Within 2-3 business days</li>
                </ul>
                <p className="mt-2">
                  <strong>Business Hours:</strong> Monday-Friday, 8:00 AM - 5:00 PM (PHT)
                </p>
                <p>
                  For urgent issues outside business hours, contact the IT emergency line.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="update-ticket">
            <AccordionTrigger>Can I update my ticket after submitting?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Yes! You can add comments to your ticket at any time. To add information:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to "My Tickets" and click on your ticket</li>
                  <li>Scroll to the "Comments" section</li>
                  <li>Type your message and attach files if needed</li>
                  <li>Click "Add Comment"</li>
                </ol>
                <p className="mt-2">
                  Staff will be notified of your comment and will respond accordingly.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="priority-levels">
            <AccordionTrigger>How do I choose the right priority level?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>Choose priority based on the impact of the issue:</p>
                <ul className="space-y-2 ml-4">
                  <li><strong>High:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>System completely unavailable</li>
                      <li>Critical deadline at risk</li>
                      <li>Security issue</li>
                      <li>Multiple users affected</li>
                    </ul>
                  </li>
                  <li><strong>Medium:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Feature not working, but workaround exists</li>
                      <li>Non-critical functionality issue</li>
                      <li>Single user affected</li>
                    </ul>
                  </li>
                  <li><strong>Low:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>General questions</li>
                      <li>Feature requests</li>
                      <li>Minor issues with no immediate impact</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* AI Chat FAQs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">AI Chat Assistant</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is-ai">
            <AccordionTrigger>What is the AI Chat Assistant?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  The AI Chat Assistant is an intelligent chatbot that can help you:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Find answers from the knowledge base instantly</li>
                  <li>Get step-by-step guidance for common issues</li>
                  <li>Search for relevant documentation</li>
                  <li>Escalate to a ticket if needed</li>
                </ul>
                <p className="mt-2">
                  It uses AI to understand your questions and provide accurate, helpful responses based on our knowledge base.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ai-vs-ticket">
            <AccordionTrigger>Should I use AI Chat or create a ticket?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Use AI Chat when:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>You have a quick question</li>
                  <li>Looking for how-to guides</li>
                  <li>Need immediate help (24/7 availability)</li>
                  <li>Want to search the knowledge base</li>
                </ul>
                <p className="mt-2"><strong>Create a ticket when:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Issue requires staff intervention</li>
                  <li>Need to track resolution progress</li>
                  <li>Problem affects multiple users</li>
                  <li>AI couldn't resolve your issue</li>
                </ul>
                <p className="mt-2">
                  <strong>Tip:</strong> Start with AI Chat - you can always escalate to a ticket if needed!
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ai-privacy">
            <AccordionTrigger>Is my conversation with AI Chat private?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Yes, your conversations are private and secure:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Only you can see your chat history</li>
                  <li>Conversations are encrypted</li>
                  <li>Used only to improve support quality</li>
                  <li>Never shared with third parties</li>
                </ul>
                <p className="mt-2">
                  However, if you escalate a chat to a ticket, staff will be able to see the conversation for context.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Knowledge Base FAQs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Knowledge Base</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is-kb">
            <AccordionTrigger>What is the Knowledge Base?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  The Knowledge Base is a collection of detailed articles, guides, and documentation covering:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Common IT issues and solutions</li>
                  <li>Software tutorials and how-tos</li>
                  <li>Campus technology guides</li>
                  <li>Policy and procedure documents</li>
                  <li>Best practices</li>
                </ul>
                <p className="mt-2">
                  Articles are written by IT staff and are regularly updated to ensure accuracy.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="search-kb">
            <AccordionTrigger>How do I search the Knowledge Base?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>There are several ways to find articles:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li><strong>Search Bar:</strong> Type keywords in the search box</li>
                  <li><strong>Categories:</strong> Browse by category (Hardware, Software, Account Access, etc.)</li>
                  <li><strong>Tags:</strong> Click on article tags to find related content</li>
                  <li><strong>AI Chat:</strong> Ask questions and get article recommendations</li>
                </ol>
                <p className="mt-2">
                  The search uses AI to understand your intent and find the most relevant articles.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="contribute-kb">
            <AccordionTrigger>Can I contribute to the Knowledge Base?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Staff members can create and edit knowledge base articles. If you're an employee and would like to contribute:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to the Knowledge Base</li>
                  <li>Click "Create Article" (if you have permissions)</li>
                  <li>Write your article using the rich text editor</li>
                  <li>Submit for review</li>
                </ol>
                <p className="mt-2">
                  Students and other users can suggest article topics by creating a ticket or using the feedback feature.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Account & Access FAQs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Account & Access</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cant-login">
            <AccordionTrigger>I can't log in. What should I do?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>If you're having trouble logging in:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Verify you're using your La Verdad email (@laverdad.edu.ph or @student.laverdad.edu.ph)</li>
                  <li>Try clearing your browser cache and cookies</li>
                  <li>Try a different browser or incognito mode</li>
                  <li>Check if your Google account is working (try logging into Gmail)</li>
                </ol>
                <p className="mt-2">
                  If the issue persists, contact IT support at helpdesk@laverdad.edu.ph or call the IT office.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="update-profile">
            <AccordionTrigger>How do I update my profile information?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Click on your avatar in the top-right corner</li>
                  <li>Select "Profile"</li>
                  <li>Update your information (name, department, phone, etc.)</li>
                  <li>Click "Save Changes"</li>
                </ol>
                <p className="mt-2">
                  Note: Your email address cannot be changed as it's linked to your Google account.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notifications">
            <AccordionTrigger>How do I manage my notification preferences?</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-muted-foreground">
                <p>You receive notifications for:</p>
                <ul className="list-disc list-inside ml-4">
                  <li>Tickets assigned to you</li>
                  <li>New comments on your tickets</li>
                  <li>Status changes</li>
                  <li>System alerts</li>
                </ul>
                <p className="mt-2">
                  To manage notifications:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Click the bell icon in the navigation bar</li>
                  <li>View your notifications</li>
                  <li>Mark as read or archive old notifications</li>
                </ol>
                <p className="mt-2">
                  Email notifications are sent automatically for important updates.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Still Have Questions? */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Still Have Questions?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? Get in touch with us!
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
              Create Support Ticket
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

