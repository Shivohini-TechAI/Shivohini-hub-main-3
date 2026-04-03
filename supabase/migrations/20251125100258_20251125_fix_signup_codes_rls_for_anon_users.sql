/*
  # Fix RLS policies for signup_codes table to allow anonymous users

  ## Changes

  1. Add policy to allow anonymous users to read active, non-expired signup codes
     - This is needed during the signup flow before the user is authenticated
     - The policy restricts reads to codes that are active and not expired
  
  2. Keep existing admin-only policies for insert, update, delete

  ## RLS Policy Details

  - New policy: "Allow anon users to read signup codes"
    - ROLE: anon (unauthenticated users)
    - ACTION: SELECT
    - CONDITION: is_active = true AND (expires_at IS NULL OR expires_at > now())
    - This allows anyone to validate codes before signup but only active, non-expired ones
*/

CREATE POLICY "Allow anon users to read signup codes"
  ON signup_codes
  FOR SELECT
  TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
