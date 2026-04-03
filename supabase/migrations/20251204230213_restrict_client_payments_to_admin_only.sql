/*
  # Restrict Client Payments to Admin Only

  This migration updates the RLS policies on the client_payments table to ensure
  that ONLY users with the 'admin' role can access payment data.

  ## Changes

  1. Drop existing policies that were too permissive:
     - "Users can read accessible client payments" (allowed admin, PM, TL)
     - "Users can manage accessible client payments" (allowed admin, PM, TL)

  2. Create new admin-only policies:
     - Admin can SELECT all client payment records
     - Admin can INSERT new client payment records
     - Admin can UPDATE existing client payment records
     - Admin can DELETE client payment records

  3. Security Impact:
     - project_manager, team_leader, and team_member roles will have NO access
     - Only admin role can view or modify client payment data
*/

-- Drop existing policies that allowed multiple roles
DROP POLICY IF EXISTS "Users can read accessible client payments" ON client_payments;
DROP POLICY IF EXISTS "Users can manage accessible client payments" ON client_payments;

-- Create new admin-only policies

-- Allow admin to SELECT all client payments
CREATE POLICY "Admin can read all client payments"
  ON client_payments
  FOR SELECT
  TO authenticated
  USING (get_my_role() = 'admin');

-- Allow admin to INSERT client payments
CREATE POLICY "Admin can insert client payments"
  ON client_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() = 'admin');

-- Allow admin to UPDATE client payments
CREATE POLICY "Admin can update client payments"
  ON client_payments
  FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Allow admin to DELETE client payments
CREATE POLICY "Admin can delete client payments"
  ON client_payments
  FOR DELETE
  TO authenticated
  USING (get_my_role() = 'admin');