/*
  # Update clients and client_stage_notes tables

  1. New Columns (clients table)
    - `requirement` (text, nullable) — stores the client's requirement/scope
    - `is_terminated` (boolean, default false) — flag for terminated leads
    - `terminated_at` (timestamptz, nullable) — timestamp when lead was terminated
    - `terminated_reason` (text, nullable) — reason for termination

  2. New Columns (client_stage_notes table)
    - `deadline_date` (date, nullable) — deadline for stage move

  3. RLS
    - Admins (role = 'admin') can read/write all columns in both tables
    - Existing RLS policies remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'requirement'
  ) THEN
    ALTER TABLE clients ADD COLUMN requirement text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'is_terminated'
  ) THEN
    ALTER TABLE clients ADD COLUMN is_terminated boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'terminated_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN terminated_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'terminated_reason'
  ) THEN
    ALTER TABLE clients ADD COLUMN terminated_reason text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_stage_notes' AND column_name = 'deadline_date'
  ) THEN
    ALTER TABLE client_stage_notes ADD COLUMN deadline_date date;
  END IF;
END $$;
