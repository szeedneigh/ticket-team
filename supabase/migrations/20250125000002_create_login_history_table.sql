-- Login History Audit Table
-- Tracks all login attempts (success and failure) for security monitoring

CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Login attempt info
  email TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success' | 'failed' | 'blocked' | 'mfa_required'
  failure_reason TEXT, -- 'invalid_password' | 'account_locked' | 'email_not_verified'

  -- Device & Browser info
  device_type TEXT, -- 'desktop' | 'mobile' | 'tablet'
  browser TEXT,
  os TEXT,
  user_agent TEXT,

  -- Location info
  ip_address INET,
  country TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Session created (on success)
  session_id TEXT,

  -- Security flags
  is_suspicious BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0, -- 0-100, higher = riskier

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'blocked', 'mfa_required'))
);

-- Indexes for performance
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_timestamp ON login_history(timestamp DESC);
CREATE INDEX idx_login_history_email ON login_history(email);
CREATE INDEX idx_login_history_status ON login_history(status);
CREATE INDEX idx_login_history_ip ON login_history(ip_address);

-- Enable RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Service role can insert login records
CREATE POLICY "Service can insert login history"
  ON login_history FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

COMMENT ON TABLE login_history IS 'Audit log of all login attempts for security monitoring';
