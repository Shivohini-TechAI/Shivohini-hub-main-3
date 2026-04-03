/*
  # Enable Password Reset Policies

  This migration enables the necessary policies and permissions for the password reset functionality.

  ## Changes Made:
  1. **RLS Policies**: Ensure proper access to user_profiles table for email verification
  2. **Edge Function Permissions**: Grant necessary permissions for the reset password functions
  3. **Security Settings**: Configure secure password reset without email confirmation

  ## Security Notes:
  - The edge functions use service role key for admin operations
  - Email verification is done through user_profiles table
  - Password updates are performed using Supabase Admin API
*/

-- Ensure RLS is enabled on user_profiles (should already be enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy for edge functions to read user profiles for email verification
-- This policy allows service role to read user profiles for verification purposes
CREATE POLICY "Service role can read user profiles for verification"
  ON user_profiles
  FOR SELECT
  TO service_role
  USING (true);

-- Grant necessary permissions to the service role for user management
-- This allows the edge functions to update user passwords
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT, UPDATE ON auth.users TO service_role;

-- Ensure the service role can access user_profiles table
GRANT SELECT ON user_profiles TO service_role;

-- Create an index on email for faster lookups during password reset
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lookup 
ON user_profiles (lower(email));

-- Update the existing email index to be case-insensitive if it exists
DROP INDEX IF EXISTS idx_user_profiles_email;
CREATE INDEX idx_user_profiles_email ON user_profiles (lower(email));

-- Ensure the service role has necessary permissions for auth operations
GRANT EXECUTE ON FUNCTION auth.uid() TO service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO service_role;

-- Add a comment to document this migration
COMMENT ON TABLE user_profiles IS 'User profiles table with password reset support via edge functions';