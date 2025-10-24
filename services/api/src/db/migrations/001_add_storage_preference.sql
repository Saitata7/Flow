-- Migration: Add storage_preference column to flows table
-- This migration adds support for local vs cloud storage preferences

-- Add storage_preference column to flows table
ALTER TABLE flows 
ADD COLUMN IF NOT EXISTS storage_preference VARCHAR(10) DEFAULT 'local' CHECK (storage_preference IN ('local', 'cloud'));

-- Add comment to explain the column
COMMENT ON COLUMN flows.storage_preference IS 'Storage preference: local (device-only) or cloud (synced across devices)';

-- Update schema version for existing flows
UPDATE flows 
SET schema_version = 2 
WHERE schema_version < 2 AND storage_preference IS NULL;

-- Set default storage_preference for existing flows
UPDATE flows 
SET storage_preference = 'local' 
WHERE storage_preference IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_flows_storage_preference ON flows(storage_preference);

-- Create index for user flows with storage preference
CREATE INDEX IF NOT EXISTS idx_flows_user_storage ON flows(owner_id, storage_preference) WHERE deleted_at IS NULL;
