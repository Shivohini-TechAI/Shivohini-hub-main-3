/*
  # Fix Projects RLS Infinite Recursion

  This migration completely removes and recreates the RLS policies for the projects table
  to eliminate infinite recursion issues. The new policies are designed to be simple
  and direct without circular dependencies.

  ## Changes Made
  1. Drop all existing problematic policies on projects table
  2. Create new simplified policies that avoid recursion
  3. Ensure policies use direct checks without complex subqueries
  4. Maintain security while eliminating circular references

  ## Security Model
  - Users can create projects (they become the owner)
  - Users can read projects they created or are members of
  - Admins and Project Managers can read all projects
  - Only project creators and admins/PMs can update/delete projects
*/

-- Drop all existing policies on projects table to start fresh
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

-- Create simple, non-recursive policies

-- INSERT Policy: Users can create projects (they become the owner)
CREATE POLICY "Enable insert for authenticated users"
ON projects FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- SELECT Policy: Users can read their own projects, projects they're members of, or all projects if admin/PM
CREATE POLICY "Enable read for project access"
ON projects FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'project_manager')
  )
  OR
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = projects.id 
    AND user_id = auth.uid()
  )
);

-- UPDATE Policy: Only project creators and admins/PMs can update
CREATE POLICY "Enable update for project owners and admins"
ON projects FOR UPDATE
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

-- DELETE Policy: Only project creators and admins/PMs can delete
CREATE POLICY "Enable delete for project owners and admins"
ON projects FOR DELETE
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

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;