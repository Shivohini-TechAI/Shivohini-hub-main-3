/*
  # Calendar Feature RLS Policies

  1. Overview
    - Clean up and standardize RLS policies for calendar-related tables
    - All required columns (due_date, created_by) already exist
    - Focus on simplifying and clarifying access control

  2. Tables Updated
    - `tasks` - Project tasks with due dates
    - `personal_todos` - Personal to-do items
    - `client_stage_notes` - Client CRM stage notes

  3. Security Rules
    - **Admin**: Full access to all records (SELECT/INSERT/UPDATE/DELETE)
    - **Project Manager & Team Leader**: Access to records they created or are assigned to
    - **Team Member**: Only records where created_by = auth.uid()
    - **client_stage_notes**: Admin-only access (no other roles)

  4. Changes
    - Drop all existing policies for these three tables
    - Create simplified, non-overlapping policies
    - Ensure proper role-based access control
*/

-- =====================================================
-- TASKS TABLE - RLS POLICIES
-- =====================================================

-- Drop all existing policies for tasks
DROP POLICY IF EXISTS "Admin full access to tasks" ON tasks;
DROP POLICY IF EXISTS "PM and TL access to tasks" ON tasks;
DROP POLICY IF EXISTS "Team member access to tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Tasks select access" ON tasks;
DROP POLICY IF EXISTS "Tasks insert access" ON tasks;
DROP POLICY IF EXISTS "Tasks update access" ON tasks;
DROP POLICY IF EXISTS "Tasks delete access" ON tasks;
DROP POLICY IF EXISTS "Users can read accessible tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in accessible projects" ON tasks;
DROP POLICY IF EXISTS "Users can update accessible tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete accessible tasks" ON tasks;

-- Admin: Full access to all tasks
CREATE POLICY "Admin can manage all tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- PM & TL: Tasks they created or are assigned to
CREATE POLICY "PM and TL can manage their tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('project_manager', 'team_leader')
    )
    AND (
      tasks.created_by = auth.uid()
      OR tasks.assigned_to = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('project_manager', 'team_leader')
    )
    AND (
      tasks.created_by = auth.uid()
      OR tasks.assigned_to = auth.uid()
    )
  );

-- Team Member: Only tasks they created
CREATE POLICY "Team members can manage own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'team_member'
    )
    AND tasks.created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'team_member'
    )
    AND tasks.created_by = auth.uid()
  );

-- =====================================================
-- PERSONAL_TODOS TABLE - RLS POLICIES
-- =====================================================

-- Drop all existing policies for personal_todos
DROP POLICY IF EXISTS "Admin full access to personal_todos" ON personal_todos;
DROP POLICY IF EXISTS "PM and TL access to personal_todos" ON personal_todos;
DROP POLICY IF EXISTS "Team member access to personal_todos" ON personal_todos;
DROP POLICY IF EXISTS "Personal todos select access" ON personal_todos;
DROP POLICY IF EXISTS "Personal todos insert access" ON personal_todos;
DROP POLICY IF EXISTS "Personal todos update access" ON personal_todos;
DROP POLICY IF EXISTS "Personal todos delete access" ON personal_todos;
DROP POLICY IF EXISTS "Users can manage own personal todos" ON personal_todos;
DROP POLICY IF EXISTS "Users can read accessible personal todos" ON personal_todos;

-- Admin: Full access to all personal todos
CREATE POLICY "Admin can manage all personal todos"
  ON personal_todos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- PM & TL: Todos they created or own (user_id)
CREATE POLICY "PM and TL can manage their todos"
  ON personal_todos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('project_manager', 'team_leader')
    )
    AND (
      personal_todos.created_by = auth.uid()
      OR personal_todos.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('project_manager', 'team_leader')
    )
    AND (
      personal_todos.created_by = auth.uid()
      OR personal_todos.user_id = auth.uid()
    )
  );

-- Team Member: Only todos they created
CREATE POLICY "Team members can manage own todos"
  ON personal_todos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'team_member'
    )
    AND personal_todos.created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'team_member'
    )
    AND personal_todos.created_by = auth.uid()
  );

-- =====================================================
-- CLIENT_STAGE_NOTES TABLE - RLS POLICIES
-- =====================================================

-- Drop all existing policies for client_stage_notes
DROP POLICY IF EXISTS "Admin full access to client_stage_notes" ON client_stage_notes;
DROP POLICY IF EXISTS "Admins can read all client stage notes" ON client_stage_notes;
DROP POLICY IF EXISTS "Admins can insert client stage notes" ON client_stage_notes;
DROP POLICY IF EXISTS "Admins can update client stage notes" ON client_stage_notes;
DROP POLICY IF EXISTS "Admins can delete client stage notes" ON client_stage_notes;
DROP POLICY IF EXISTS "No access to client_stage_notes for non-admins" ON client_stage_notes;
DROP POLICY IF EXISTS "admin_select_stage_notes" ON client_stage_notes;
DROP POLICY IF EXISTS "admin_insert_stage_notes" ON client_stage_notes;
DROP POLICY IF EXISTS "admin_update_stage_notes" ON client_stage_notes;
DROP POLICY IF EXISTS "admin_delete_stage_notes" ON client_stage_notes;

-- Admin-only: Full access to all client stage notes
CREATE POLICY "Admin only access to client stage notes"
  ON client_stage_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
