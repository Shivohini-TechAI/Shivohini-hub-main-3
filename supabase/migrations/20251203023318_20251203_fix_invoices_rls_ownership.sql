/*
  # Fix Invoices RLS Policies to Enforce Ownership

  1. Changes
    - Remove existing invoice policies that allow all admins to access all invoices
    - Add new policies that enforce created_by = auth.uid() check for admins
    - Remove existing invoice_line_items policies
    - Add new policies that ensure line items are only accessible through owned invoices
    - Admins can only access their own invoices and related line items

  2. Security
    - Invoices: Admin can only SELECT, INSERT, UPDATE, DELETE invoices they created (created_by = auth.uid())
    - Line Items: Admin can only access line items for invoices they own
    - Maintains RLS protection - no unauthenticated access

  3. Important Notes
    - Existing invoices created by other admins will become inaccessible after this change
    - This enforces proper data isolation between admin users
*/

-- Drop existing invoice policies
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can update invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can delete invoices" ON invoices;

-- Drop existing invoice_line_items policies
DROP POLICY IF EXISTS "Admins can view all line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Admins can insert line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Admins can update line items" ON invoice_line_items;
DROP POLICY IF EXISTS "Admins can delete line items" ON invoice_line_items;

-- New RLS Policies for invoices table with ownership check

-- Admin can select only their own invoices
CREATE POLICY "Admins can view own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- Admin can insert invoices
CREATE POLICY "Admins can create invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- Admin can update only their own invoices
CREATE POLICY "Admins can update own invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- Admin can delete only their own invoices
CREATE POLICY "Admins can delete own invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

-- New RLS Policies for invoice_line_items table

-- Admin can select line items for invoices they own
CREATE POLICY "Admins can view own invoice line items"
  ON invoice_line_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.created_by = auth.uid()
    )
  );

-- Admin can insert line items for invoices they own
CREATE POLICY "Admins can create invoice line items"
  ON invoice_line_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.created_by = auth.uid()
    )
  );

-- Admin can update line items for invoices they own
CREATE POLICY "Admins can update own invoice line items"
  ON invoice_line_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.created_by = auth.uid()
    )
  );

-- Admin can delete line items for invoices they own
CREATE POLICY "Admins can delete own invoice line items"
  ON invoice_line_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.created_by = auth.uid()
    )
  );
