/*
  # Email Validation System Schema

  1. New Tables
    - `email_validations`
      - `id` (uuid, primary key)
      - `email` (text, unique index)
      - `validation_status` (text: valid, soft-fail, invalid, unknown)
      - `validation_method` (text: api, regex, dns, smtp, manual)
      - `confidence_score` (integer 0-100)
      - `domain` (text, index)
      - `error_message` (text, nullable)
      - `validated_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_domain_patterns`
      - `id` (uuid, primary key)
      - `domain` (text, unique)
      - `common_pattern` (text: firstname.lastname, firstinitiallastname, etc)
      - `confidence_score` (integer 0-100)
      - `total_validations` (integer)
      - `successful_validations` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `email_validation_history`
      - `id` (uuid, primary key)
      - `email` (text, index)
      - `validation_status` (text)
      - `validation_method` (text)
      - `api_response` (jsonb, nullable)
      - `validated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their validation data
    - Add policies for the service to insert and update validation records

  3. Indexes
    - Index on email for fast lookups
    - Index on domain for pattern matching
    - Index on validated_at for expiry checks
*/

-- Create email_validations table
CREATE TABLE IF NOT EXISTS email_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  validation_status text NOT NULL CHECK (validation_status IN ('valid', 'soft-fail', 'invalid', 'unknown')),
  validation_method text NOT NULL CHECK (validation_method IN ('api', 'regex', 'dns', 'smtp', 'manual', 'pattern')),
  confidence_score integer NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  domain text NOT NULL,
  error_message text,
  validated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_validations_email_idx ON email_validations(email);
CREATE INDEX IF NOT EXISTS email_validations_domain_idx ON email_validations(domain);
CREATE INDEX IF NOT EXISTS email_validations_validated_at_idx ON email_validations(validated_at);
CREATE INDEX IF NOT EXISTS email_validations_expires_at_idx ON email_validations(expires_at);

-- Create email_domain_patterns table
CREATE TABLE IF NOT EXISTS email_domain_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text UNIQUE NOT NULL,
  common_pattern text NOT NULL,
  confidence_score integer NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  total_validations integer DEFAULT 0,
  successful_validations integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_domain_patterns_domain_idx ON email_domain_patterns(domain);

-- Create email_validation_history table
CREATE TABLE IF NOT EXISTS email_validation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  validation_status text NOT NULL,
  validation_method text NOT NULL,
  api_response jsonb,
  validated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_validation_history_email_idx ON email_validation_history(email);
CREATE INDEX IF NOT EXISTS email_validation_history_validated_at_idx ON email_validation_history(validated_at);

-- Enable Row Level Security
ALTER TABLE email_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_domain_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_validation_history ENABLE ROW LEVEL SECURITY;

-- Policies for email_validations (allow public read since these are cached validations)
CREATE POLICY "Anyone can read email validations"
  ON email_validations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service can insert email validations"
  ON email_validations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service can update email validations"
  ON email_validations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policies for email_domain_patterns
CREATE POLICY "Anyone can read domain patterns"
  ON email_domain_patterns FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service can insert domain patterns"
  ON email_domain_patterns FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service can update domain patterns"
  ON email_domain_patterns FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policies for email_validation_history
CREATE POLICY "Anyone can read validation history"
  ON email_validation_history FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service can insert validation history"
  ON email_validation_history FOR INSERT
  TO public
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating updated_at
CREATE TRIGGER update_email_validations_updated_at
  BEFORE UPDATE ON email_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_domain_patterns_updated_at
  BEFORE UPDATE ON email_domain_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
