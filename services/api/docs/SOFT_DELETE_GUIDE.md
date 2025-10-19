# Soft Delete Implementation Guide

## Overview

The Flow API now implements **soft delete** functionality across all entities instead of hard deletes. This provides better data integrity, audit trails, and the ability to recover accidentally deleted data.

## How Soft Delete Works

Instead of permanently removing records from the database, soft delete:
1. Sets the `deleted_at` timestamp to the current time
2. Updates the `updated_at` timestamp
3. Keeps the record in the database but marks it as deleted
4. All queries automatically exclude soft-deleted records

## Database Schema

All tables now have a `deleted_at` column:
```sql
deleted_at TIMESTAMP NULL
```

## Model Methods

Each model now includes these soft delete methods:

### FlowModel
```javascript
// Soft delete a flow
await FlowModel.softDelete(flowId);

// Find flows (automatically excludes deleted)
await FlowModel.findById(flowId);
await FlowModel.findByUserId(userId);
```

### FlowEntryModel
```javascript
// Soft delete a flow entry
await FlowEntryModel.softDelete(entryId);

// Find entries (automatically excludes deleted)
await FlowEntryModel.findById(entryId);
await FlowEntryModel.findByFlowId(flowId);
```

### UserProfileModel
```javascript
// Soft delete a user profile
await UserProfileModel.softDelete(userId);

// Find profiles (automatically excludes deleted)
await UserProfileModel.findByUserId(userId);
await UserProfileModel.findByUsername(username);
```

### UserSettingsModel
```javascript
// Soft delete user settings
await UserSettingsModel.softDelete(userId);

// Find settings (automatically excludes deleted)
await UserSettingsModel.findByUserId(userId);
```

### PlanModel
```javascript
// Soft delete a plan
await PlanModel.softDelete(planId);

// Find plans (automatically excludes deleted)
await PlanModel.findById(planId);
await PlanModel.findByUserId(userId);
```

### UserModel
```javascript
// Soft delete a user
await UserModel.softDelete(userId);

// Find users (automatically excludes deleted)
await UserModel.findById(userId);
```

## API Endpoints

All DELETE endpoints now use soft delete:

### Flows
- `DELETE /v1/flows/:id` - Soft deletes the flow
- Response: `{ success: true, message: "Flow deleted successfully" }`

### Flow Entries
- `DELETE /v1/flow-entries/:id` - Soft deletes the flow entry
- Response: `{ success: true, message: "Flow entry deleted successfully" }`

### User Profiles
- `DELETE /v1/profile` - Soft deletes the user profile
- Response: `{ success: true, message: "Profile deleted successfully" }`

## Utility Functions

Use the `SoftDeleteUtils` class for advanced operations:

```javascript
const SoftDeleteUtils = require('./utils/softDeleteUtils');

// Soft delete any table
await SoftDeleteUtils.softDelete('flows', flowId);

// Restore a soft-deleted record
await SoftDeleteUtils.restore('flows', flowId);

// Hard delete (permanent deletion)
await SoftDeleteUtils.hardDelete('flows', flowId);

// Find only soft-deleted records
const deletedFlows = await SoftDeleteUtils.findDeletedOnly('flows');

// Check if a record is soft-deleted
const isDeleted = await SoftDeleteUtils.isDeleted('flows', flowId);

// Cleanup old soft-deleted records (30+ days old)
await SoftDeleteUtils.cleanupOldDeleted('flows', 30);
```

## Query Behavior

### Automatic Exclusion
All `findById`, `findByUserId`, and similar methods automatically exclude soft-deleted records:

```javascript
// This will NOT return soft-deleted flows
const flow = await FlowModel.findById(flowId);

// This will NOT return soft-deleted entries
const entries = await FlowEntryModel.findByFlowId(flowId);
```

### Including Deleted Records
To include soft-deleted records, use the utility functions:

```javascript
// Get all flows including deleted ones
const allFlows = await SoftDeleteUtils.findAllWithDeleted('flows');

// Get only deleted flows
const deletedFlows = await SoftDeleteUtils.findDeletedOnly('flows');
```

## Cache Management

When soft deleting records, the cache is automatically cleared:

```javascript
// Soft delete removes from Redis cache
await FlowModel.softDelete(flowId);
if (request.server.redis) {
  await request.server.redis.del(`flow:${flowId}`);
}
```

## Data Recovery

Soft-deleted records can be recovered:

```javascript
// Restore a soft-deleted flow
await SoftDeleteUtils.restore('flows', flowId);

// The flow will now appear in normal queries again
const restoredFlow = await FlowModel.findById(flowId);
```

## Cleanup Strategy

Implement periodic cleanup of old soft-deleted records:

```javascript
// Cleanup records deleted more than 30 days ago
await SoftDeleteUtils.cleanupOldDeleted('flows', 30);
await SoftDeleteUtils.cleanupOldDeleted('flow_entries', 30);
await SoftDeleteUtils.cleanupOldDeleted('user_profiles', 30);
```

## Benefits

1. **Data Integrity**: No accidental data loss
2. **Audit Trail**: Track when records were deleted
3. **Recovery**: Restore accidentally deleted data
4. **Compliance**: Meet data retention requirements
5. **Analytics**: Analyze deletion patterns
6. **Debugging**: Investigate issues with deleted data

## Migration

The migration `002_add_soft_delete_columns.js` automatically adds `deleted_at` columns to all tables. Run it with:

```bash
npm run migrate
```

## Testing

All tests have been updated to work with soft delete:

```javascript
// Test soft delete
const flow = await FlowModel.create(flowData);
await FlowModel.softDelete(flow.id);

// Verify it's soft-deleted
const deletedFlow = await SoftDeleteUtils.findDeletedOnly('flows');
expect(deletedFlow).toHaveLength(1);

// Verify it's excluded from normal queries
const activeFlows = await FlowModel.findByUserId(userId);
expect(activeFlows).toHaveLength(0);
```

## Best Practices

1. **Always use soft delete** for user-generated content
2. **Implement cleanup jobs** for old deleted records
3. **Monitor deleted record counts** to prevent database bloat
4. **Use restore functionality** for data recovery
5. **Clear caches** when soft deleting records
6. **Log soft delete operations** for audit purposes

## Security Considerations

- Soft-deleted records are still in the database
- Ensure proper access controls for deleted data
- Consider data retention policies
- Implement proper cleanup procedures
- Monitor for unauthorized access to deleted records
