-- Enable extension for UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================== PROVIDERS =====================
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== USER PROFILES =====================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  strong_areas TEXT,
  role TEXT NOT NULL,
  project_name TEXT,
  project_description TEXT,
  project_start_date DATE,
  project_end_date DATE,
  project_submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- ===================== PROFILES =====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== PROJECTS =====================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  client_requirement TEXT,
  status TEXT NOT NULL,
  end_date DATE,
  github_url TEXT,
  created_by UUID,
  completion_note TEXT,
  completed_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_members UUID[], -- FIXED
  deployment_link TEXT
);

-- ===================== PROJECT MEMBERS =====================
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== TASKS =====================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  assigned_to UUID,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- ===================== MEETING NOTES =====================
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attended_members TEXT
);

-- ===================== PROGRESS STEPS =====================
CREATE TABLE progress_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  step TEXT NOT NULL,
  responsible UUID,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== COSTING ITEMS =====================
CREATE TABLE costing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  product_service TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== CLIENT PAYMENTS =====================
CREATE TABLE client_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== PERSONAL TODOS =====================
CREATE TABLE personal_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

-- ===================== FILE ATTACHMENTS =====================
CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size BIGINT,
  path TEXT NOT NULL,
  uploaded_by UUID,
  task_id UUID,
  meeting_note_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== INVOICES =====================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL,
  bill_from_company TEXT,
  bill_from_email TEXT,
  bill_from_phone TEXT,
  bill_from_address TEXT,
  bill_to_name TEXT,
  bill_to_email TEXT,
  bill_to_phone TEXT,
  bill_to_address TEXT,
  tax_rate NUMERIC,
  discount_type TEXT,
  discount_value NUMERIC,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  total_due NUMERIC NOT NULL,
  include_notes BOOLEAN,
  notes TEXT,
  include_terms BOOLEAN,
  terms TEXT,
  include_signature BOOLEAN,
  signature_url TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== INVOICE LINE ITEMS =====================
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  qty NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== CLIENTS =====================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  location TEXT,
  source TEXT,
  current_stage TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  requirement TEXT,
  is_terminated BOOLEAN DEFAULT FALSE,
  terminated_at TIMESTAMP,
  terminated_reason TEXT
);

-- ===================== CLIENT STAGE NOTES =====================
CREATE TABLE client_stage_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  stage TEXT NOT NULL,
  note_date DATE,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deadline_date DATE,
  due_date DATE,
  created_by UUID
);

-- ===================== SIGNUP CODES =====================
CREATE TABLE signup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- ===================== OFFER LETTERS =====================
CREATE TABLE offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID,
  candidate_name TEXT,
  candidate_email TEXT,
  position_title TEXT,
  department TEXT,
  issue_date DATE,
  acceptance_deadline DATE,
  status TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nda_sent BOOLEAN DEFAULT FALSE,
  nda_received BOOLEAN DEFAULT FALSE,
  offer_sent BOOLEAN DEFAULT FALSE,
  offer_received BOOLEAN DEFAULT FALSE
);

-- ===================== INVOICE DEFAULTS =====================
CREATE TABLE invoice_seed_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);