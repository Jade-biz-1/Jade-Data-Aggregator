-- Migration: Add system_settings table for Phase 8
-- Date: 2025-10-10
-- Description: Creates system_settings table for storing runtime configuration like ALLOW_DEV_ROLE_IN_PRODUCTION

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR NOT NULL UNIQUE,
    value TEXT,
    value_type VARCHAR DEFAULT 'string',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Create index on is_active for filtering active settings
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON system_settings(is_active);

-- Add comment to table
COMMENT ON TABLE system_settings IS 'System-wide configuration settings for runtime behavior';

-- Add comments to columns
COMMENT ON COLUMN system_settings.key IS 'Unique setting key identifier';
COMMENT ON COLUMN system_settings.value IS 'Setting value stored as text';
COMMENT ON COLUMN system_settings.value_type IS 'Data type of value: string, boolean, integer, json';
COMMENT ON COLUMN system_settings.description IS 'Human-readable description of the setting';
COMMENT ON COLUMN system_settings.is_active IS 'Whether the setting is currently active';
COMMENT ON COLUMN system_settings.expires_at IS 'Optional expiration timestamp for temporary settings';

-- Insert default settings
INSERT INTO system_settings (key, value, value_type, description, is_active)
VALUES
    ('ALLOW_DEV_ROLE_IN_PRODUCTION', 'false', 'boolean', 'Temporarily allows developer role in production environment with auto-expiration', false)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions (adjust based on your database user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON system_settings TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE system_settings_id_seq TO your_app_user;

-- Verification query
-- SELECT * FROM system_settings ORDER BY id;
