/*
  # Create Invoices System Tables

  1. New Tables
    - `invoices`
      - Core invoice data including bill from/to, dates, amounts
      - Tracks subtotal, tax, discount, and total due
      - Optional notes, terms, and signature
    - `invoice_line_items`
      - Individual line items for each invoice
      - Tracks name, description, quantity, unit price, and line total
    - `invoice_seed_defaults`
      - Preset configurations for invoice defaults
      - Stores JSON config for quick invoice creation

  2. Security
    - Enable RLS on all tables
    - Admin-only access policies
    - Users can only access their own invoices and presets

  3. Constraints
    - Currency must be INR, USD, or AED
    - Discount type must be flat or percent
    - Cascading deletes for line items when invoice deleted
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  currency text NOT NULL CHECK (currency IN ('INR', 'USD', 'AED')),
  bill_from_company text,
  bill_from_email text,
  bill_from_phone text,
  bill_from_address text,
  bill_to_name text,
  bill_to_email text,
  bill_to_phone text,
  bill_to_address text,
  tax_rate numeric DEFAULT 0,
  discount_type text CHECK (discount_type IN ('flat', 'percent')),
  discount_value numeric DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_due numeric NOT NULL DEFAULT 0,
  include_notes boolean DEFAULT true,
  notes text,
  include_terms boolean DEFAULT true,
  terms text,
  include_signature boolean DEFAULT true,
  signature_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  qty numeric NOT NULL,
  unit_price numeric NOT NULL,
  line_total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create invoice_seed_defaults table
CREATE TABLE IF NOT EXISTS invoice_seed_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_seed_defaults_owner_id ON invoice_seed_defaults(owner_id);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_seed_defaults ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices table

-- Admin can select all invoices
CREATE POLICY "Admins can view all invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can insert invoices
CREATE POLICY "Admins can insert invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can update invoices
CREATE POLICY "Admins can update invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can delete invoices
CREATE POLICY "Admins can delete invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for invoice_line_items table

-- Admin can select all line items
CREATE POLICY "Admins can view all line items"
  ON invoice_line_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can insert line items
CREATE POLICY "Admins can insert line items"
  ON invoice_line_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can update line items
CREATE POLICY "Admins can update line items"
  ON invoice_line_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can delete line items
CREATE POLICY "Admins can delete line items"
  ON invoice_line_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for invoice_seed_defaults table

-- Admin can select their own seed defaults
CREATE POLICY "Admins can view their seed defaults"
  ON invoice_seed_defaults
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.id = invoice_seed_defaults.owner_id
    )
  );

-- Admin can insert their own seed defaults
CREATE POLICY "Admins can insert seed defaults"
  ON invoice_seed_defaults
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.id = invoice_seed_defaults.owner_id
    )
  );

-- Admin can update their own seed defaults
CREATE POLICY "Admins can update their seed defaults"
  ON invoice_seed_defaults
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.id = invoice_seed_defaults.owner_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.id = invoice_seed_defaults.owner_id
    )
  );

-- Admin can delete their own seed defaults
CREATE POLICY "Admins can delete their seed defaults"
  ON invoice_seed_defaults
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.id = invoice_seed_defaults.owner_id
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_seed_defaults_updated_at
  BEFORE UPDATE ON invoice_seed_defaults
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
