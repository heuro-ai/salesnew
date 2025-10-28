/*
  # Add Foreign Key Indexes

  This migration adds covering indexes for foreign keys to improve query performance.

  1. Performance Improvements
    - Add index on `payments.user_id` for foreign key `payments_user_id_fkey`
    - Add index on `payments.subscription_id` for foreign key `payments_subscription_id_fkey`
    - Add index on `subscriptions.user_id` for foreign key `subscriptions_user_id_fkey`
    
  2. Benefits
    - Improves JOIN performance when querying related tables
    - Optimizes queries filtering by user_id or subscription_id
    - Speeds up foreign key constraint checks during INSERT/UPDATE/DELETE operations
    
  3. Important Notes
    - These indexes were previously marked as unused but are actually needed for optimal performance
    - Foreign keys should always have covering indexes to prevent table scans
    - The indexes improve query performance for common access patterns
*/

-- Add index for payments.user_id foreign key
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);

-- Add index for payments.subscription_id foreign key
CREATE INDEX IF NOT EXISTS payments_subscription_id_idx ON payments(subscription_id);

-- Add index for subscriptions.user_id foreign key
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
