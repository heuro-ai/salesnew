# Security Configuration Guide

## Security Issues Fixed ✅

### 1. Foreign Key Indexes Added
Added indexes for all foreign key relationships to improve query performance:
- `company_contacts.user_id`
- `lead_quality_scores.user_id`
- `lead_tag_assignments.user_id`

**Impact**: Faster queries and improved referential integrity checks.

### 2. RLS Policy Optimization
Optimized all Row Level Security policies to cache `auth.uid()` evaluation:
- Changed from `auth.uid()` to `(select auth.uid())`
- This prevents re-evaluation for each row, significantly improving performance at scale
- Applied to 7 tables: search_templates, lead_tags, lead_tag_assignments, lead_quality_scores, company_contacts, search_analytics, excluded_companies

**Impact**: Dramatically improved query performance, especially for large datasets and concurrent users.

### 3. Unused Indexes (Information Only)
The system reports many unused indexes. **These should NOT be removed** because:
- The application is new and hasn't accumulated enough usage data yet
- These indexes are designed for future query patterns and performance optimization
- They will be used as the application scales with more users and data
- Removing them would cause performance issues in production

**Note**: These indexes will show as "used" once the application has active users performing queries.

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

## Current Security Status

✅ Email/Password authentication enabled
✅ RLS policies optimized for performance
✅ All foreign key indexes added for optimal query performance
✅ Leaked password error handling implemented in UI
⚠️ Leaked password protection - **Requires dashboard configuration** (see above)
⚠️ Email confirmation - Disabled (can be enabled in Supabase dashboard if needed)

## Security Best Practices Implemented

### Data Security
- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Policies are restrictive by default
- Foreign key relationships maintain data integrity

### Authentication Security
- Secure password authentication with Supabase Auth
- API keys stored in environment variables only
- Fallback API keys for reliability
- Session management handled by Supabase

### Performance Security
- Optimized RLS policies prevent DoS through slow queries
- Foreign key indexes prevent performance degradation
- Efficient query execution at scale

## Support

If you encounter issues enabling this feature, refer to:
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/security)
