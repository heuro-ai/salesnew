/*
  # Fix Security and Performance Issues

  ## Changes Made

  1. **Added Missing Foreign Key Indexes**
     - `company_contacts.user_id` - index for user-based queries
     - `lead_quality_scores.user_id` - index for user-based queries  
     - `lead_tag_assignments.user_id` - index for user-based queries

  2. **Optimized RLS Policies**
     - Updated all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
     - This prevents re-evaluation of auth functions for each row, significantly improving query performance at scale
     - Applied to all tables: search_templates, lead_tags, lead_tag_assignments, lead_quality_scores, company_contacts, search_analytics, excluded_companies

  ## Performance Impact
  - Foreign key indexes will improve JOIN performance and referential integrity checks
  - RLS optimization will reduce query execution time, especially for large datasets
  - Subqueries cache the auth.uid() result once per query instead of per row

  ## Security Notes
  - All security policies remain functionally identical
  - Data isolation and user access control is maintained
  - Performance improvements do not compromise security
*/

-- Add missing foreign key indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_company_contacts_user_id_fkey ON public.company_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_quality_scores_user_id_fkey ON public.lead_quality_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_user_id_fkey ON public.lead_tag_assignments(user_id);

-- Optimize RLS policies for search_templates table
DROP POLICY IF EXISTS "Users can view own search templates" ON public.search_templates;
DROP POLICY IF EXISTS "Users can insert own search templates" ON public.search_templates;
DROP POLICY IF EXISTS "Users can update own search templates" ON public.search_templates;
DROP POLICY IF EXISTS "Users can delete own search templates" ON public.search_templates;

CREATE POLICY "Users can view own search templates"
  ON public.search_templates FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own search templates"
  ON public.search_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own search templates"
  ON public.search_templates FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own search templates"
  ON public.search_templates FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize RLS policies for lead_tags table
DROP POLICY IF EXISTS "Users can view own tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Users can update own tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON public.lead_tags;

CREATE POLICY "Users can view own tags"
  ON public.lead_tags FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own tags"
  ON public.lead_tags FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own tags"
  ON public.lead_tags FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own tags"
  ON public.lead_tags FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize RLS policies for lead_tag_assignments table
DROP POLICY IF EXISTS "Users can view own tag assignments" ON public.lead_tag_assignments;
DROP POLICY IF EXISTS "Users can insert own tag assignments" ON public.lead_tag_assignments;
DROP POLICY IF EXISTS "Users can delete own tag assignments" ON public.lead_tag_assignments;

CREATE POLICY "Users can view own tag assignments"
  ON public.lead_tag_assignments FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own tag assignments"
  ON public.lead_tag_assignments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own tag assignments"
  ON public.lead_tag_assignments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize RLS policies for lead_quality_scores table
DROP POLICY IF EXISTS "Users can view own quality scores" ON public.lead_quality_scores;
DROP POLICY IF EXISTS "Users can insert own quality scores" ON public.lead_quality_scores;
DROP POLICY IF EXISTS "Users can update own quality scores" ON public.lead_quality_scores;
DROP POLICY IF EXISTS "Users can delete own quality scores" ON public.lead_quality_scores;

CREATE POLICY "Users can view own quality scores"
  ON public.lead_quality_scores FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own quality scores"
  ON public.lead_quality_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own quality scores"
  ON public.lead_quality_scores FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own quality scores"
  ON public.lead_quality_scores FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize RLS policies for company_contacts table
DROP POLICY IF EXISTS "Users can view own company contacts" ON public.company_contacts;
DROP POLICY IF EXISTS "Users can insert own company contacts" ON public.company_contacts;
DROP POLICY IF EXISTS "Users can update own company contacts" ON public.company_contacts;
DROP POLICY IF EXISTS "Users can delete own company contacts" ON public.company_contacts;

CREATE POLICY "Users can view own company contacts"
  ON public.company_contacts FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own company contacts"
  ON public.company_contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own company contacts"
  ON public.company_contacts FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own company contacts"
  ON public.company_contacts FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize RLS policies for search_analytics table
DROP POLICY IF EXISTS "Users can view own search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Users can insert own search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Users can update own search analytics" ON public.search_analytics;

CREATE POLICY "Users can view own search analytics"
  ON public.search_analytics FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own search analytics"
  ON public.search_analytics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own search analytics"
  ON public.search_analytics FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize RLS policies for excluded_companies table
DROP POLICY IF EXISTS "Users can view own excluded companies" ON public.excluded_companies;
DROP POLICY IF EXISTS "Users can insert own excluded companies" ON public.excluded_companies;
DROP POLICY IF EXISTS "Users can delete own excluded companies" ON public.excluded_companies;

CREATE POLICY "Users can view own excluded companies"
  ON public.excluded_companies FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own excluded companies"
  ON public.excluded_companies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own excluded companies"
  ON public.excluded_companies FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));