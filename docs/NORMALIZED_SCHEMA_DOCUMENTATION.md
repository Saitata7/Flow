# Flow Database Schema - Normalized Design

## Overview

This document describes the comprehensive, normalized database schema for the Flow mobile application. The schema has been refactored to achieve **Third Normal Form (3NF)** with proper relationships, constraints, and indexes for production scalability.

## Schema Principles

### 1. Normalization (3NF)
- **First Normal Form**: All attributes contain atomic values
- **Second Normal Form**: No partial dependencies on composite keys
- **Third Normal Form**: No transitive dependencies

### 2. Primary Keys
- All tables use UUID primary keys with `gen_random_uuid()` default
- Surrogate keys for all relationships
- Natural keys only where appropriate (email for login)

### 3. Foreign Keys & Relationships
- Proper foreign key constraints with appropriate CASCADE rules
- ON DELETE CASCADE for dependent data
- ON DELETE SET NULL for optional references

### 4. Constraints & Indexes
- Unique constraints to prevent duplicates
- Check constraints for data validation
- Composite indexes for query optimization
- Partial indexes for soft-deleted records

## Database Tables

### Core Tables (14 total)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | Authentication & user data | Firebase UID, email, auth metadata |
| `flows` | Habit/flow definitions | Tracking types, frequencies, goals |
| `flow_entries` | Daily completion records | Symbols, mood scores, timestamps |
| `emotions` | Normalized emotion data | Categories, intensity, usage counts |
| `flow_entry_emotions` | Emotion-flow entry links | Many-to-many relationship |
| `notes` | User notes and reflections | Types, privacy, word counts |
| `plans` | Flow collections/challenges | Public/private, participants |
| `plan_participants` | Plan membership | Status tracking, join dates |
| `user_profiles` | Public profile data | Username, bio, stats, achievements |
| `user_settings` | User preferences | UI settings, notifications |
| `sync_queue` | Offline synchronization | Entity tracking, retry logic |
| `notification_templates` | Reusable templates | Categories, variables |
| `notification_schedules` | Complex notification scheduling | Multiple reminders, quiet hours, sound settings |
| `user_notifications` | User-specific notifications | Scheduling, delivery tracking |

### 1. `users` Table
**Purpose**: Core user authentication and profile data

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    photo_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT false,
    auth_provider VARCHAR(50) DEFAULT 'firebase',
    auth_metadata JSON,
    last_login_at TIMESTAMP,
    last_active_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- One-to-many with `flows` (owner_id)
- One-to-many with `flow_entries` (edited_by)
- One-to-one with `user_profiles` (user_id)
- One-to-one with `user_settings` (user_id)
- One-to-many with `notes` (created_by, edited_by)
- One-to-many with `sync_queue` (user_id)
- One-to-many with `notification_schedules` (user_id)

**Indexes**:
- `idx_users_firebase_uid` on (firebase_uid, deleted_at)
- `idx_users_email` on (email, deleted_at)
- `idx_users_status` on (status, deleted_at)
- `idx_users_last_active` on (last_active_at)

### 2. `flows` Table
**Purpose**: Habit/flow definitions and configuration

