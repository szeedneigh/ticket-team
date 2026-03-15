# Security & User Preferences

**Last Updated**: December 21, 2025  
**Module**: Security & Preferences Management  
**Status**: ✅ Production Ready

---

## Overview

The Security & Preferences system provides comprehensive user account security management and personalized application settings. This module enables users to manage their sessions, password, notification preferences, appearance settings, and more.

---

## 1. Security Management

### 1.1 Password Management

**Feature**: Secure password change functionality with validation

**Location**: `src/app/actions/security.ts`

**Capabilities**:
- Change password with current password verification
- Password strength validation (minimum 8 characters)
- Password confirmation matching
- Secure password hashing via Supabase Auth
- Error handling for invalid credentials

**Usage**:
```typescript
import { changePassword } from '@/app/actions/security'

const formData = new FormData()
formData.append('currentPassword', 'current123')
formData.append('newPassword', 'newSecure456')
formData.append('confirmPassword', 'newSecure456')

const result = await changePassword(formData)
if (result.success) {
  // Password changed successfully
}
```

**Validation Rules**:
- Current password must be correct
- New password minimum 8 characters
- New password must match confirmation
- Cannot reuse current password

---

### 1.2 Session Management

**Feature**: Multi-session tracking and management

**Database Table**: `user_sessions`

**Schema**:
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Capabilities**:
- View all active sessions
- Track device information (browser, OS, device type)
- Monitor IP addresses and locations
- Track last activity timestamp
- Revoke individual sessions
- Revoke all sessions (except current)
- Automatic session expiration

**Server Actions**:
```typescript
// Get all active sessions
const sessions = await getActiveSessions()

// Revoke a specific session
await revokeSession(sessionId)

// Revoke all other sessions
await revokeAllSessions()
```

**Session Information Tracked**:
- Device type (Desktop, Mobile, Tablet)
- Browser (Chrome, Firefox, Safari, Edge)
- Operating System (Windows, macOS, Linux, iOS, Android)
- IP Address
- Location (derived from IP)
- Last activity timestamp
- Session creation time
- Expiration time

---

### 1.3 Login History

**Feature**: Complete audit trail of login attempts

**Database Table**: `login_history`

**Schema**:
```sql
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_info TEXT,
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT
);
```

**Capabilities**:
- Track successful logins
- Track failed login attempts
- Record device and location information
- Monitor suspicious activity
- Export login history

**Usage**:
```typescript
import { getLoginHistory } from '@/app/actions/security'

// Get last 20 login records
const history = await getLoginHistory(20)
```

**Information Tracked**:
- Login timestamp
- Success/failure status
- IP address and location
- Device and browser information
- Failure reasons (if applicable)

---

## 2. Notification Preferences

### 2.1 Notification Channels

**Feature**: Granular control over notification delivery

**Database Table**: `notification_preferences`

**Channels**:
1. **Email Notifications** - Delivered to user's email
2. **In-App Notifications** - Shown in notification center

**Master Toggles**:
- `email_enabled` - Enable/disable all email notifications
- `in_app_enabled` - Enable/disable all in-app notifications

---

### 2.2 Ticket Notifications

**Configurable Events**:

| Event | Email Setting | In-App Setting |
|-------|---------------|----------------|
| Ticket Assigned | `ticket_assigned_email` | `ticket_assigned_app` |
| New Comment | `ticket_comment_email` | `ticket_comment_app` |
| Status Changed | `ticket_status_changed_email` | `ticket_status_changed_app` |
| Priority Changed | `ticket_priority_changed_email` | `ticket_priority_changed_app` |
| Mentioned | `mention_email` | `mention_app` |

**Usage**:
```typescript
import { 
  getNotificationPreferences, 
  updateNotificationPreferences 
} from '@/app/actions/preferences'

// Get current preferences
const prefs = await getNotificationPreferences()

// Update preferences
await updateNotificationPreferences({
  email_enabled: true,
  ticket_assigned_email: true,
  ticket_comment_email: false,
  // ... other settings
})
```

---

### 2.3 Knowledge Base Notifications

**Configurable Events**:

