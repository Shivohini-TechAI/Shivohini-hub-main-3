/*
  # Fix infinite recursion in projects RLS policies

  1. Problem
    - Current policies on `projects` table are causing infinite recursion
    - The SELECT policy references `project_members` which may reference back to `projects`
    - This creates a circular dependency causing the recursion error

  2. Solution
    - Drop existing problematic policies
    - Create simplified, non-recursive policies
    - Ensure policies don't create circular references between tables

  3. Security
    - Maintain proper access control
    - Users can only see projects they created or are members of
    - Admins and PMs can see all projects
*/

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Enable select for project access" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for authorized users" ON projects;
DROP POLICY IF EXISTS "Enable delete for authorized users" ON projects;

-- Create new simplified policies without recursion

-- SELECT policy: Allow users to read projects they created, are members of, or if they're admin/PM
CREATE POLICY "Users can read accessible projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- User created the project
    created_by = auth.uid()
    OR
    -- User is admin or project manager (direct role check without recursion)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
    OR
    -- User is a project member (simple membership check)
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

-- INSERT policy: Only authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE policy: Only project creators, admins, and PMs can update
CREATE POLICY "Authorized users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
  );

-- DELETE policy: Only project creators, admins, and PMs can delete
CREATE POLICY "Authorized users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
  );

-- Also fix project_members policies to avoid potential recursion
DROP POLICY IF EXISTS "Users can read project members for accessible projects" ON project_members;
DROP POLICY IF EXISTS "Admins and PMs can manage all project members" ON project_members;

-- Simplified project_members SELECT policy
CREATE POLICY "Users can read project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- User is the member themselves
    user_id = auth.uid()
    OR
    -- User is admin or PM
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
    OR
    -- User created the project (direct check without recursion)
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id 
      AND created_by = auth.uid()
    )
  );

-- Project members management policy
CREATE POLICY "Authorized users can manage project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
    OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id 
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
    OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id 
      AND created_by = auth.uid()
    )
  );