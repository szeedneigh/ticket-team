-- User Sessions Tracking Table
-- Tracks all active user authentication sessions for security monitoring

CREATE TABLE user_sessions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session info
  session_id TEXT NOT NULL, -- Supabase auth session ID
  refresh_token_id TEXT, -- For revocation

  -- Device & Browser info
  device_type TEXT NOT NULL, -- 'desktop' | 'mobile' | 'tablet'
  browser TEXT,
  os TEXT,
  device_name TEXT,
  user_agent TEXT,

  -- Location info
  ip_address INET,
  country TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Session lifecycle
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Security flags
  is_suspicious BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revoke_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON user_sessions_log(user_id);
CREATE INDEX idx_sessions_active ON user_sessions_log(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_session_id ON user_sessions_log(session_id);
CREATE INDEX idx_sessions_last_activity ON user_sessions_log(last_activity_at DESC);

-- Enable RLS
ALTER TABLE user_sessions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions"
  ON user_sessions_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert sessions"
  ON user_sessions_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON user_sessions_log FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update timestamp
CREATE TRIGGER update_user_sessions_log_updated_at
  BEFORE UPDATE ON user_sessions_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_sessions_log IS 'Tracks all user authentication sessions for security monitoring';
