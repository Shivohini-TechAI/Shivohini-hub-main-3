/*
  # Fix user profiles RLS policies

  1. Security Updates
    - Drop existing problematic policies
    - Create proper INSERT policy for authenticated users
    - Create proper UPDATE policy for users to modify their own profiles
    - Create proper SELECT policy for users to read their own profiles
    - Ensure service role can manage profiles for system operations

  2. Policy Structure
    - INSERT: Users can create their own profile during signup
    - SELECT: Users can read their own profile + service role access
    - UPDATE: Users can update their own profile + admin/PM access
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins and PMs can update user roles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can read user profiles for verification" ON user_profiles;

-- Create new, properly structured policies
CREATE POLICY "Allow users to insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins and PMs to update user roles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Allow service role full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);