/*
  # Fix infinite recursion in user_profiles RLS policy

  1. Problem
    - The "Users can read collaborator profiles" policy causes infinite recursion
    - It references user_profiles.id within the policy condition, creating circular dependency

  2. Solution
    - Drop the problematic collaborator policy
    - Keep only the essential policies that don't cause recursion
    - Users can still read their own profiles and service role has full access
*/

-- Drop the problematic collaborator policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can read collaborator profiles" ON user_profiles;

-- Ensure we have the basic policies that work without recursion
-- (These should already exist but we'll recreate them to be safe)

-- Drop and recreate the simple policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Recreate simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);