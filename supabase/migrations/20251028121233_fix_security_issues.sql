/*
  # Fix Security Issues

  1. Remove Unused Indexes
    - Drop `email_validations_domain_idx` (not used in queries)
    - Drop `email_validations_validated_at_idx` (not used in queries)
    - Drop `email_validations_expires_at_idx` (not used in queries)
    - Drop `email_domain_patterns_domain_idx` (not used, table has unique constraint on domain)
    - Drop `email_validation_history_email_idx` (not used in queries)
    - Drop `email_validation_history_validated_at_idx` (not used in queries)

  2. Fix Function Security
    - Update `update_updated_at_column` function with immutable search_path to prevent search path attacks
    - Set search_path to empty string to ensure function only uses fully qualified names

  3. Notes
    - Keeping `email_validations_email_idx` as it's the primary lookup for email validation
    - Indexes can be re-added later if specific query patterns emerge that would benefit from them
    - The search_path fix ensures the function cannot be exploited through search path manipulation
*/

-- Drop unused indexes
DROP INDEX IF EXISTS email_validations_domain_idx;
DROP INDEX IF EXISTS email_validations_validated_at_idx;
DROP INDEX IF EXISTS email_validations_expires_at_idx;
DROP INDEX IF EXISTS email_domain_patterns_domain_idx;
DROP INDEX IF EXISTS email_validation_history_email_idx;
DROP INDEX IF EXISTS email_validation_history_validated_at_idx;

-- Fix function search_path vulnerability
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';
