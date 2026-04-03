/*
  # Create Client Stage Notes Table

  1. New Tables
    - `client_stage_notes`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients table)
      - `stage` (text, enum: 'new_lead', 'call_and_check', 'budget_approval', 'requirement_discussion', 'handover')
      - `note_date` (date, the date associated with this note)
      - `note` (text, the note content)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `client_stage_notes` table
    - Add policies for admin-only access:
      - Admins can read all notes
      - Admins can insert new notes
      - Admins can update their notes
      - Admins can delete notes

  3. Indexes
    - Create index on client_id for faster lookups
    - Create index on (client_id, stage) for efficient stage filtering
*/

-- Create client_stage_notes table
CREATE TABLE IF NOT EXISTS client_stage_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('new_lead', 'call_and_check', 'budget_approval', 'requirement_discussion', 'handover')),
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_stage_notes_client_id ON client_stage_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_stage_notes_client_stage ON client_stage_notes(client_id, stage);

-- Enable RLS
ALTER TABLE client_stage_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can read all client stage notes" ON client_stage_notes;
DROP POLICY IF EXISTS "Admins can insert client stage notes" ON client_stage_notes;
DROP POLICY IF EXISTS "Admins can update client stage notes" ON client_stage_notes;
DROP POLICY IF EXISTS "Admins can delete client stage notes" ON client_stage_notes;

-- Policies for admin-only access
CREATE POLICY "Admins can read all client stage notes"
  ON client_stage_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert client stage notes"
  ON client_stage_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update client stage notes"
  ON client_stage_notes
  FOR UPDATE
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

CREATE POLICY "Admins can delete client stage notes"
  ON client_stage_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_stage_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_client_stage_notes_updated_at_trigger ON client_stage_notes;
CREATE TRIGGER update_client_stage_notes_updated_at_trigger
  BEFORE UPDATE ON client_stage_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_client_stage_notes_updated_at();