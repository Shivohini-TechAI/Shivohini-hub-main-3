/*
  # Add assigned_members column to projects table

  1. New Columns
    - `assigned_members` (text array) - stores user IDs of assigned project members
  
  2. Changes
    - Add assigned_members column with default empty array
    - Column allows storing multiple user IDs as an array
*/

-- Add assigned_members column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'assigned_members'
  ) THEN
    ALTER TABLE projects ADD COLUMN assigned_members text[] DEFAULT '{}';
  END IF;
END $$;