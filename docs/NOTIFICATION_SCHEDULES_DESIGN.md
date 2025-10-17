# Notification Schedules Design

## Overview

The `notification_schedules` table was added to support complex notification scheduling that goes beyond simple user settings. This design addresses the need for:

- **Multiple reminder times per day** for different flows
- **Flow-specific notification customization**
- **Quiet hours and sound settings**
- **Complex scheduling patterns** (daily, weekly, monthly)
- **Timezone-aware notifications**

## Why Separate from `user_settings`?

### `user_settings` Table
- **Purpose**: General user preferences (theme, UI, privacy)
- **Structure**: One row per user with JSON settings
- **Scope**: Global user preferences

### `notification_schedules` Table
- **Purpose**: Complex notification scheduling
- **Structure**: Multiple rows per user/flow
- **Scope**: Granular notification control

## Table Structure

```sql
CREATE TABLE notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE, -- Nullable for global
    time_of_day TIME NOT NULL,
    type ENUM('reminder', 'quiet', 'sound') NOT NULL,
    enabled BOOLEAN DEFAULT true,
    timezone VARCHAR(100) DEFAULT 'UTC',
    metadata JSON DEFAULT '{}',
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),
    title VARCHAR(200),
    message TEXT,
    frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    days_of_week JSON,
    start_date DATE,
    end_date DATE,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0 CHECK (trigger_count >= 0),
    is_active BOOLEAN DEFAULT true,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

## Key Features

### 1. **Multi-Row Per User/Flow**
- Users can have multiple notification schedules
- Each flow can have its own reminder times
- Global user notifications (flow_id = NULL)

### 2. **Flexible Scheduling**
- **Daily**: Every day at specified time
- **Weekly**: Specific days of the week
- **Monthly**: Specific date each month
- **Date ranges**: Start and end dates for temporary schedules

### 3. **Notification Types**
- **Reminder**: Standard flow reminders
- **Quiet**: Quiet hours (no notifications)
- **Sound**: Sound/vibration settings

### 4. **Advanced Features**
- **Timezone support**: User's local timezone
- **Priority levels**: High, medium, low
- **Custom messages**: Personalized notification content
- **Metadata**: Additional settings (sound type, vibration, etc.)

## Usage Examples

### 1. **Daily Flow Reminder**
```sql
INSERT INTO notification_schedules (
    user_id, flow_id, time_of_day, type, title, message
) VALUES (
    'user-uuid', 'flow-uuid', '09:00:00', 'reminder', 
    'Morning Flow Check-in', 'Time to track your daily habits!'
);
```

### 2. **Multiple Daily Reminders**
```sql
-- Morning reminder
INSERT INTO notification_schedules (user_id, flow_id, time_of_day, type) 
VALUES ('user-uuid', 'flow-uuid', '08:00:00', 'reminder');

-- Evening reminder
INSERT INTO notification_schedules (user_id, flow_id, time_of_day, type) 
VALUES ('user-uuid', 'flow-uuid', '20:00:00', 'reminder');
```

### 3. **Weekly Schedule**
```sql
INSERT INTO notification_schedules (
    user_id, flow_id, time_of_day, type, frequency, days_of_week
) VALUES (
    'user-uuid', 'flow-uuid', '18:00:00', 'reminder', 'weekly',
    '["Mon", "Wed", "Fri"]'::json
);
```

### 4. **Quiet Hours**
```sql
INSERT INTO notification_schedules (
    user_id, flow_id, time_of_day, type, metadata
) VALUES (
    'user-uuid', NULL, '22:00:00', 'quiet',
    '{"duration_hours": 8, "allow_emergency": true}'::json
);
```

### 5. **Flow-Specific Sound Settings**
```sql
INSERT INTO notification_schedules (
    user_id, flow_id, time_of_day, type, metadata
) VALUES (
    'user-uuid', 'flow-uuid', '09:00:00', 'sound',
    '{"sound": "flow_reminder", "vibration": true, "badge": true}'::json
);
```

## Database Views and Functions

### 1. **Active Notification Schedules View**
```sql
CREATE VIEW active_notification_schedules AS
SELECT 
    ns.*,
    u.display_name as user_name,
    f.title as flow_title,
    CASE 
        WHEN ns.flow_id IS NULL THEN 'global'
        ELSE 'flow_specific'
    END as schedule_scope
