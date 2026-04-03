/*
  # Add Admin and PM Update Capability Without Recursion

  ## Problem
  - Current RLS only allows users to update their own profile
  - Admin and PM need to update other users' roles and strong areas
  - Can't use subquery on user_profiles to check role (causes recursion)

  ## Solution
  - Create a lightweight helper function that caches the current user's role
  - Use this function in RLS policies to avoid querying user_profiles
  - The function uses SECURITY DEFINER to bypass RLS when checking the user's own role

  ## Security
  - Function only returns the calling user's role (not other users)
  - Uses SECURITY DEFINER to bypass RLS for the single lookup
  - No recursion because it's a direct lookup by auth.uid()
*/

-- =============================================================================
-- CREATE HELPER FUNCTION TO GET CURRENT USER'S ROLE
-- =============================================================================

-- This function gets the current authenticated user's role without triggering RLS
-- It's safe because it only returns the CALLING user's role, not other users
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role of the currently authenticated user
  -- SECURITY DEFINER allows this to bypass RLS
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'team_member');
END;
$$;

-- =============================================================================
-- UPDATE THE UPDATE POLICY TO USE THE HELPER FUNCTION
-- =============================================================================

-- Drop the existing update policy
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;

-- CREATE new update policy that allows admin/PM to update any profile
CREATE POLICY "users_and_admins_update_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- User updating their own profile
    auth.uid() = id
    OR
    -- Admin or PM updating any profile (using helper function to avoid recursion)
    get_my_role() IN ('admin', 'project_manager')
  )
  WITH CHECK (
    -- User updating their own profile
    auth.uid() = id
    OR
    -- Admin or PM updating any profile
    get_my_role() IN ('admin', 'project_manager')
  );

-- =============================================================================
-- GRANT EXECUTE PERMISSION ON HELPER FUNCTION
-- =============================================================================

-- Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. The get_my_role() function:
--    - Only returns the CALLING user's role (auth.uid())
--    - Uses SECURITY DEFINER to bypass RLS for this single lookup
--    - Marked as STABLE so Postgres can cache the result per transaction
--    - No security risk because it only reveals the user's own role
--
-- 2. The update policy:
--    - Users can always update their own profile
--    - Admin and PM can update any profile
--    - No recursion because get_my_role() doesn't trigger RLS policies
