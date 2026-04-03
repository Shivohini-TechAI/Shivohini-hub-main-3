/*
  # Fix User Profiles Visibility for Admin and Project Manager

  1. RLS Policy Updates
    - Allow Admin and Project Manager roles to read all user profiles
    - Keep existing policies for users to manage their own profiles
    - Maintain security while enabling proper role-based access

  2. Security
    - Admin can see all users
    - Project Manager can see all users  
    - Team Leader and Team Member can only see their own profile
    - Service role maintains full access
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow service role full access" ON user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Allow service role full access"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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

CREATE POLICY "Admin and PM can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can read their own profile
    auth.uid() = id
    OR
    -- Admin and Project Manager can read all profiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Admin and PM can update user roles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'project_manager')
    )
  );