```sql
CREATE TABLE flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    tracking_type VARCHAR(20) NOT NULL CHECK (tracking_type IN ('Binary', 'Quantitative', 'Time-based')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly')),
    every_day BOOLEAN DEFAULT false,
    days_of_week JSON,
    reminder_time TIMESTAMP,
    reminder_level VARCHAR(10) CHECK (reminder_level IN ('1', '2', '3')),
    cheat_mode BOOLEAN DEFAULT false,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    goal JSON,
    progress_mode VARCHAR(20) DEFAULT 'sum' CHECK (progress_mode IN ('sum', 'average', 'latest')),
    tags JSON,
    archived BOOLEAN DEFAULT false,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- Many-to-one with `users` (owner_id)
- Many-to-one with `plans` (plan_id)
- One-to-many with `flow_entries` (flow_id)
- One-to-many with `notification_schedules` (flow_id)

**Constraints**:
- Unique constraint on (title, owner_id) where deleted_at IS NULL
- Foreign key to users table with CASCADE delete
- Foreign key to plans table with SET NULL on delete

**Indexes**:
- `idx_flows_owner_archived` on (owner_id, archived, deleted_at)
- `idx_flows_tracking_frequency` on (tracking_type, frequency, deleted_at)
- `idx_flows_plan` on (plan_id, deleted_at)

### 3. `flow_entries` Table
**Purpose**: Daily records of flow completion status

```sql
CREATE TABLE flow_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    symbol VARCHAR(10) NOT NULL CHECK (symbol IN ('+', '-', '*', '/')),
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 5),
    quantitative JSON,
    timebased JSON,
    device VARCHAR(20) DEFAULT 'api' CHECK (device IN ('mobile', 'web', 'api')),
    geo JSON,
    streak_count INTEGER DEFAULT 0,
    edited BOOLEAN DEFAULT false,
    edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    edited_at TIMESTAMP,
    timestamp TIMESTAMP DEFAULT NOW(),
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- Many-to-one with `flows` (flow_id)
- Many-to-one with `users` (edited_by)
- One-to-many with `notes` (flow_entry_id)
- Many-to-many with `emotions` (via flow_entry_emotions)

**Constraints**:
- Unique constraint on (flow_id, date) where deleted_at IS NULL
- Foreign key to flows table with CASCADE delete
- Foreign key to users table with SET NULL on delete

**Indexes**:
- `idx_flow_entries_flow_date` on (flow_id, date, deleted_at)
- `idx_flow_entries_flow_symbol` on (flow_id, symbol, deleted_at)
- `idx_flow_entries_date` on (date, deleted_at)
- `idx_flow_entries_mood` on (mood_score, deleted_at)
- `idx_flow_entries_device` on (device, deleted_at)
- `idx_flow_entries_edited` on (edited, edited_at, deleted_at)

### 4. `emotions` Table
**Purpose**: Normalized emotion data with categories and intensity

```sql
CREATE TABLE emotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    emoji VARCHAR(10),
    category VARCHAR(30),
    intensity_score INTEGER CHECK (intensity_score BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- Many-to-one with `users` (created_by)
- Many-to-many with `flow_entries` (via flow_entry_emotions)

**Constraints**:
- Unique constraint on (name, created_by) where deleted_at IS NULL

**Indexes**:
- `idx_emotions_category_active` on (category, is_active)
- `idx_emotions_created_by` on (created_by, deleted_at)

### 5. `flow_entry_emotions` Table
**Purpose**: Junction table for many-to-many relationship between flow entries and emotions

```sql
CREATE TABLE flow_entry_emotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_entry_id UUID NOT NULL REFERENCES flow_entries(id) ON DELETE CASCADE,
    emotion_id UUID NOT NULL REFERENCES emotions(id) ON DELETE CASCADE,
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 5) DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships**:
- Many-to-one with `flow_entries` (flow_entry_id)
- Many-to-one with `emotions` (emotion_id)

**Constraints**:
- Unique constraint on (flow_entry_id, emotion_id)

**Indexes**:
- `idx_flow_entry_emotions_entry` on (flow_entry_id)
- `idx_flow_entry_emotions_emotion` on (emotion_id)

### 6. `notes` Table
**Purpose**: Normalized note data linked to flow entries

