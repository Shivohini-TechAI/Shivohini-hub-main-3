/*
  # Add deployment link to projects table

  1. Changes
    - Add deployment_link column to projects table (TEXT, nullable)
    - This allows storing deployment URLs for projects without affecting existing data

  2. Security
    - No changes to existing RLS policies
    - Column is nullable to maintain compatibility with existing projects
*/

-- Add deployment_link column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deployment_link TEXT;