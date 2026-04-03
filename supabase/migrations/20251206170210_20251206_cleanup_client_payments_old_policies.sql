/*
  # Cleanup Old Client Payments Policies

  1. Issue
    - Old policies still exist that allow project_manager and team_leader access
    - These conflict with the requirement that ONLY admin can access client_payments

  2. Solution
    - Drop old permissive policies that allowed multiple roles
    - Keep only the admin-only policies created in previous migration

  3. Result
    - ONLY admin role can SELECT, INSERT, UPDATE, DELETE client_payments
    - PM, TL, and team_member have NO access
*/

-- Drop old policies that were too permissive
DROP POLICY IF EXISTS "Admins, PMs and Team Leaders can manage payments" ON client_payments;
DROP POLICY IF EXISTS "Authorized users can read payments" ON client_payments;
