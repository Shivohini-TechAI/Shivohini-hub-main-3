/*
  # Add is_active column to user_profiles table

  1. Changes
    - Add `is_active` (boolean, default true) column to track account status
    - This allows admins to deactivate accounts without deletion

  2. Security
    - No RLS changes needed
    - Existing policies remain in effect
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;
