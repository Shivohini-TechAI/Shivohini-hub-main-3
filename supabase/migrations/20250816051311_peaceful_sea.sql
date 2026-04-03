/*
  # Fix user_profiles table nullable columns

  1. Changes
    - Make project_start_date, project_end_date, and project_submitted_at nullable
    - This allows new users to sign up without providing project details initially

  2. Security
    - No changes to existing RLS policies
*/

-- Make project date columns nullable to allow user signup without project details
ALTER TABLE user_profiles 
ALTER COLUMN project_start_date DROP NOT NULL;

ALTER TABLE user_profiles 
ALTER COLUMN project_end_date DROP NOT NULL;

ALTER TABLE user_profiles 
ALTER COLUMN project_submitted_at DROP NOT NULL;