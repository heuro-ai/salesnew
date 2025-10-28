/*
  # Enhanced Search and Lead Discovery Features

  ## Overview
  This migration adds comprehensive search enhancement capabilities including:
  - Lead quality scoring system
  - Search templates for reusable searches
  - Lead tagging and categorization
  - Search analytics and performance tracking
  - Company deduplication tracking
  - Alternative contacts per company

  ## New Tables
  
  ### `search_templates`
  - Stores reusable search criteria templates
  - Allows users to save and reload successful search patterns
  - Fields: template_name, search_criteria (jsonb), is_favorite, usage_count
  
  ### `lead_tags`
  - Custom tags users can create and assign to leads
  - Fields: tag_name, color, description
  
  ### `lead_tag_assignments`
  - Junction table linking leads to tags
  - Many-to-many relationship between leads and tags
  
  ### `lead_quality_scores`
  - Computed quality scores for each lead
  - Combines confidence, email validation, and buying likelihood
  - Fields: overall_score, confidence_weight, validation_weight, buying_likelihood_weight
  
  ### `company_contacts`
  - Multiple contacts per company (alternative decision-makers)
  - Extends beyond the primary contact in companies/crm_leads
  - Fields: contact_name, title, email, phone, is_primary
  
  ### `search_analytics`
  - Tracks search performance metrics
  - Records: leads_generated, valid_emails_count, conversion_metrics
  - Enables data-driven search optimization
  
  ### `excluded_companies`
  - Companies to exclude from future searches
  - User-maintained blocklist of competitors or irrelevant companies
  
  ## Modifications
  
  ### Enhanced `companies` table
  - Add quality_score column (computed)
  - Add is_duplicate flag
  - Add tags array for quick filtering
  
  ### Enhanced `crm_leads` table
  - Add quality_score column
  - Add tags array
  - Add source_search_id for traceability
  
  ## Security
  - All tables have RLS enabled
  - Policies ensure users can only access their own data
  - Foreign key constraints maintain data integrity
  
  ## Performance
  - Indexes on frequently queried columns
  - GIN indexes for JSONB and array columns
  - Optimized for fast filtering and aggregation
*/

-- Create search_templates table
CREATE TABLE IF NOT EXISTS search_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  search_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_favorite boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lead_tags table
CREATE TABLE IF NOT EXISTS lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  color text DEFAULT '#3B82F6',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tag_name)
);

-- Create lead_tag_assignments table (junction table)
CREATE TABLE IF NOT EXISTS lead_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Create lead_quality_scores table
CREATE TABLE IF NOT EXISTS lead_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score integer NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  confidence_score integer DEFAULT 0,
  validation_score integer DEFAULT 0,
  buying_likelihood_score integer DEFAULT 0,
  custom_adjustments integer DEFAULT 0,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(lead_id)
);

-- Create company_contacts table (alternative contacts)
CREATE TABLE IF NOT EXISTS company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  crm_lead_id uuid REFERENCES crm_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  title text NOT NULL,
  department text DEFAULT '',
  email text NOT NULL,
  phone text DEFAULT '',
  linkedin_url text DEFAULT '',
  is_primary boolean DEFAULT false,
  email_validation_status text DEFAULT 'unknown' CHECK (email_validation_status IN ('valid', 'soft-fail', 'invalid', 'unknown')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create search_analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_id uuid REFERENCES user_searches(id) ON DELETE CASCADE,
  leads_generated integer DEFAULT 0,
  valid_emails_count integer DEFAULT 0,
  invalid_emails_count integer DEFAULT 0,
  high_likelihood_count integer DEFAULT 0,
  medium_likelihood_count integer DEFAULT 0,
  low_likelihood_count integer DEFAULT 0,
  average_confidence_score integer DEFAULT 0,
  leads_added_to_crm integer DEFAULT 0,
  leads_contacted integer DEFAULT 0,
  leads_converted integer DEFAULT 0,
  search_duration_seconds integer DEFAULT 0,
  industries_found text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now()
);

-- Create excluded_companies table
CREATE TABLE IF NOT EXISTS excluded_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  website text DEFAULT '',
  reason text DEFAULT '',
  excluded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_name)
);

-- Add new columns to existing tables
DO $$
BEGIN
  -- Add quality_score to companies table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'quality_score'
  ) THEN
    ALTER TABLE companies ADD COLUMN quality_score integer DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100);
  END IF;
  
  -- Add is_duplicate to companies table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'is_duplicate'
  ) THEN
    ALTER TABLE companies ADD COLUMN is_duplicate boolean DEFAULT false;
  END IF;
  
  -- Add tags to companies table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'tags'
  ) THEN
    ALTER TABLE companies ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;
  
  -- Add quality_score to crm_leads table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'quality_score'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN quality_score integer DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100);
  END IF;
  
  -- Add tags to crm_leads table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'tags'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN tags text[] DEFAULT ARRAY[]::text[];
  END IF;
  
  -- Add source_search_id to crm_leads table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_leads' AND column_name = 'source_search_id'
  ) THEN
    ALTER TABLE crm_leads ADD COLUMN source_search_id uuid REFERENCES user_searches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_templates_user_id ON search_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_search_templates_favorite ON search_templates(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_lead_tags_user_id ON lead_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead_id ON lead_tag_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag_id ON lead_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_lead_quality_scores_lead_id ON lead_quality_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quality_scores_overall_score ON lead_quality_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_crm_lead_id ON company_contacts(crm_lead_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_email ON company_contacts(email);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_search_id ON search_analytics(search_id);
CREATE INDEX IF NOT EXISTS idx_excluded_companies_user_id ON excluded_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_quality_score ON companies(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_duplicate ON companies(user_id, is_duplicate);
CREATE INDEX IF NOT EXISTS idx_crm_leads_quality_score ON crm_leads(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source_search ON crm_leads(source_search_id);

-- Create GIN indexes for array and JSONB columns
CREATE INDEX IF NOT EXISTS idx_companies_tags_gin ON companies USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_crm_leads_tags_gin ON crm_leads USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_search_templates_criteria_gin ON search_templates USING gin(search_criteria);
CREATE INDEX IF NOT EXISTS idx_search_analytics_industries_gin ON search_analytics USING gin(industries_found);

-- Enable Row Level Security
ALTER TABLE search_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE excluded_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_templates
CREATE POLICY "Users can view own search templates"
  ON search_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search templates"
  ON search_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search templates"
  ON search_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search templates"
  ON search_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for lead_tags
CREATE POLICY "Users can view own tags"
  ON lead_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON lead_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON lead_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON lead_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for lead_tag_assignments
CREATE POLICY "Users can view own tag assignments"
  ON lead_tag_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tag assignments"
  ON lead_tag_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tag assignments"
  ON lead_tag_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for lead_quality_scores
CREATE POLICY "Users can view own quality scores"
  ON lead_quality_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quality scores"
  ON lead_quality_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quality scores"
  ON lead_quality_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quality scores"
  ON lead_quality_scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for company_contacts
CREATE POLICY "Users can view own company contacts"
  ON company_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company contacts"
  ON company_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company contacts"
  ON company_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company contacts"
  ON company_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for search_analytics
CREATE POLICY "Users can view own search analytics"
  ON search_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search analytics"
  ON search_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search analytics"
  ON search_analytics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for excluded_companies
CREATE POLICY "Users can view own excluded companies"
  ON excluded_companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own excluded companies"
  ON excluded_companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own excluded companies"
  ON excluded_companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
