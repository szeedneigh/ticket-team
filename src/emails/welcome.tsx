/**
 * Welcome Email Template
 *
 * Sent to new users when they first sign in
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

interface WelcomeEmailProps {
  userName: string
  userEmail: string
  role: string
  dashboardUrl: string
}

export default function WelcomeEmail({
  userName = 'User',
  userEmail = 'user@laverdad.edu.ph',
  role = 'employee',
  dashboardUrl = 'https://ticketteam.com/dashboard',
}: WelcomeEmailProps) {
  const roleDescriptions = {
    employee: 'You can submit tickets and browse the knowledge base.',
    staff: 'You can manage tickets and create knowledge base articles.',
    admin: 'You have full administrative access to the system.',
    super_admin: 'You have complete system access including analytics.',
  }

  return (
    <Html>
      <Head />
      <Preview>Welcome to Ticket Team - Your IT Support Portal</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading as="h1" style={heading}>Welcome to Ticket Team! 🎉</Heading>
            <Text style={subheading}>La Verdad Christian College IT Support</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {userName},</Text>

            <Text style={paragraph}>
              Welcome to <strong>Ticket Team</strong>, your one-stop IT support portal for
              La Verdad Christian College!
            </Text>

            <Text style={paragraph}>
              Your account has been created with the following details:
            </Text>

            <Section style={infoBox}>
              <Text style={infoLabel}>Email:</Text>
              <Text style={infoValue}>{userEmail}</Text>
              <Text style={infoLabel}>Role:</Text>
              <Text style={infoValue}>{role.replace('_', ' ')}</Text>
            </Section>

            <Text style={paragraph}>
              {roleDescriptions[role as keyof typeof roleDescriptions]}
            </Text>

            <Heading as="h2" style={sectionHeading}>
              What you can do:
            </Heading>

            <Section style={featureList}>
              {role === 'employee' && (
                <>
                  <Text style={featureItem}>📝 Submit and track support tickets</Text>
                  <Text style={featureItem}>💬 Chat with our AI assistant</Text>
                  <Text style={featureItem}>📚 Browse the knowledge base</Text>
                  <Text style={featureItem}>⭐ Provide feedback on resolved tickets</Text>
                </>
              )}
              {(role === 'staff' || role === 'admin' || role === 'super_admin') && (
                <>
                  <Text style={featureItem}>🎫 Manage and resolve tickets</Text>
                  <Text style={featureItem}>📝 Create knowledge base articles</Text>
                  <Text style={featureItem}>💬 Use AI-powered assistance</Text>
                  <Text style={featureItem}>📊 View analytics and reports</Text>
                </>
              )}
              {(role === 'admin' || role === 'super_admin') && (
                <>
                  <Text style={featureItem}>👥 Manage users and permissions</Text>
                  <Text style={featureItem}>⚙️ Configure system settings</Text>
                </>
              )}
            </Section>

            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>

            <Hr style={hr} />

            <Text style={helpText}>
              <strong>Need help getting started?</strong>
            </Text>
            <Text style={paragraph}>
              Check out our knowledge base for guides and tutorials, or chat with our AI
              assistant for instant help.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              © 2025 Ticket Team - La Verdad Christian College
            </Text>
            <Text style={footerText}>
              Questions? Contact IT Support
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
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0 0 8px',
}

const subheading = {
  fontSize: '16px',
  color: '#dbeafe',
  margin: '0',
}

const content = {
  padding: '0 40px',
}

const greeting = {
  fontSize: '18px',
  lineHeight: '24px',
  marginTop: '32px',
  marginBottom: '16px',
  fontWeight: '600',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  marginBottom: '16px',
}

const infoBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const infoLabel = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0 0 4px',
}

const infoValue = {
  fontSize: '16px',
  fontWeight: '500',
  color: '#111827',
  margin: '0 0 16px',
}

const sectionHeading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#111827',
  marginTop: '32px',
  marginBottom: '16px',
}

const featureList = {
  marginBottom: '24px',
}

const featureItem = {
  fontSize: '16px',
  lineHeight: '28px',
  color: '#374151',
  margin: '0 0 8px',
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
  padding: '14px 24px',
  marginBottom: '32px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const helpText = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '8px',
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
