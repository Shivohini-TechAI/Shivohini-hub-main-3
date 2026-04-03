/*
  # Fix Sign-In with Simple Non-Recursive RLS (Version 2)

  ## Problem
  - Previous migrations created policies that cause infinite recursion
  - Sign-in succeeds but profile fetch hangs, causing session timeout
  - Need to remove ALL policies and create simple ones that don't recurse

  ## Solution
  - Drop ALL user_profiles policies using CASCADE
  - Create simple policies that don't query user_profiles within themselves
  - Allow all authenticated users to read profiles (safe for internal tool)
  - Restrict updates to own profile only (admin uses service role)
*/

-- =============================================================================
-- DROP ALL POLICIES WITH CASCADE
-- =============================================================================

-- First, get a clean slate by dropping all policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles CASCADE', pol.policyname);
    END LOOP;
END $$;

-- =============================================================================
-- CREATE SIMPLE NON-RECURSIVE POLICIES
-- =============================================================================

-- SELECT: All authenticated users can read all profiles
CREATE POLICY "auth_users_read_all_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Users can insert their own profile during signup
CREATE POLICY "users_insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile only
CREATE POLICY "users_update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Block deletion via RLS (admin uses service role)
CREATE POLICY "block_profile_deletion"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (false);
