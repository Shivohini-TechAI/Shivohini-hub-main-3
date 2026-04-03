/*
  # Fix Project Members Policies

  1. Security Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new simplified policies without circular dependencies
    - Ensure proper access control for project members

  2. Policy Updates
    - Admins and PMs can manage all project members
    - Users can read project members for projects they're part of
    - Remove self-referencing queries that cause recursion
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins and PMs can manage project members" ON project_members;
DROP POLICY IF EXISTS "Users can read project members" ON project_members;

-- Create new simplified policies without circular dependencies
CREATE POLICY "Admins and PMs can manage all project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'project_manager')
    )
  );

-- Allow users to read project members for projects they have access to
CREATE POLICY "Users can read project members for accessible projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- Admin or PM can see all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'project_manager')
    )
    OR
    -- Project creator can see members
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.created_by = auth.uid()
    )
    OR
    -- User is a member of the project
    project_members.user_id = auth.uid()
  );