FROM notification_schedules ns
LEFT JOIN users u ON ns.user_id = u.id
LEFT JOIN flows f ON ns.flow_id = f.id
WHERE ns.deleted_at IS NULL 
    AND ns.enabled = true 
    AND ns.is_active = true;
```

### 2. **Next Notification Time Function**
```sql
CREATE FUNCTION get_next_notification_time(
    schedule_id UUID,
    from_time TIMESTAMP DEFAULT NOW()
) RETURNS TIMESTAMP;
```

### 3. **Trigger Notification Function**
```sql
CREATE FUNCTION trigger_notification_schedule(
    schedule_id UUID,
    trigger_time TIMESTAMP DEFAULT NOW()
) RETURNS BOOLEAN;
```

## Indexes for Performance

```sql
-- User-specific schedules
CREATE INDEX idx_notification_schedules_user 
ON notification_schedules(user_id, enabled, is_active, deleted_at);

-- Flow-specific schedules
CREATE INDEX idx_notification_schedules_flow 
ON notification_schedules(flow_id, enabled, is_active, deleted_at);

-- Time-based queries
CREATE INDEX idx_notification_schedules_time_type 
ON notification_schedules(time_of_day, type, enabled, is_active);

-- Frequency-based queries
CREATE INDEX idx_notification_schedules_frequency 
ON notification_schedules(frequency, days_of_week, enabled, is_active);

-- Date range queries
CREATE INDEX idx_notification_schedules_date_range 
ON notification_schedules(start_date, end_date, enabled, is_active);

-- Trigger tracking
CREATE INDEX idx_notification_schedules_triggered 
ON notification_schedules(last_triggered_at, trigger_count);
```

## Constraints and Validation

### 1. **Unique Constraint**
```sql
-- One schedule per user/flow/time/type combination
UNIQUE (user_id, flow_id, time_of_day, type) 
WHERE deleted_at IS NULL AND enabled = true
```

### 2. **Check Constraints**
```sql
-- Priority range
CHECK (priority >= 1 AND priority <= 3)

-- Date range validation
CHECK (end_date IS NULL OR end_date >= start_date)

-- Trigger count validation
CHECK (trigger_count >= 0)
```

### 3. **Foreign Key Constraints**
```sql
-- User reference
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Flow reference (nullable)
FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
```

## Integration with Existing System

### 1. **Migration from Flow Reminder Times**
- Existing `flows.reminder_time` and `flows.reminder_level` are migrated
- New schedules are created for each flow with existing reminder settings
- Old fields are preserved for backward compatibility

### 2. **Notification Processing**
- Scheduler service queries `active_notification_schedules` view
- Uses `get_next_notification_time()` function for scheduling
- Calls `trigger_notification_schedule()` function to create notifications
- Updates `last_triggered_at` and `trigger_count`

### 3. **User Interface**
- Users can manage multiple reminder times per flow
- Quiet hours can be set globally or per flow
- Sound settings can be customized per notification type
- Timezone support for accurate scheduling

## Benefits

### 1. **Flexibility**
- Multiple reminder times per day
- Flow-specific customization
- Complex scheduling patterns
- Timezone awareness

### 2. **Scalability**
- Efficient indexing for fast queries
- Optimized for notification processing
- Supports high-volume scheduling

### 3. **Maintainability**
- Clear separation of concerns
- Normalized data structure
- Comprehensive constraints and validation

### 4. **User Experience**
- Personalized notification preferences
- Quiet hours and sound control
- Flexible scheduling options
- Accurate timezone handling

## Future Enhancements

### 1. **Advanced Scheduling**
- Recurring patterns (every 2 days, etc.)
- Holiday and exception handling
- Smart scheduling based on user behavior

### 2. **Analytics**
- Notification effectiveness tracking
- User engagement metrics
- Optimal timing recommendations

### 3. **Integration**
- Calendar integration
- External notification services
- Smart device compatibility

This design provides a robust foundation for complex notification scheduling while maintaining the flexibility to adapt to future requirements.
