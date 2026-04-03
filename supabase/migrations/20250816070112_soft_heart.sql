/*
  # Fix Projects RLS Policy - Resolve Infinite Recursion

  This migration fixes the infinite recursion issue in the projects table RLS policies
  that is preventing project creation.

  ## Changes Made
  1. Drop existing problematic RLS policies on projects table
  2. Create new, simplified RLS policies that avoid recursion
  3. Ensure proper access control without circular references

  ## Security
  - Admins and Project Managers can manage all projects
  - Users can read projects they created or are assigned to
  - No circular policy references that cause infinite recursion
*/

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Admins and PMs can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can read assigned projects" ON projects;

-- Create new, simplified policies without recursion
CREATE POLICY "Enable insert for authenticated users" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable select for project access" ON projects
  FOR SELECT TO authenticated
  USING (
    -- User is the creator
    auth.uid() = created_by
    OR
    -- User is admin or project manager (check role directly)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'project_manager')
    )
    OR
    -- User is assigned to the project
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for authorized users" ON projects
  FOR UPDATE TO authenticated
  USING (
    -- User is the creator
    auth.uid() = created_by
    OR
    -- User is admin or project manager
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    -- User is the creator
    auth.uid() = created_by
    OR
    -- User is admin or project manager
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Enable delete for authorized users" ON projects
  FOR DELETE TO authenticated
  USING (
    -- User is the creator
    auth.uid() = created_by
    OR
    -- User is admin or project manager
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'project_manager')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;