/*
  # Fix Admin Full Access to All Projects and Data

  ## Problem
  - Previous migrations removed admin/PM role checks from project RLS policies
  - Admins cannot see projects unless they created them or are explicitly assigned
  - Admins cannot see all user profiles for management purposes

  ## Solution
  - Restore admin and project_manager role checks to all project-related RLS policies
  - Add admin/PM access to user_profiles for user management
  - Ensure admin has full visibility and control over all data

  ## Tables Updated
  - projects: Allow admin/PM to SELECT, UPDATE, DELETE all projects
  - user_profiles: Allow admin/PM to SELECT all profiles
  - tasks: Allow admin/PM to manage all tasks
  - meeting_notes: Allow admin/PM to manage all meeting notes
  - progress_steps: Allow admin/PM to manage all progress steps
  - costing_items: Allow admin/PM to manage all costing items
  - client_payments: Allow admin/PM to manage all client payments
  - personal_todos: Allow admin/PM to view all personal todos
  - file_attachments: Allow admin/PM to manage all file attachments

  ## Security
  - Admin has full access to everything (as expected)
  - Project Manager has full access to all projects and related data
  - Team Leaders and Team Members maintain existing restricted access
  - Regular users still only see their own data or assigned projects
*/

-- =============================================================================
-- PROJECTS TABLE - Add admin/PM full access
-- =============================================================================

DROP POLICY IF EXISTS "Allow users to read their projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON projects;
DROP POLICY IF EXISTS "Allow project creators to update" ON projects;
DROP POLICY IF EXISTS "Allow project creators to delete" ON projects;

-- SELECT: Allow users to read projects they created, are assigned to, OR if they're admin/PM
CREATE POLICY "Users can read accessible projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- User created the project
    auth.uid() = created_by
    OR
    -- User is in assigned members array
    auth.uid()::text = ANY(assigned_members)
    OR
    -- User is admin or project manager
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- INSERT: Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Project creators, admins, and PMs can update
CREATE POLICY "Authorized users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- DELETE: Project creators, admins, and PMs can delete
CREATE POLICY "Authorized users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- =============================================================================
-- USER_PROFILES TABLE - Add admin/PM visibility to all profiles
-- =============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read collaborator profiles" ON user_profiles;

-- SELECT: Users can read their own profile + admin/PM can read all profiles
CREATE POLICY "Users can read accessible profiles"
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
    OR
    -- User can read profiles of users in projects they're part of
    EXISTS (
      SELECT 1 FROM projects p
      WHERE (p.created_by = auth.uid() OR auth.uid()::text = ANY(p.assigned_members))
      AND (p.created_by = user_profiles.id OR user_profiles.id::text = ANY(p.assigned_members))
    )
  );

-- UPDATE: Add admin/PM ability to update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'project_manager')
    )
  );

-- =============================================================================
-- TASKS TABLE - Add admin/PM full access
-- =============================================================================

DROP POLICY IF EXISTS "Users can read project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage project tasks" ON tasks;

-- SELECT: Users can read tasks from their projects OR admin/PM can read all
CREATE POLICY "Users can read accessible tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    -- User is assigned to the task
    assigned_to = auth.uid()
    OR
    -- User has access to the project (creator or member)
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    -- User is admin or project manager
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- INSERT: Users can create tasks in their projects OR admin/PM can create any
CREATE POLICY "Users can create tasks in accessible projects"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- UPDATE: Users can update tasks in their projects OR admin/PM can update any
CREATE POLICY "Users can update accessible tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- DELETE: Users can delete tasks in their projects OR admin/PM can delete any
CREATE POLICY "Users can delete accessible tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- =============================================================================
-- MEETING_NOTES TABLE - Add admin/PM full access
-- =============================================================================

DROP POLICY IF EXISTS "Users can read project meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users can manage project meeting notes" ON meeting_notes;

-- SELECT: Users can read notes from their projects OR admin/PM can read all
CREATE POLICY "Users can read accessible meeting notes"
  ON meeting_notes
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = meeting_notes.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- INSERT: Users can create notes in their projects OR admin/PM can create any
CREATE POLICY "Users can create notes in accessible projects"
  ON meeting_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = meeting_notes.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- UPDATE: Users can update notes in their projects OR admin/PM can update any
