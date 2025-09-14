# Flow Schema v2 Enhancements

This document outlines the comprehensive enhancements made to all Flow data schemas in version 2.0.0.

## Overview

All schemas have been enhanced with:
- ✅ **Global API version** constant in `packages/data-models`
- ✅ **Soft-delete support** with `deletedAt` field
- ✅ **Consistent visibility** handling across entities
- ✅ **Tags system** for filtering and searching
- ✅ **Audit fields** (`createdAt`, `updatedAt`, `schemaVersion`)

## Schema Enhancements

### 1. Flow Schema (`flow.schema.json`)

**New Fields Added:**
- `planId` (optional) - Links flow to parent plan
- `goal` - Target configuration for quantitative/time flows
  ```json
  {
    "type": "number|duration|count",
    "value": 100,
    "unit": "minutes"
  }
  ```
- `progressMode` - How to calculate progress: `"sum"`, `"average"`, `"latest"`
- `tags` - Array of strings for filtering/searching (max 10)
- `archived` - Boolean flag to keep history without cluttering UI
- `visibility` - Consistent visibility: `"private"`, `"friends"`, `"public"`
- `deletedAt` - Soft-delete timestamp

**Required Fields Updated:**
- Added `schemaVersion`, `createdAt`, `updatedAt` to required fields

### 2. FlowEntry Schema (`flowEntry.schema.json`)

**New Fields Added:**
- `id` - Unique identifier (was missing)
- `flowId` - Parent flow reference
- `moodScore` - Quantified emotion (1-5 scale)
- `device` - Platform used: `"mobile"`, `"web"`, `"api"`
- `geo` - Location data (if enabled)
  ```json
  {
    "lat": 37.7749,
    "lng": -122.4194,
    "accuracy": 10
  }
  ```
- `streakCount` - Cached streak for leaderboard performance
- `deletedAt` - Soft-delete timestamp

**Required Fields Updated:**
- Added `id`, `flowId`, `schemaVersion`, `createdAt`, `updatedAt`

### 3. Plan Schema (`plan.schema.json`)

**New Fields Added:**
- `description` - Plan description (max 500 chars)
- `planKind` - Differentiates plan types: `"Challenge"`, `"Template"`, `"CoachPlan"`
- `startDate` / `endDate` - Plan duration
- `status` - Current state: `"draft"`, `"active"`, `"archived"`
- `rules` - Comprehensive plan configuration
  ```json
  {
    "frequency": "daily|weekly|monthly",
    "scoring": {
      "method": "binary|points|streak",
      "pointsPerCompletion": 1
    },
    "cheatModePolicy": "strict|flexible|disabled",
    "maxParticipants": 100
  }
  ```
- `tags` - Array of strings for filtering/searching
- `deletedAt` - Soft-delete timestamp

**Legacy Support:**
- `type` field maintained for backward compatibility

### 4. Profile Schema (`profile.schema.json`)

**New Fields Added:**
- `username` - Unique handle for public URLs (3-20 chars, alphanumeric + _ -)
- `joinedAt` - Date user signed up
- `links` - Unified social links array
  ```json
  [
    {
      "platform": "twitter|linkedin|github|instagram|facebook|youtube|tiktok|website",
      "url": "https://...",
      "label": "Custom Label"
    }
  ]
  ```
- `achievements` - Earned achievements array
  ```json
  [
    {
      "id": "streak_7_days",
      "name": "7 Day Streak",
      "description": "Completed flows for 7 consecutive days",
      "earnedAt": "2024-01-15T10:30:00Z",
      "icon": "fire",
      "category": "streak|milestone|social|challenge|special"
    }
  ]
  ```
- `profileTheme` - Customization options
  ```json
  {
    "primaryColor": "#007AFF",
    "secondaryColor": "#5856D6",
    "bannerUrl": "https://...",
    "accentColor": "#FF9500"
  }
  ```
- `deletedAt` - Soft-delete timestamp

### 5. Settings Schema (`settings.schema.json`) - Complete Restructure

