/*
  # Fix Signup Database Error - RLS Policy Issue

  1. Problem
    - When users sign up, Supabase auth trigger creates a user in auth.users
    - The trigger then calls handle_new_user() which inserts into user_profiles
    - But user_profiles has RLS enabled with policy "Users can insert own profile" requiring auth.uid() = id
    - The trigger runs with anon role, not authenticated, causing "Database error saving new user"

  2. Solution
    - Add SECURITY DEFINER to handle_new_user() function so it runs with owner privileges
    - This bypasses RLS restrictions for the trigger function
    - The function will still create the profile correctly

  3. Changes
    - Recreate handle_new_user() with SECURITY DEFINER
    - Update handle_user_profile_email() with SECURITY DEFINER as well for consistency
*/

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_profile_email() CASCADE;

-- Recreate handle_new_user with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    email,
    name,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'team_member')
  );
  RETURN NEW;
END;
$$;

-- Recreate handle_user_profile_email with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_user_profile_email()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update email in user_profiles when auth.users email changes
  IF TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE user_profiles 
    SET email = NEW.email 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_email();
