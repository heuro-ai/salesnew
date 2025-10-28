/*
  # Add User Data Persistence Tables

  1. New Tables
    - `user_searches`
      - Stores user input parameters for each lead generation search
      - Links to authenticated users
      - Tracks when searches were performed
    
    - `companies`
      - Stores discovered companies from searches
      - Links to user_searches
      - Contains all company details including contacts and pitches
    
    - `crm_leads`
      - Stores leads that users add to their CRM
      - Links to authenticated users and companies
      - Tracks lead status, contact history, and engagement

    - `role_play_sessions`
      - Stores role-play practice session transcripts and feedback
      - Links to authenticated users and crm_leads
      - Preserves conversation history for review

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Policies for SELECT, INSERT, UPDATE, DELETE operations

  3. Important Notes
    - All timestamps use timestamptz for consistency
    - JSONB used for flexible pitch and contact storage
    - Foreign key constraints ensure data integrity
    - Indexes added for common query patterns
*/

-- User Searches Table
CREATE TABLE IF NOT EXISTS user_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text DEFAULT '',
  product_description text DEFAULT '',
  target_audience text DEFAULT '',
  company_size text DEFAULT '',
  industry text DEFAULT '',
  geography text DEFAULT '',
  price_range text DEFAULT '',
  value_proposition text DEFAULT '',
  competitive_edge text DEFAULT '',
  keywords text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own searches"
  ON user_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own searches"
  ON user_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches"
  ON user_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches"
  ON user_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_searches_user_id ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_created_at ON user_searches(created_at DESC);

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES user_searches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  website text NOT NULL,
  industry text NOT NULL,
  reason_for_fit text NOT NULL,
  confidence_score integer NOT NULL DEFAULT 0,
  likely_to_buy text NOT NULL DEFAULT 'unknown',
  contact_data jsonb NOT NULL DEFAULT '{}',
  pitch_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_search_id ON companies(search_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- CRM Leads Table
CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  website text NOT NULL,
  industry text NOT NULL,
  reason_for_fit text NOT NULL,
  confidence_score integer NOT NULL DEFAULT 0,
  likely_to_buy text NOT NULL DEFAULT 'unknown',
  contact_data jsonb NOT NULL DEFAULT '{}',
  pitch_data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'New',
  last_contacted timestamptz,
  email_sent boolean NOT NULL DEFAULT false,
  reply_received boolean NOT NULL DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads"
  ON crm_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own leads"
  ON crm_leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
  ON crm_leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
  ON crm_leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_user_id ON crm_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_updated_at ON crm_leads(updated_at DESC);

-- Role Play Sessions Table
CREATE TABLE IF NOT EXISTS role_play_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  transcript jsonb NOT NULL DEFAULT '[]',
  feedback text,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE role_play_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON role_play_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON role_play_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON role_play_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON role_play_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_role_play_sessions_user_id ON role_play_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_play_sessions_lead_id ON role_play_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_role_play_sessions_created_at ON role_play_sessions(created_at DESC);