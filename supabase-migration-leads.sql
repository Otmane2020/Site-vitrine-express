-- Migration Supabase: Create leads table for Google Ads lead generation
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business TEXT NOT NULL,
  source TEXT DEFAULT 'direct',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Add RLS policies (if needed)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow insert from public API
CREATE POLICY "Allow public inserts" ON leads
  FOR INSERT WITH CHECK (true);

-- Allow select for admins
CREATE POLICY "Allow select for authenticated users" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');
