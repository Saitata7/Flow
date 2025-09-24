-- migrations/001_create_notification_tables.sql
-- Create tables for notification system

-- User devices table to store FCM tokens
CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    device_token VARCHAR(500) NOT NULL UNIQUE,
    platform VARCHAR(50) NOT NULL DEFAULT 'unknown',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Notification logs table to track sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Notification schedules table for recurring notifications
CREATE TABLE IF NOT EXISTS notification_schedules (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'daily_reminder', 'weekly_report', etc.
    scheduled_time TIME NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP WITH TIME ZONE NULL,
    next_send_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_category ON notification_logs(category);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_user_id ON notification_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_active ON notification_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_send ON notification_schedules(next_send_at) WHERE next_send_at IS NOT NULL;

-- Add foreign key constraints if user_settings table exists
-- ALTER TABLE user_devices ADD CONSTRAINT fk_user_devices_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE notification_logs ADD CONSTRAINT fk_notification_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE notification_schedules ADD CONSTRAINT fk_notification_schedules_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON TABLE user_devices IS 'Stores FCM device tokens for push notifications';
COMMENT ON TABLE notification_logs IS 'Logs all sent notifications for audit and debugging';
COMMENT ON TABLE notification_schedules IS 'Stores recurring notification schedules';

COMMENT ON COLUMN user_devices.device_token IS 'FCM device token for push notifications';
COMMENT ON COLUMN user_devices.platform IS 'Device platform: ios, android, web';
COMMENT ON COLUMN user_devices.is_active IS 'Whether the device token is still valid';

COMMENT ON COLUMN notification_logs.category IS 'Notification type: reminder, achievement, report, community';
COMMENT ON COLUMN notification_logs.success_count IS 'Number of devices that received the notification';
COMMENT ON COLUMN notification_logs.failure_count IS 'Number of devices that failed to receive the notification';
COMMENT ON COLUMN notification_logs.data IS 'Additional data payload sent with notification';

COMMENT ON COLUMN notification_schedules.type IS 'Schedule type: daily_reminder, weekly_report';
COMMENT ON COLUMN notification_schedules.scheduled_time IS 'Time of day to send notification';
COMMENT ON COLUMN notification_schedules.timezone IS 'User timezone for scheduling';
COMMENT ON COLUMN notification_schedules.next_send_at IS 'Next scheduled send time';
