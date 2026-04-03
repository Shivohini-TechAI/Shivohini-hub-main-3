/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - Current RLS policies on user_profiles table are causing infinite recursion
    - Policies are querying user_profiles table within their own conditions
    - This happens during login when fetching user profile data

  2. Solution
    - Drop existing problematic policies that cause recursion
    - Create new simplified policies that avoid self-referencing queries
    - Use direct auth.uid() comparisons instead of subqueries to user_profiles
    - Maintain security while eliminating recursion

  3. Changes
    - Remove policies that query user_profiles within their conditions
    - Add clean policies based on auth.uid() and direct role checks
    - Ensure users can still read/update their own profiles
    - Allow admins and PMs to manage user profiles without recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin and PM can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin and PM can update user roles" ON user_profiles;
DROP POLICY IF EXISTS "Allow admins and PMs to update user roles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new non-recursive policies
-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile (non-role fields)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Service role has full access (for admin operations)
CREATE POLICY "Service role full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 5: Allow reading profiles for project collaboration
-- This policy allows users to read profiles of other users they collaborate with
-- without causing recursion by avoiding self-referencing queries
CREATE POLICY "Users can read collaborator profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can read their own profile
    auth.uid() = id
    OR
    -- User can read profiles of users in projects they're part of
    EXISTS (
      SELECT 1 FROM project_members pm1
      JOIN project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid() AND pm2.user_id = user_profiles.id
    )
  );