/*
  # Create Client CRM Data Model

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `location` (text, optional)
      - `source` (text, optional) - lead source
      - `current_stage` (text, required) - pipeline stage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `client_stage_notes`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `stage` (text, required) - matches current_stage values
      - `note_date` (date)
      - `note` (text, required)
      - `created_at` (timestamptz)

  2. Stages
    - 'new_lead'
    - 'call_and_check'
    - 'budget_approval'
    - 'requirement_discussion'
    - 'handover'

  3. Security
    - Enable RLS on both tables
    - Only admin users can access (read, insert, update, delete)
    - Other roles have NO access
    - All policies use get_my_role() helper to avoid recursion
*/

-- =============================================================================
-- CREATE CLIENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  location text,
  source text,
  current_stage text NOT NULL DEFAULT 'new_lead'
    CHECK (current_stage IN ('new_lead', 'call_and_check', 'budget_approval', 'requirement_discussion', 'handover')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- CREATE CLIENT_STAGE_NOTES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_stage_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stage text NOT NULL
    CHECK (stage IN ('new_lead', 'call_and_check', 'budget_approval', 'requirement_discussion', 'handover')),
  note_date date DEFAULT current_date,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_stage_notes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR CLIENTS TABLE
-- =============================================================================

-- SELECT: Only admin can read clients
CREATE POLICY "admin_select_clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

-- INSERT: Only admin can insert clients
CREATE POLICY "admin_insert_clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- UPDATE: Only admin can update clients
CREATE POLICY "admin_update_clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- DELETE: Only admin can delete clients
CREATE POLICY "admin_delete_clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- =============================================================================
-- RLS POLICIES FOR CLIENT_STAGE_NOTES TABLE
-- =============================================================================

-- SELECT: Only admin can read stage notes
CREATE POLICY "admin_select_stage_notes"
  ON client_stage_notes
  FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

-- INSERT: Only admin can insert stage notes
CREATE POLICY "admin_insert_stage_notes"
  ON client_stage_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- UPDATE: Only admin can update stage notes
CREATE POLICY "admin_update_stage_notes"
  ON client_stage_notes
  FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- DELETE: Only admin can delete stage notes
CREATE POLICY "admin_delete_stage_notes"
  ON client_stage_notes
  FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_current_stage ON clients(current_stage);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_stage_notes_client_id ON client_stage_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_stage_notes_stage ON client_stage_notes(stage);