| Event | Email Setting | In-App Setting |
|-------|---------------|----------------|
| Article Published | `kb_article_published_email` | `kb_article_published_app` |
| Article Updated | `kb_article_updated_email` | `kb_article_updated_app` |

---

### 2.4 Digest Settings

**Feature**: Batch notifications instead of real-time

**Options**:
- `realtime` - Immediate notifications (default)
- `hourly` - Batch notifications every hour
- `daily` - Daily digest at preferred time
- `weekly` - Weekly summary

**Configuration**:
```typescript
await updateNotificationPreferences({
  digest_frequency: 'daily',
  digest_time: '09:00', // 9 AM daily digest
})
```

---

### 2.5 Quiet Hours

**Feature**: Suppress notifications during specified hours

**Settings**:
- `quiet_hours_enabled` - Enable/disable quiet hours
- `quiet_hours_start` - Start time (e.g., "22:00")
- `quiet_hours_end` - End time (e.g., "08:00")

**Behavior**:
- Notifications are queued during quiet hours
- Delivered when quiet hours end
- Does not affect critical notifications (optional override)

---

## 3. User Preferences

### 3.1 Appearance Settings

**Database Table**: `user_preferences`

**Theme Settings**:
- `theme` - Options: `light`, `dark`, `system`
- `font_size` - Options: `small`, `medium`, `large`
- `compact_mode` - Boolean: Enable compact UI layout
- `sidebar_collapsed` - Boolean: Default sidebar state

**Usage**:
```typescript
import { 
  getUserPreferences, 
  updateUserPreferences 
} from '@/app/actions/preferences'

await updateUserPreferences({
  theme: 'dark',
  font_size: 'medium',
  compact_mode: false,
  sidebar_collapsed: false,
})
```

---

### 3.2 Localization Settings

**Timezone**:
- `timezone` - IANA timezone (e.g., "Asia/Manila")
- Auto-detect from browser
- Manual selection from list

**Date & Time Format**:
- `date_format` - Options: `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`
- `time_format` - Options: `12h`, `24h`

**Language**:
- `language` - Options: `en` (English), `fil` (Filipino)
- Future: Additional language support

**Auto-Detection**:
```typescript
import { autoDetectTimezone } from '@/app/actions/preferences'

// Automatically detect user's timezone
const result = await autoDetectTimezone()
console.log(result.data.timezone) // "Asia/Manila"
```

---

### 3.3 Dashboard Customization

**Widget Settings**:
- `dashboard_widgets` - Array of enabled widgets
- `widget_order` - Custom widget arrangement

**Available Widgets**:
- Recent Tickets
- Quick Stats
- Activity Feed
- Assigned Tickets
- Knowledge Base Articles
- AI Chat Sessions

**Default Layout**:
- `default_view` - Options: `grid`, `list`, `compact`
- `items_per_page` - Number: 10, 20, 50, 100

---

## 4. Integration with Application

### 4.1 Middleware Integration

**Automatic Preference Loading**:
```typescript
// Preferences are loaded in middleware
// Available in all server components
import { getUserPreferences } from '@/app/actions/preferences'

export default async function Page() {
  const prefs = await getUserPreferences()
  // Use preferences to customize UI
}
```

---

### 4.2 Client-Side Hooks

**React Hooks**:
```typescript
'use client'
import { usePreferences } from '@/lib/hooks/use-preferences'

export function MyComponent() {
  const { preferences, updatePreferences, loading } = usePreferences()
  
  return (
    <div className={preferences.theme}>
      {/* Component content */}
    </div>
  )
}
```

---

### 4.3 Notification Delivery

**Respects User Preferences**:
```typescript
// Notification system checks preferences before sending
import { sendNotification } from '@/lib/notifications'

await sendNotification({
  userId: user.id,
  type: 'ticket_assigned',
  // System automatically checks:
  // - Is email_enabled?
  // - Is ticket_assigned_email enabled?
  // - Are we in quiet hours?
  // - What's the digest frequency?
})
```

---

## 5. Database Schema

### 5.1 Complete Schema

