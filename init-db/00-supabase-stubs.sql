-- Create roles that Supabase migrations depend on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;

-- Create auth schema to mimic Supabase
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table since foreign keys will point to it
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY,
  email text,
  encrypted_password text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone
);

-- Stub for auth.uid()
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.sub', true)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Stub for public.handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