**Modular Structure:**
- `uiPreferences` - Theme, colors, text size, landing page
- `reminders` - Notification settings and quiet hours
- `privacy` - Profile visibility and location settings
- `integrations` - Wearables, external apps, social features
- `analyticsConsent` - Usage analytics and crash reporting
- `backupSettings` - Backup frequency, formats, data retention
- `flowDefaults` - Default flow configuration
- `scoring` - Statistics and insights display
- `emotionalLogging` - Emotion prompt settings
- `clinician` - Healthcare provider sharing
- `profile` - Basic user information

**New Backup & Data Management:**
- `backupFrequency` - `"daily"`, `"weekly"`, `"manual"`
- `exportFormat` - `"csv"`, `"json"`, `"pdf"`
- `dataRetention` - `"1month"`, `"3months"`, `"6months"`, `"1year"`, `"forever"`
- `autoExport` - Automatic data export

## Data Models Package

### Constants (`packages/data-models/constants.js`)
- `API_VERSION` - Global API version
- `SCHEMA_VERSIONS` - Current schema versions
- `VISIBILITY_LEVELS` - Consistent visibility options
- `PLAN_KINDS` - Plan type enumeration
- `PROGRESS_MODES` - Progress calculation methods
- `DEVICE_TYPES` - Device/platform types
- `SOCIAL_PLATFORMS` - Supported social platforms
- `BACKUP_FREQUENCIES` - Backup frequency options
- `EXPORT_FORMATS` - Data export formats
- `DATA_RETENTION_PERIODS` - Data retention options

### Base Schema (`packages/data-models/base-schema.json`)
Common properties for all entities:
- `id` - Unique identifier
- `schemaVersion` - Schema version
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `deletedAt` - Soft-delete timestamp

## Migration Strategy

### Migration Script (`scripts/migrate_schema_v2.js`)

**Migration Functions:**
- `migrateFlowToV2()` - Adds new fields with sensible defaults
- `migrateFlowEntryToV2()` - Generates IDs, adds device/geo fields
- `migratePlanToV2()` - Maps legacy types to new planKind
- `migrateProfileToV2()` - Generates usernames, converts social links
- `migrateSettingsToV2()` - Restructures into modular format

**Migration Features:**
- ✅ Backward compatibility maintained
- ✅ Sensible defaults for new fields
- ✅ Legacy field mapping
- ✅ Data validation and cleanup
- ✅ Batch processing support

### Migration Process

1. **Backup existing data** before migration
2. **Run migration script** on each entity type
3. **Validate migrated data** against new schemas
4. **Update application code** to use new fields
5. **Test thoroughly** with migrated data

## Implementation Benefits

### For Users
- **Better organization** with tags and archiving
- **Enhanced privacy** controls
- **Improved data management** with backup/export options
- **Richer profiles** with achievements and themes
- **Flexible plan types** (challenges, templates, coaching)

### For Developers
- **Consistent data structure** across all entities
- **Soft-delete support** for data recovery
- **Comprehensive audit trails** with timestamps
- **Modular settings** for easier maintenance
- **Type-safe constants** for validation

### For Analytics
- **Device tracking** for usage patterns
- **Location data** for geographic insights
- **Mood scoring** for emotional analytics
- **Streak caching** for performance
- **Comprehensive consent** management

## Next Steps

1. **Deploy migration script** to staging environment
2. **Test migration** with production data sample
3. **Update API endpoints** to handle new fields
4. **Modify UI components** to display new features
5. **Implement soft-delete** functionality
6. **Add tag management** interface
7. **Create achievement system**
8. **Build backup/export** features

## Breaking Changes

⚠️ **Settings Schema Restructure**
- Complete restructure into modules
- Requires application code updates
- Migration script handles conversion

⚠️ **Required Field Changes**
- Added `schemaVersion`, `createdAt`, `updatedAt` to all schemas
- Added `id` to FlowEntry schema
- Added `username` to Profile schema

## Compatibility

✅ **Backward Compatible**
- Legacy fields preserved where possible
- Migration script handles all conversions
- Gradual rollout supported

✅ **Forward Compatible**
- New fields are optional where appropriate
- Schema versioning enables future changes
- Extensible structure for new features
