# Security Configuration Guide

## Leaked Password Protection

To enable leaked password protection in your Supabase project, follow these steps:

### Method 1: Supabase Dashboard (Recommended)

1. Navigate to your Supabase project dashboard at https://app.supabase.com
2. Select your project: `tbhdgckgamuwrkfpwgfr`
3. Go to **Authentication** → **Policies** (or **Settings**)
4. Look for **Security Settings** or **Password Protection**
5. Enable **"Check passwords against HaveIBeenPwned"** or **"Leaked Password Protection"**
6. Save your changes

### Method 2: Supabase CLI (Alternative)

If you have the Supabase CLI installed locally:

1. Navigate to your project directory
2. Run: `supabase link --project-ref tbhdgckgamuwrkfpwgfr`
3. Update your `supabase/config.toml` file with:
   ```toml
   [auth]
   enable_password_breach_check = true
   ```
4. Deploy the configuration: `supabase db push`

### What This Feature Does

When enabled, this feature:
- Checks user passwords against the HaveIBeenPwned.org database during signup
- Prevents users from using compromised passwords that have been exposed in data breaches
- Provides immediate feedback to users if their chosen password has been compromised
- Enhances overall account security for all users

### Error Handling

The application has been updated to handle leaked password errors with user-friendly messages:

- If a password is found in a data breach, users will see: "This password has been compromised in a data breach and cannot be used. Please choose a different, more secure password."
- Users are encouraged to create strong, unique passwords

### Testing

After enabling this feature:
1. Try to create an account with a common password like "password123"
2. The system should reject it with a breach warning
3. Create an account with a strong, unique password
4. The account should be created successfully

### Additional Security Recommendations

1. **Minimum Password Length**: Currently set to 6 characters (configurable in Supabase dashboard)
2. **Email Confirmation**: Consider enabling email confirmation for new signups
3. **Rate Limiting**: Enable rate limiting for authentication endpoints
4. **MFA**: Consider implementing Multi-Factor Authentication for sensitive operations

## Recent Security Fixes Applied

✅ **RLS Policy Performance Optimization** - Updated policies to use `(select auth.uid())` for better query performance
✅ **Foreign Key Indexes** - Added covering indexes for all foreign keys to optimize JOIN and constraint check performance
✅ **Function Search Path** - `update_updated_at_column` function already has secure search_path configuration

### Important Note About "Unused" Index Warnings

The following indexes may show as "unused" in Supabase dashboard:
- `payments_user_id_idx`
- `payments_subscription_id_idx`
- `subscriptions_user_id_idx`

**These indexes are CRITICAL and must NOT be removed.** They appear unused because:
1. The tables currently have no data (0 rows)
2. Index usage statistics only track actual query execution
3. These indexes are essential for foreign key constraint performance
4. They will be heavily used once the application has data and active queries

**Why These Indexes Are Essential:**
- **Foreign Key Performance**: Without indexes on foreign key columns, every INSERT/UPDATE/DELETE operation performs a full table scan to verify referential integrity
- **JOIN Optimization**: Queries joining payments with subscriptions or users will be significantly slower without these indexes
- **Scalability**: As data grows, missing foreign key indexes cause exponential performance degradation
- **Best Practice**: PostgreSQL and database best practices require indexes on all foreign key columns

**Do NOT remove these indexes** - they are critical for production performance and data integrity.

## Current Security Status

✅ Email/Password authentication enabled
✅ Leaked password error handling implemented
✅ RLS policies optimized for performance
✅ Foreign key indexes added for optimal query performance
⚠️ Leaked password protection - **Requires dashboard configuration**
⚠️ Email confirmation - Disabled (can be enabled in Supabase dashboard)

## Support

If you encounter issues enabling this feature, refer to:
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/security)
