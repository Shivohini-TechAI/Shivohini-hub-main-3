/*
  # Fix infinite recursion in projects RLS policies

  1. Problem
    - Current RLS policies on projects table are causing infinite recursion
    - Circular dependencies between projects, project_members, and user_profiles tables
    - Complex nested queries creating policy evaluation loops

  2. Solution
    - Drop all existing policies on projects table
    - Create new simplified policies without circular references
    - Use direct user ID checks and role-based access
    - Eliminate complex subqueries that reference back to projects table

  3. Security Model
    - Users can read/update projects they created
    - Admins and Project Managers can access all projects
    - Project members can read projects they're assigned to
    - No circular policy dependencies
*/

-- Drop all existing policies on projects table
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Authorized users can delete projects" ON projects;
DROP POLICY IF EXISTS "Authorized users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can read accessible projects" ON projects;

-- Create new simplified policies without recursion

-- 1. INSERT policy - users can create projects
CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 2. SELECT policy - simplified without circular references
CREATE POLICY "Users can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- Project creator can always read
    created_by = auth.uid()
    OR
    -- Admins and PMs can read all projects (direct role check)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
    OR
    -- Project members can read (direct membership check)
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

-- 3. UPDATE policy - simplified authorization
CREATE POLICY "Users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    -- Project creator can update
    created_by = auth.uid()
    OR
    -- Admins and PMs can update (direct role check)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
  );

-- 4. DELETE policy - simplified authorization
CREATE POLICY "Users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    -- Project creator can delete
    created_by = auth.uid()
    OR
    -- Admins and PMs can delete (direct role check)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'project_manager')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;