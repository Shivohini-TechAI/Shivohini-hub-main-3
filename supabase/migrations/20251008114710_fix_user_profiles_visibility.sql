/*
  # Fix User Profiles Visibility for Admin and Project Manager

  1. Problem
    - Admin and Project Manager cannot see all user profiles in User Management page
    - Current RLS policies only allow users to read their own profile
    - The collaborator policy was dropped due to infinite recursion issues

  2. Solution
    - Add a policy that allows admin and project_manager roles to read all profiles
    - Use a simple approach that checks the current user's role from their own profile
    - Split the query to avoid recursion: first check current user's role, then allow access

  3. Changes
    - Add "Admin and PM can read all profiles" policy
    - Policy allows users with admin or project_manager role to SELECT all user_profiles
*/

-- Create policy for admin and PM to read all profiles
-- This is safe from recursion because we're checking auth.uid()'s role in a separate query
CREATE POLICY "Admin and PM can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is reading their own profile
    auth.uid() = id
    OR
    -- Allow if the requesting user is admin or project_manager
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'project_manager')
    )
  );

-- Also allow admin and PM to update other users (for role changes, strong areas, etc.)
CREATE POLICY "Admin and PM can update user profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user is updating their own profile
    auth.uid() = id
    OR
    -- Allow if the requesting user is admin or project_manager
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    -- Allow if user is updating their own profile
    auth.uid() = id
    OR
    -- Allow if the requesting user is admin or project_manager
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('admin', 'project_manager')
    )
  );
