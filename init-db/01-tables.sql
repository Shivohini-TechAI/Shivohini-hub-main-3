CREATE TABLE IF NOT EXISTS public.client_payments (
  "id" uuid,
  "project_id" uuid,
  "client_name" text,
  "amount" numeric,
  "currency" text,
  "payment_date" date,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.file_attachments (
  "id" uuid,
  "name" text,
  "url" text,
  "type" text,
  "size" bigint,
  "path" text,
  "uploaded_by" uuid,
  "task_id" uuid,
  "meeting_note_id" uuid,
  "created_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.client_stage_notes (
  "id" uuid,
  "client_id" uuid,
  "stage" text,
  "note_date" date,
  "note" text,
  "created_at" timestamp with time zone,
  "deadline_date" date,
  "due_date" date,
  "created_by" uuid,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.project_members (
  "id" uuid,
  "project_id" uuid,
  "user_id" uuid,
  "created_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.clients (
  "id" uuid,
  "name" text,
  "phone" text,
  "email" text,
  "location" text,
  "source" text,
  "current_stage" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "requirement" text,
  "is_terminated" boolean,
  "terminated_at" timestamp with time zone,
  "terminated_reason" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.tasks (
  "id" uuid,
  "project_id" uuid,
  "title" text,
  "completed" boolean,
  "assigned_to" uuid,
  "due_date" date,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "created_by" uuid,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.profiles (
  "id" uuid,
  "email" text,
  "full_name" text,
  "avatar_url" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.signup_codes (
  "id" uuid,
  "code" text,
  "role" text,
  "is_active" boolean,
  "max_uses" bigint,
  "current_uses" bigint,
  "created_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.invoice_seed_defaults (
  "id" uuid,
  "owner_id" uuid,
  "name" text,
  "config" jsonb,
  "is_active" boolean,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.offer_letters (
  "id" uuid,
  "created_by" uuid,
  "candidate_name" text,
  "candidate_email" text,
  "position_title" text,
  "department" text,
  "issue_date" date,
  "acceptance_deadline" date,
  "status" text,
  "pdf_url" text,
  "created_at" timestamp with time zone,
  "nda_sent" boolean,
  "nda_received" boolean,
  "offer_sent" boolean,
  "offer_received" boolean,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.projects (
  "id" uuid,
  "title" text,
  "description" text,
  "client_requirement" text,
  "status" text,
  "end_date" date,
  "github_url" text,
  "created_by" uuid,
  "completion_note" text,
  "completed_at" timestamp with time zone,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "assigned_members" text,
  "deployment_link" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.progress_steps (
  "id" uuid,
  "project_id" uuid,
  "step" text,
  "responsible" uuid,
  "start_date" date,
  "end_date" date,
  "status" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.invoices (
  "id" uuid,
  "number" text,
  "issue_date" date,
  "due_date" date,
  "currency" text,
  "bill_from_company" text,
  "bill_from_email" text,
  "bill_from_phone" text,
  "bill_from_address" text,
  "bill_to_name" text,
  "bill_to_email" text,
  "bill_to_phone" text,
  "bill_to_address" text,
  "tax_rate" numeric,
  "discount_type" text,
  "discount_value" numeric,
  "subtotal" numeric,
  "tax_amount" numeric,
  "discount_amount" numeric,
  "total_due" numeric,
  "include_notes" boolean,
  "notes" text,
  "include_terms" boolean,
  "terms" text,
  "include_signature" boolean,
  "signature_url" text,
  "created_by" uuid,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  "id" uuid,
  "name" text,
  "phone" text,
  "whatsapp" text,
  "strong_areas" text,
  "role" text,
  "project_name" text,
  "project_description" text,
  "project_start_date" date,
  "project_end_date" date,
  "project_submitted_at" timestamp with time zone,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "email" text,
  "is_active" boolean,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.personal_todos (
  "id" uuid,
  "user_id" uuid,
  "title" text,
  "completed" boolean,
  "due_date" date,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "created_by" uuid,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.meeting_notes (
  "id" uuid,
  "project_id" uuid,
  "date" date,
  "content" text,
  "created_by" uuid,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "attended_members" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.providers (
  "id" uuid,
  "company_name" text,
  "phone" text,
  "address" text,
  "created_at" text,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  "id" uuid,
  "invoice_id" uuid,
  "name" text,
  "description" text,
  "qty" numeric,
  "unit_price" numeric,
  "line_total" numeric,
  "created_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public.costing_items (
  "id" uuid,
  "project_id" uuid,
  "product_service" text,
  "quantity" bigint,
  "currency" text,
  "amount" numeric,
  "comment" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  PRIMARY KEY ("id")
);

