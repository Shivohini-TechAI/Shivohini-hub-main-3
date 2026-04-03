/*
  # Fix RLS infinite recursion with simplified policies

  1. Problem
    - Current RLS policies are causing infinite recursion
    - Complex queries with EXISTS clauses are creating circular dependencies

  2. Solution
    - Drop all existing problematic policies
    - Create extremely simple policies that avoid any table joins
    - Use direct column comparisons only
    - Temporarily simplify security model to eliminate recursion

  3. Security Changes
    - INSERT: Any authenticated user can create projects
    - SELECT: Users see projects they created OR are assigned to (via assigned_members array)
    - UPDATE/DELETE: Only project creators can modify
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable read for project access" ON projects;
DROP POLICY IF EXISTS "Enable update for project owners and admins" ON projects;
DROP POLICY IF EXISTS "Enable delete for project owners and admins" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can update owned projects" ON projects;
DROP POLICY IF EXISTS "Users can delete owned projects" ON projects;

-- Create simple policies without any subqueries or joins
CREATE POLICY "Allow authenticated users to insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow users to read their projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by 
    OR 
    auth.uid()::text = ANY(assigned_members)
  );

CREATE POLICY "Allow project creators to update"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow project creators to delete"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);