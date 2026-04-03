/*
  # Fix Infinite Recursion in User Profiles RLS

  1. Problem
    - The "Admin and PM can read all profiles" policy causes infinite recursion
    - It queries user_profiles table within the user_profiles policy
    - This breaks login and signup flows

  2. Solution
    - Drop the recursive policies
    - Use a simpler approach with a function that uses security definer
    - Create a function to check if current user is admin or PM
    - Use that function in the RLS policy to avoid recursion

  3. Changes
    - Drop problematic policies
    - Create helper function to check user role
    - Add new policies using the helper function
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admin and PM can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin and PM can update user profiles" ON user_profiles;

-- Create a security definer function to check if user is admin or PM
-- This function runs with the privileges of the owner (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_admin_or_pm()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'project_manager')
  );
$$;

-- Create policy for admin and PM to read all profiles
-- Using the helper function avoids recursion
CREATE POLICY "Admin and PM can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    public.is_admin_or_pm()
  );

-- Create policy for admin and PM to update other users
CREATE POLICY "Admin and PM can update user profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR
    public.is_admin_or_pm()
  )
  WITH CHECK (
    auth.uid() = id
    OR
    public.is_admin_or_pm()
  );
