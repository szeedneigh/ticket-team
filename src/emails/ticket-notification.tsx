/**
 * Ticket Notification Email Template
 *
 * Used for sending ticket updates to users
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface TicketNotificationEmailProps {
  recipientName: string
  ticketId: string
  ticketTitle: string
  action: 'created' | 'updated' | 'assigned' | 'commented' | 'resolved' | 'closed'
  actionBy: string
  message?: string
  ticketUrl: string
}

export default function TicketNotificationEmail({
  recipientName = 'User',
  ticketId = 'TICKET-001',
  ticketTitle = 'Sample Ticket',
  action = 'updated',
  actionBy = 'Staff Member',
  message,
  ticketUrl = 'https://ticketteam.com/tickets/123',
}: TicketNotificationEmailProps) {
  const actionText = {
    created: 'created',
    updated: 'updated',
    assigned: 'assigned to you',
    commented: 'commented on',
    resolved: 'resolved',
    closed: 'closed',
  }

  const previewText = `${actionBy} ${actionText[action]} ticket ${ticketId}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading as="h1" style={heading}>Ticket Team</Heading>
            <Text style={subheading}>La Verdad Christian College</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              <strong>{actionBy}</strong> {actionText[action]} your ticket:
            </Text>

            <Section style={ticketBox}>
              <Text style={ticketIdStyle}>#{ticketId}</Text>
              <Text style={ticketTitleStyle}>{ticketTitle}</Text>
            </Section>

            {message && (
              <Section style={messageBox}>
                <Text style={messageLabel}>Message:</Text>
                <Text style={messageText}>{message}</Text>
              </Section>
            )}

            <Button style={button} href={ticketUrl}>
              View Ticket
            </Button>

            <Hr style={hr} />

            <Text style={footer}>
              You received this email because you are involved with this ticket.
              To manage your email preferences, visit your profile settings.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              © 2025 Ticket Team - La Verdad Christian College
            </Text>
            <Text style={footerText}>
              IT Support Helpdesk System
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 40px',
  backgroundColor: '#2563eb',
}

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0 0 8px',
}

const subheading = {
  fontSize: '14px',
  color: '#dbeafe',
  margin: '0',
}

const content = {
  padding: '0 40px',
}

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  marginTop: '32px',
  marginBottom: '16px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '16px',
}

const ticketBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
}

const ticketIdStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#2563eb',
  margin: '0 0 8px',
}

const ticketTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0',
}

const messageBox = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  padding: '16px',
  marginBottom: '24px',
  borderRadius: '4px',
}

const messageLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 8px',
}

const messageText = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  marginBottom: '24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '20px',
}

const footerSection = {
  padding: '0 40px',
  marginTop: '32px',
}

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '4px 0',
}
