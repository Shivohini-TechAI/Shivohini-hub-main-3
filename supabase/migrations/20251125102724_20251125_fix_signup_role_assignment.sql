/*
  # Fix Signup Role Assignment

  1. Problem
    - The handle_new_user() trigger defaults role to 'team_member' if not found in metadata
    - Frontend now passes role in auth.signUp() metadata
    - Trigger needs to read phone, whatsapp, and strong_areas from metadata too

  2. Solution
    - Update handle_new_user() to properly read all fields from raw_user_meta_data
    - Keep the 'team_member' fallback for legacy/manual user creation
    - Ensure phone, whatsapp, and strong_areas are also populated from metadata

  3. Changes
    - Recreate handle_new_user() to read all metadata fields correctly
*/

-- Drop existing trigger function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate handle_new_user with proper metadata reading
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
    phone,
    whatsapp,
    strong_areas,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'strong_areas',
    COALESCE(NEW.raw_user_meta_data->>'role', 'team_member')
  );
  RETURN NEW;
END;
$$;

-- Recreate trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