```sql
-- Notification Preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Master toggles
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Ticket notifications
  ticket_assigned_email BOOLEAN NOT NULL DEFAULT true,
  ticket_assigned_app BOOLEAN NOT NULL DEFAULT true,
  ticket_comment_email BOOLEAN NOT NULL DEFAULT true,
  ticket_comment_app BOOLEAN NOT NULL DEFAULT true,
  ticket_status_changed_email BOOLEAN NOT NULL DEFAULT true,
  ticket_status_changed_app BOOLEAN NOT NULL DEFAULT true,
  ticket_priority_changed_email BOOLEAN NOT NULL DEFAULT false,
  ticket_priority_changed_app BOOLEAN NOT NULL DEFAULT true,
  mention_email BOOLEAN NOT NULL DEFAULT true,
  mention_app BOOLEAN NOT NULL DEFAULT true,
  
  -- KB notifications
  kb_article_published_email BOOLEAN NOT NULL DEFAULT false,
  kb_article_published_app BOOLEAN NOT NULL DEFAULT true,
  kb_article_updated_email BOOLEAN NOT NULL DEFAULT false,
  kb_article_updated_app BOOLEAN NOT NULL DEFAULT false,
  
  -- Digest settings
  digest_frequency TEXT NOT NULL DEFAULT 'realtime',
  digest_time TIME,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Appearance
  theme TEXT NOT NULL DEFAULT 'system',
  font_size TEXT NOT NULL DEFAULT 'medium',
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT false,
  
  -- Localization
  timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  time_format TEXT NOT NULL DEFAULT '12h',
  language TEXT NOT NULL DEFAULT 'en',
  
  -- Dashboard
  dashboard_widgets JSONB DEFAULT '[]'::jsonb,
  widget_order JSONB DEFAULT '[]'::jsonb,
  default_view TEXT NOT NULL DEFAULT 'grid',
  items_per_page INTEGER NOT NULL DEFAULT 20,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Login History
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_info TEXT,
  location TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT
);
```

---

## 6. Security Considerations

### 6.1 Password Security
- ✅ Passwords hashed using Supabase Auth (bcrypt)
- ✅ Minimum password length enforced
- ✅ Current password verification required
- ✅ No password reuse checking (optional enhancement)

### 6.2 Session Security
- ✅ Secure session tokens
- ✅ Session expiration (configurable)
- ✅ IP address tracking
- ✅ Device fingerprinting
- ✅ Automatic session cleanup

### 6.3 Data Privacy
- ✅ User preferences are private (RLS enforced)
- ✅ Login history only accessible by user
- ✅ Session data encrypted in transit
- ✅ No sensitive data in logs

---

## 7. API Reference

### Security Actions

```typescript
// Change password
changePassword(formData: FormData): Promise<ActionResult>

// Get active sessions
getActiveSessions(): Promise<ActionResult<ActiveSession[]>>

// Revoke session
revokeSession(sessionId: string): Promise<ActionResult>

// Revoke all sessions
revokeAllSessions(): Promise<ActionResult>

// Get login history
getLoginHistory(limit?: number): Promise<ActionResult<LoginHistoryRecord[]>>
```

### Preference Actions

```typescript
// Notification preferences
getNotificationPreferences(): Promise<ActionResult<NotificationPreferences>>
updateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<ActionResult>

// User preferences
getUserPreferences(): Promise<ActionResult<UserPreferences>>
updateUserPreferences(prefs: Partial<UserPreferences>): Promise<ActionResult>

// Auto-detect timezone
autoDetectTimezone(): Promise<ActionResult<{ timezone: string }>>
```

---

## 8. Future Enhancements

### Planned Features
- [ ] Two-factor authentication (2FA)
- [ ] Biometric authentication
- [ ] Security questions
- [ ] Password strength meter
- [ ] Password history (prevent reuse)
- [ ] Suspicious activity alerts
- [ ] Advanced widget customization
- [ ] Custom dashboard layouts
- [ ] More language options
- [ ] Accessibility preferences

---

## 9. Related Documentation

- [User Management](./user-management.md)
- [Notifications System](./notifications.md)
- [Security Best Practices](../06-development/security.md)
- [Database Schema](../02-architecture/database-schema.md)

---

**Last Updated**: December 21, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

