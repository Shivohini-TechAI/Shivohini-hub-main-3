/*
  # Add Email to User Profiles

  1. Schema Changes
    - Add email column to user_profiles table
    - Update existing records with email from auth.users
    - Create trigger to sync email changes

  2. Data Migration
    - Populate email field for existing users
    - Ensure email is always synced with auth.users
*/

-- Add email column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;
END $$;

-- Update existing user profiles with email from auth.users
UPDATE user_profiles 
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE user_profiles.id = auth_users.id
AND user_profiles.email IS NULL;

-- Create or replace function to handle user updates
CREATE OR REPLACE FUNCTION handle_user_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email in user_profiles when auth.users email changes
  IF TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE user_profiles 
    SET email = NEW.email 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to sync email changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_profile_email();

-- Update the existing handle_new_user function to include email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'team_member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;