CREATE POLICY "Users can update accessible meeting notes"
  ON meeting_notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = meeting_notes.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = meeting_notes.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- DELETE: Users can delete notes in their projects OR admin/PM can delete any
CREATE POLICY "Users can delete accessible meeting notes"
  ON meeting_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = meeting_notes.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- =============================================================================
-- PROGRESS_STEPS TABLE - Add admin/PM full access
-- =============================================================================

DROP POLICY IF EXISTS "Users can read project progress steps" ON progress_steps;
DROP POLICY IF EXISTS "Users can manage project progress steps" ON progress_steps;

-- SELECT: Users can read progress from their projects OR admin/PM can read all
CREATE POLICY "Users can read accessible progress steps"
  ON progress_steps
  FOR SELECT
  TO authenticated
  USING (
    responsible = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = progress_steps.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- INSERT/UPDATE/DELETE: Users can manage progress in their projects OR admin/PM can manage any
CREATE POLICY "Users can manage accessible progress steps"
  ON progress_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = progress_steps.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = progress_steps.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- =============================================================================
-- COSTING_ITEMS TABLE - Add admin/PM full access
-- =============================================================================

DROP POLICY IF EXISTS "Users can read project costing items" ON costing_items;
DROP POLICY IF EXISTS "Users can manage project costing items" ON costing_items;

-- SELECT: Users can read costing from their projects OR admin/PM can read all
CREATE POLICY "Users can read accessible costing items"
  ON costing_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = costing_items.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager', 'team_leader')
    )
  );

-- INSERT/UPDATE/DELETE: Users can manage costing in their projects OR admin/PM/TL can manage any
CREATE POLICY "Users can manage accessible costing items"
  ON costing_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = costing_items.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager', 'team_leader')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = costing_items.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager', 'team_leader')
    )
  );

-- =============================================================================
-- CLIENT_PAYMENTS TABLE - Add admin/PM full access
-- =============================================================================

DROP POLICY IF EXISTS "Users can read project client payments" ON client_payments;
DROP POLICY IF EXISTS "Users can manage project client payments" ON client_payments;

-- SELECT: Users can read payments from their projects OR admin/PM can read all
CREATE POLICY "Users can read accessible client payments"
  ON client_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = client_payments.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager', 'team_leader')
    )
  );

-- INSERT/UPDATE/DELETE: Users can manage payments in their projects OR admin/PM/TL can manage any
CREATE POLICY "Users can manage accessible client payments"
  ON client_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = client_payments.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager', 'team_leader')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = client_payments.project_id
      AND (created_by = auth.uid() OR auth.uid()::text = ANY(assigned_members))
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager', 'team_leader')
    )
  );

-- =============================================================================
-- PERSONAL_TODOS TABLE - Add admin/PM visibility
-- =============================================================================

DROP POLICY IF EXISTS "Users can manage own todos" ON personal_todos;

-- SELECT: Users can read their own todos OR admin/PM can read all todos
CREATE POLICY "Users can read accessible personal todos"
  ON personal_todos
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- INSERT/UPDATE/DELETE: Users can only manage their own todos
CREATE POLICY "Users can manage own personal todos"
  ON personal_todos
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- FILE_ATTACHMENTS TABLE - Add admin/PM full access
-- =============================================================================

DROP POLICY IF EXISTS "Users can read file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Users can manage file attachments" ON file_attachments;

-- SELECT: Users can read files from their projects/tasks/notes OR admin/PM can read all
CREATE POLICY "Users can read accessible file attachments"
  ON file_attachments
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR
    -- Check if user has access to the associated task
    (task_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = file_attachments.task_id
      AND (p.created_by = auth.uid() OR auth.uid()::text = ANY(p.assigned_members))
    ))
    OR
    -- Check if user has access to the associated meeting note
    (meeting_note_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM meeting_notes mn
      JOIN projects p ON mn.project_id = p.id
      WHERE mn.id = file_attachments.meeting_note_id
      AND (p.created_by = auth.uid() OR auth.uid()::text = ANY(p.assigned_members))
    ))
    OR
    -- Admin or project manager can read all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );

-- INSERT/UPDATE/DELETE: Users can manage files in their projects OR admin/PM can manage any
CREATE POLICY "Users can manage accessible file attachments"
  ON file_attachments
  FOR ALL
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'project_manager')
    )
  );