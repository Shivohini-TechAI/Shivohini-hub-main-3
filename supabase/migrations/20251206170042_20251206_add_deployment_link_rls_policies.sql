/*
  # Add deployment_link RLS policies for projects

  1. Purpose
    - Allow admin, project_manager, and team_leader to UPDATE deployment_link
    - Reuse existing project ownership logic (creator or assigned member)
    - Keep team_member with SELECT-only access (already covered by existing policies)

  2. Changes
    - Add new UPDATE policy for admin/PM/team_leader roles
    - This policy runs alongside the existing "Allow project creators to update" policy
    - Both policies use OR logic, so either can grant access

  3. Security
    - Admin/PM/TL can only update projects they created OR are assigned to
    - Team members can view but not edit deployment_link
    - Non-assigned users still cannot access projects they're not part of
*/

-- Add policy for admin/PM/TL to update projects they have access to
CREATE POLICY "Allow admin PM TL to update accessible projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    get_my_role() IN ('admin', 'project_manager', 'team_leader')
    AND (
      auth.uid() = created_by 
      OR 
      auth.uid()::text = ANY(assigned_members)
    )
  )
  WITH CHECK (
    get_my_role() IN ('admin', 'project_manager', 'team_leader')
    AND (
      auth.uid() = created_by 
      OR 
      auth.uid()::text = ANY(assigned_members)
    )
  );
