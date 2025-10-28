/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing foreign key index on crm_leads.company_id
    - Optimize all RLS policies to use (select auth.uid()) instead of auth.uid()
      This prevents re-evaluation of auth.uid() for each row, significantly improving query performance

  2. Changes Made
    - Drop and recreate all RLS policies with optimized auth function calls
    - Add index on crm_leads.company_id foreign key
    
  3. Security Notes
    - All policies maintain the same security restrictions
    - Only performance optimization applied
    - No changes to data access rules
*/

-- Add missing foreign key index for performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_company_id ON crm_leads(company_id);

-- Drop and recreate user_searches policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view own searches" ON user_searches;
DROP POLICY IF EXISTS "Users can create own searches" ON user_searches;
DROP POLICY IF EXISTS "Users can update own searches" ON user_searches;
DROP POLICY IF EXISTS "Users can delete own searches" ON user_searches;

CREATE POLICY "Users can view own searches"
  ON user_searches FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own searches"
  ON user_searches FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own searches"
  ON user_searches FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own searches"
  ON user_searches FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate companies policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can create own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete own companies" ON companies;

CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate crm_leads policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view own leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can create own leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can update own leads" ON crm_leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON crm_leads;

CREATE POLICY "Users can view own leads"
  ON crm_leads FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own leads"
  ON crm_leads FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own leads"
  ON crm_leads FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own leads"
  ON crm_leads FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate role_play_sessions policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view own sessions" ON role_play_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON role_play_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON role_play_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON role_play_sessions;

CREATE POLICY "Users can view own sessions"
  ON role_play_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own sessions"
  ON role_play_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own sessions"
  ON role_play_sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own sessions"
  ON role_play_sessions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);