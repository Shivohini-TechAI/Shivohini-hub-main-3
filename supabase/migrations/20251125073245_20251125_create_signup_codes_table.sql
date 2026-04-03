/*
  # Create signup_codes table for role-based registration control

  1. New Tables
    - `signup_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique, uppercase)
      - `role` (text, enum: admin, project_manager, team_leader, team_member)
      - `is_active` (boolean, default true)
      - `max_uses` (integer, nullable - null means unlimited)
      - `current_uses` (integer, default 0)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `signup_codes` table
    - Add policy for authenticated admins to read all codes
    - Add policy for public read access during signup (verify in edge function instead)
    - Add policy for admins to insert/update/delete codes

  3. Features
    - Each code can be configured with max usage limit
    - Codes can have expiration dates
    - Tracks current usage count
    - Can be deactivated without deletion
*/

CREATE TABLE IF NOT EXISTS signup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'project_manager'::text, 'team_leader'::text, 'team_member'::text])),
  is_active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  CONSTRAINT code_uppercase CHECK (code = UPPER(code)),
  CONSTRAINT non_negative_uses CHECK (current_uses >= 0),
  CONSTRAINT valid_max_uses CHECK (max_uses IS NULL OR max_uses > 0)
);

ALTER TABLE signup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin read access to signup codes"
  ON signup_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin insert signup codes"
  ON signup_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update signup codes"
  ON signup_codes FOR UPDATE
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

CREATE POLICY "Allow admin delete signup codes"
  ON signup_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE INDEX idx_signup_codes_code ON signup_codes(code);
CREATE INDEX idx_signup_codes_active ON signup_codes(is_active);
