-- Migration Supabase: Stockage sécurisé du token Google Ads OAuth
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS google_ads_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE google_ads_tokens ENABLE ROW LEVEL SECURITY;

-- Aucun accès public en lecture/écriture — uniquement via service_role key (backend)
-- (pas de policy = accès refusé par défaut à tout rôle non service_role)
