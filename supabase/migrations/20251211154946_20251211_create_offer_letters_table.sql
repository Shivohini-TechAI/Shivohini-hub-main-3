/*
  # Create Offer Letters Table

  This migration creates a new table for managing offer letters sent to candidates.

  ## New Tables

  ### `offer_letters`
  - `id` (uuid, primary key) - Unique identifier for each offer letter
  - `created_by` (uuid) - References the user who created the offer letter
  - `candidate_name` (text) - Full name of the candidate
  - `candidate_email` (text) - Email address of the candidate
  - `position_title` (text) - Job position being offered
  - `department` (text) - Department the position belongs to
  - `issue_date` (date) - Date the offer letter was issued (defaults to today)
  - `acceptance_deadline` (date) - Deadline for candidate to accept the offer
  - `status` (text) - Current status of the offer (Draft | Sent | Accepted)
  - `pdf_url` (text) - URL to the generated PDF file if stored
  - `created_at` (timestamptz) - Timestamp when the record was created

  ## Security

  ### RLS Policies
  - Enable Row Level Security on the table
  - **Admin and Project Manager** roles have full access (SELECT, INSERT, UPDATE, DELETE)
  - **Team Leader and Team Member** roles have NO access
  - Uses `get_my_role()` function to check user roles

  ## Important Notes
  - Only authenticated users with admin or project_manager roles can access this data
  - Status field defaults to 'Draft' for new offer letters
  - Issue date defaults to the current date
*/

-- Create the offer_letters table
CREATE TABLE IF NOT EXISTS offer_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id),
  candidate_name text,
  candidate_email text,
  position_title text,
  department text,
  issue_date date DEFAULT now(),
  acceptance_deadline date,
  status text DEFAULT 'Draft',
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;

-- Policy: Admin and PM can SELECT all offer letters
CREATE POLICY "Admin and PM can read all offer letters"
  ON offer_letters
  FOR SELECT
  TO authenticated
  USING (get_my_role() IN ('admin', 'project_manager'));

-- Policy: Admin and PM can INSERT offer letters
CREATE POLICY "Admin and PM can insert offer letters"
  ON offer_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (get_my_role() IN ('admin', 'project_manager'));

-- Policy: Admin and PM can UPDATE offer letters
CREATE POLICY "Admin and PM can update offer letters"
  ON offer_letters
  FOR UPDATE
  TO authenticated
  USING (get_my_role() IN ('admin', 'project_manager'))
  WITH CHECK (get_my_role() IN ('admin', 'project_manager'));

-- Policy: Admin and PM can DELETE offer letters
CREATE POLICY "Admin and PM can delete offer letters"
  ON offer_letters
  FOR DELETE
  TO authenticated
  USING (get_my_role() IN ('admin', 'project_manager'));