```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_entry_id UUID NOT NULL REFERENCES flow_entries(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general', 'reflection', 'goal', 'obstacle', 'celebration')),
    is_private BOOLEAN DEFAULT true,
    tags JSON,
    word_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    edited_at TIMESTAMP,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- Many-to-one with `flow_entries` (flow_entry_id)
- Many-to-one with `users` (created_by, edited_by)

**Indexes**:
- `idx_notes_flow_entry` on (flow_entry_id, deleted_at)
- `idx_notes_created_by` on (created_by, deleted_at)
- `idx_notes_type` on (type, deleted_at)
- `idx_notes_created_at` on (created_at, deleted_at)

### 7. `plans` Table
**Purpose**: Collections of flows (challenges, templates, coach plans)

```sql
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    plan_kind VARCHAR(20) NOT NULL CHECK (plan_kind IN ('Challenge', 'Template', 'CoachPlan')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('Public', 'Private', 'Group')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public')),
    participants JSON,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    rules JSON,
    tags JSON,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- Many-to-one with `users` (owner_id)
- One-to-many with `flows` (plan_id)
- One-to-many with `plan_participants` (plan_id)

**Indexes**:
- `idx_plans_owner` on (owner_id, deleted_at)
- `idx_plans_visibility_status` on (visibility, status, deleted_at)
- `idx_plans_kind` on (plan_kind, deleted_at)
- `idx_plans_type_status` on (type, status, deleted_at)
- `idx_plans_dates` on (start_date, end_date, deleted_at)

### 8. `plan_participants` Table
**Purpose**: Many-to-many relationship between plans and users

```sql
CREATE TABLE plan_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed'))
);
```

**Relationships**:
- Many-to-one with `plans` (plan_id)
- Many-to-one with `users` (user_id)

**Constraints**:
- Unique constraint on (plan_id, user_id) where status = 'active'

**Indexes**:
- `idx_plan_participants_plan` on (plan_id, status)
- `idx_plan_participants_user` on (user_id, status)
- `idx_plan_participants_joined` on (plan_id, status, joined_at)

### 9. `user_profiles` Table
**Purpose**: Public-facing user profile information

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    stats JSON,
    achievements JSON,
    badges JSON,
    links JSON,
    profile_theme JSON,
    visibility JSON,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- One-to-one with `users` (user_id)

**Indexes**:
- `idx_user_profiles_user` on (user_id, deleted_at)
- `idx_user_profiles_username` on (username, deleted_at)
- `idx_user_profiles_display_name` on (display_name, deleted_at)

### 10. `user_settings` Table
**Purpose**: User preferences and application settings

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- One-to-one with `users` (user_id)

**Constraints**:
- Unique constraint on (user_id) where deleted_at IS NULL

**Indexes**:
- `idx_user_settings_user` on (user_id)
- `idx_user_settings_deleted` on (deleted_at)

### 11. `sync_queue` Table
**Purpose**: Offline-first synchronization queue

```sql
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    entity_data JSON,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,
    error_message TEXT,
    scheduled_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Relationships**:
- Many-to-one with `users` (user_id)

**Indexes**:
- `idx_sync_queue_user_status` on (user_id, status)
- `idx_sync_queue_entity` on (entity_type, entity_id, status)
- `idx_sync_queue_scheduled` on (scheduled_at, status)
- `idx_sync_queue_retry` on (status, retry_count)

### 12. `notification_templates` Table
**Purpose**: Reusable notification templates

```sql
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title_template VARCHAR(200) NOT NULL,
    body_template TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT true,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- One-to-many with `user_notifications` (template_id)

**Constraints**:
- Unique constraint on (name, category)

**Indexes**:
- `idx_notification_templates_category` on (category, is_active)

### 13. `notification_schedules` Table
**Purpose**: Complex notification scheduling per user/flow with multiple reminder times, quiet hours, and sound settings

```sql
CREATE TABLE notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
    time_of_day TIME NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('reminder', 'quiet', 'sound')),
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

**Relationships**:
- Many-to-one with `users` (user_id)
- Many-to-one with `flows` (flow_id, nullable for global notifications)

**Constraints**:
- Unique constraint on (user_id, flow_id, time_of_day, type) where deleted_at IS NULL AND enabled = true
- Check constraints for priority range, date range, and trigger count
- Foreign key to users table with CASCADE delete
- Foreign key to flows table with CASCADE delete

**Indexes**:
- `idx_notification_schedules_user` on (user_id, enabled, is_active, deleted_at)
- `idx_notification_schedules_flow` on (flow_id, enabled, is_active, deleted_at)
- `idx_notification_schedules_time_type` on (time_of_day, type, enabled, is_active)
- `idx_notification_schedules_frequency` on (frequency, days_of_week, enabled, is_active)
- `idx_notification_schedules_date_range` on (start_date, end_date, enabled, is_active)
- `idx_notification_schedules_triggered` on (last_triggered_at, trigger_count)

### 14. `user_notifications` Table
**Purpose**: User-specific notifications

```sql
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('reminder', 'achievement', 'report', 'social', 'system')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    data JSON,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    schema_version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

**Relationships**:
- Many-to-one with `users` (user_id)
- Many-to-one with `notification_templates` (template_id)

**Indexes**:
- `idx_user_notifications_user_status` on (user_id, status, deleted_at)
- `idx_user_notifications_type_status` on (type, status, deleted_at)
- `idx_user_notifications_scheduled` on (scheduled_at, status)
- `idx_user_notifications_read` on (read_at, deleted_at)

## Data Integrity Rules

### 1. Soft Deletes
- All tables include `deleted_at` timestamp for soft deletion
- Unique constraints use `WHERE deleted_at IS NULL` to allow duplicates after soft delete
- Indexes include `deleted_at` for efficient filtering

### 2. Audit Trails
- All tables include `created_at` and `updated_at` timestamps
- `schema_version` field for future schema migrations
- `edited_by` and `edited_at` fields where applicable

### 3. Data Validation
- Check constraints for enum values
- Range constraints for numeric values
- Length constraints for string fields
- JSON schema validation in application layer

### 4. Referential Integrity
- Foreign key constraints with appropriate CASCADE rules
- ON DELETE CASCADE for dependent data
- ON DELETE SET NULL for optional references

## Performance Optimizations

### 1. Indexing Strategy
- Primary indexes on foreign keys
- Composite indexes for common query patterns
- Partial indexes for soft-deleted records
- Covering indexes for frequently accessed columns

### 2. Query Optimization
- Proper JOIN strategies
- Efficient WHERE clause filtering
- Pagination support with LIMIT/OFFSET
- Cursor-based pagination for large datasets

### 3. Scalability Considerations
- UUID primary keys for distributed systems
- Horizontal partitioning potential
- Read replica support
- Connection pooling

## Security Considerations

### 1. Data Protection
- Sensitive data in separate tables
- Encryption at rest (application-level)
- Audit logging for sensitive operations
- Row-level security where applicable

### 2. Access Control
- Role-based access control (RBAC)
- Resource-level permissions
- API key management
- Rate limiting

### 3. Compliance
- GDPR compliance with soft deletes
- Data retention policies
- Export capabilities
- Privacy controls

## Migration Strategy

### 1. Backward Compatibility
- Maintain existing API contracts
- Gradual migration of data
- Feature flags for new functionality
- Rollback procedures

### 2. Data Migration
- Transform existing data to new schema
- Validate data integrity
- Handle edge cases
- Performance testing

### 3. Deployment
- Blue-green deployment
- Database migration scripts
- Health checks
- Monitoring and alerting

## Monitoring and Maintenance

### 1. Performance Monitoring
- Query performance tracking
- Index usage analysis
- Connection pool monitoring
- Resource utilization

### 2. Data Quality
- Regular integrity checks
- Orphaned record detection
- Duplicate data prevention
- Validation rule enforcement

### 3. Backup and Recovery
- Automated backups
- Point-in-time recovery
- Disaster recovery procedures
- Data retention policies

This normalized schema provides a solid foundation for the Flow application with proper relationships, constraints, and performance optimizations for production use.
