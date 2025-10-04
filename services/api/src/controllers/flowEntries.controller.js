const { v4: uuidv4 } = require('uuid');
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} = require('../middleware/errorHandler');
const { FlowModel, FlowEntryModel } = require('../db/models');

// Helper functions
const generateId = () => uuidv4();
const getCurrentTimestamp = () => new Date().toISOString();

// Business logic: Check if cheat mode allows editing past entries
const canEditPastEntry = async (flowId, entryDate, userId) => {
  const flow = await FlowModel.findById(flowId);
  if (!flow) {
    throw new NotFoundError('Flow');
  }

  // Check ownership
  if (flow.owner_id !== userId) {
    throw new ForbiddenError('You can only edit entries for your own flows');
  }

  // If cheat mode is disabled, only allow editing today's entry
  // TEMPORARY: Allow editing past entries for debugging - remove this in production
  if (!flow.cheat_mode) {
    const today = new Date().toISOString().split('T')[0];
    if (entryDate !== today) {
      console.log(
        `Cheat mode check: Flow ${flowId} has cheat_mode=${flow.cheat_mode}, entryDate=${entryDate}, today=${today}`
      );
      // For debugging, allow editing past entries
      console.log('DEBUG: Allowing past entry edit despite cheat mode being disabled');
      // throw new ForbiddenError('Cheat mode is disabled. You can only edit today\'s entries.');
    }
  }

  return true;
};

// Business logic: Calculate streak count
const calculateStreakCount = async (flowId, entryDate) => {
  const entries = await FlowEntryModel.getStreakData(flowId);

  if (entries.length === 0) {
    return 1; // First entry
  }

  let streakCount = 1;
  const entryDateObj = new Date(entryDate);

  for (const entry of entries) {
    const entryDateEntry = new Date(entry.date);
    const dayDiff = Math.floor((entryDateObj - entryDateEntry) / (1000 * 60 * 60 * 24));

    if (dayDiff === streakCount) {
      streakCount++;
    } else {
      break;
    }
  }

  return streakCount;
};

// Create a new flow entry
const createFlowEntry = async (request, reply) => {
  const { user } = request;
  const entryData = request.body;

  try {
    // Validate flow exists and user has access
    const flow = await FlowModel.findById(entryData.flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('You can only create entries for your own flows');
    }

    // Check if entry already exists for this date
    const existingEntry = await FlowEntryModel.findByFlowId(flow.id, { date: entryData.date });
    if (existingEntry.length > 0) {
      throw new ConflictError('Entry already exists for this date');
    }

    // Calculate streak count
    const streakCount = await calculateStreakCount(flow.id, entryData.date);

    // Prepare entry data for database
    const entryRecord = {
      id: generateId(),
      flow_id: entryData.flowId,
      date: entryData.date,
      symbol: entryData.symbol,
      emotion: entryData.emotion,
      mood_score: entryData.moodScore,
      note: entryData.note,
      quantitative: entryData.quantitative,
      timebased: entryData.timebased,
      device: entryData.device || 'api',
      geo: entryData.geo,
      streak_count: streakCount,
      edited: false,
      timestamp: getCurrentTimestamp(),
      schema_version: 1,
    };

    // Create entry in database
    const entry = await FlowEntryModel.create(entryRecord);

    // Update flow status for mobile app compatibility
    const statusData = {
      symbol: entryData.symbol,
      emotion: entryData.emotion,
      note: entryData.note,
      quantitative: entryData.quantitative,
      timebased: entryData.timebased,
      timestamp: entry.timestamp,
    };
    await FlowModel.updateStatus(entryData.flowId, entryData.date, statusData);

    // Cache in Redis
    if (request.server.redis) {
      await request.server.redis.set(`entry:${entry.id}`, entry, 3600);
    }

    request.log.info(
      { entryId: entry.id, flowId: entryData.flowId, userId: user.id },
      'Flow entry created'
    );

    return reply.status(201).send({
      success: true,
      data: entry,
      message: 'Flow entry created successfully',
    });
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error instanceof ForbiddenError ||
      error instanceof ConflictError
    ) {
      throw error;
    }
    request.log.error({ error: error.message, userId: user.id }, 'Failed to create flow entry');
    throw new ConflictError('Failed to create flow entry');
  }
};

// Get flow entry by ID
const getFlowEntry = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;

  try {
    let entry = null;

    // Handle composite ID format (flowId_date) for mobile app compatibility
    if (id.includes('_')) {
      const [flowId, date] = id.split('_');

      // Find entry by flow_id and date
      const entries = await FlowEntryModel.findByFlowIdAndDate(flowId, date);
      if (!entries || entries.length === 0) {
        throw new NotFoundError('Flow entry');
      }
      entry = entries[0]; // Take the first match
    } else {
      // Handle direct UUID - try Redis cache first
      if (request.server.redis) {
        entry = await request.server.redis.get(`entry:${id}`);
      }

      // Fallback to database
      if (!entry) {
        entry = await FlowEntryModel.findById(id);

        // Cache the result
        if (entry && request.server.redis) {
          await request.server.redis.set(`entry:${id}`, entry, 3600);
        }
      }

      if (!entry) {
        throw new NotFoundError('Flow entry');
      }
    }

    // Check access permissions through flow
    const flow = await FlowModel.findById(entry.flow_id);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
      throw new ForbiddenError('Access denied to this flow entry');
    }

    return reply.send({
      success: true,
      data: entry,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, entryId: id }, 'Failed to get flow entry');
    throw new ConflictError('Failed to retrieve flow entry');
  }
};

// Get user's flow entries (mobile app compatible)
const getUserFlowEntries = async (request, reply) => {
  const { user } = request;
  const { flowId, date, startDate, endDate, page = 1, limit = 20 } = request.query;

  try {
    console.log('getUserFlowEntries called with:', {
      userId: user.id,
      flowId,
      date,
      startDate,
      endDate,
    });

    // For mobile app compatibility, we'll extract entries from flows' status field
    // This matches the mobile app's expectation of embedded daily entries

    let flows;
    try {
      if (flowId) {
        // Get specific flow with status
        const flow = await FlowModel.findByIdWithStatus(flowId);
        flows = flow ? [flow] : [];
      } else {
        // Get all user's flows with status
        flows = await FlowModel.findByUserIdWithStatus(user.id);
      }
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      return reply.status(500).send({
        success: false,
        error: 'Database connection failed',
        message: 'Unable to retrieve flow entries',
      });
    }

    // Extract entries from flows' status field
    const entries = [];
    console.log('Processing flows:', flows.length);
    for (const flow of flows) {
      console.log('Processing flow:', flow.id, 'status:', flow.status);
      if (flow.status && typeof flow.status === 'object') {
        for (const [entryDate, entryData] of Object.entries(flow.status)) {
          console.log('Processing entry:', entryDate, entryData);
          // Filter by date range if specified
          if (date && entryDate !== date) continue;
          if (startDate && endDate) {
            const startDateOnly = startDate.split('T')[0];
            const endDateOnly = endDate.split('T')[0];
            // Only filter if the entry date is completely outside the range
            if (entryDate < startDateOnly || entryDate > endDateOnly) {
              console.log(
                `Filtering out entry ${entryDate} - outside range ${startDateOnly} to ${endDateOnly}`
              );
              continue;
            }
          }

          const entry = {
            id: `${flow.id}_${entryDate}`,
            flowId: flow.id,
            flowTitle: flow.title,
            date: entryDate,
            ...entryData,
          };
          console.log('Created entry:', entry);
          entries.push(entry);
        }
      }
    }

    // Sort by date (newest first)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('Found entries:', entries.length);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEntries = entries.slice(startIndex, endIndex);

    return reply.send({
      success: true,
      data: paginatedEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: entries.length,
        totalPages: Math.ceil(entries.length / limit),
      },
    });
  } catch (error) {
    console.error('Error in getUserFlowEntries:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get user flow entries');
    throw new ConflictError('Failed to retrieve flow entries');
  }
};

// Update flow status (mobile app compatible)
const updateFlowStatus = async (request, reply) => {
  const { flowId, date } = request.params;
  const { user } = request;
  const statusData = request.body;

  try {
    // Check if flow exists and user owns it
    const flow = await FlowModel.findById(flowId);
    if (!flow) {
      throw new NotFoundError('Flow');
    }

    if (flow.owner_id !== user.id) {
      throw new ForbiddenError('You can only update entries for your own flows');
    }

    // Update flow status
    const updatedFlow = await FlowModel.updateStatus(flowId, date, statusData);

    return reply.send({
      success: true,
      data: updatedFlow,
      message: 'Flow status updated successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId, date }, 'Failed to update flow status');
    throw new ConflictError('Failed to update flow status');
  }
};

// Update flow entry
const updateFlowEntry = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;
  const updateData = request.body;

  try {
    let existingEntry;

    // Handle composite ID format (flowId_date) for mobile app compatibility
    if (id.includes('_')) {
      const [flowId, date] = id.split('_');

      // Find entry by flow_id and date
      const entries = await FlowEntryModel.findByFlowIdAndDate(flowId, date);
      if (!entries || entries.length === 0) {
        throw new NotFoundError('Flow entry');
      }
      existingEntry = entries[0]; // Take the first match
    } else {
      // Handle direct UUID
      existingEntry = await FlowEntryModel.findById(id);
      if (!existingEntry) {
        throw new NotFoundError('Flow entry');
      }
    }

    // Check cheat mode permissions
    await canEditPastEntry(existingEntry.flow_id, existingEntry.date, user.id);

    // Prepare update data
    const updateRecord = {};
    if (updateData.symbol) updateRecord.symbol = updateData.symbol;
    if (updateData.emotion !== undefined) updateRecord.emotion = updateData.emotion;
    if (updateData.moodScore !== undefined) updateRecord.mood_score = updateData.moodScore;
    if (updateData.note !== undefined) updateRecord.note = updateData.note;
    if (updateData.quantitative) updateRecord.quantitative = updateData.quantitative;
    if (updateData.timebased) updateRecord.timebased = updateData.timebased;
    if (updateData.device) updateRecord.device = updateData.device;
    if (updateData.geo) updateRecord.geo = updateData.geo;

    // Mark as edited
    updateRecord.edited = true;
    updateRecord.edited_by = user.id;
    updateRecord.edited_at = getCurrentTimestamp();

    // Update entry in database using the actual UUID
    const updatedEntry = await FlowEntryModel.update(existingEntry.id, updateRecord);

    // Update Redis cache
    if (request.server.redis) {
      await request.server.redis.set(`entry:${id}`, updatedEntry, 3600);
    }

    request.log.info(
      { entryId: existingEntry.id, compositeId: id, userId: user.id },
      'Flow entry updated'
    );

    return reply.send({
      success: true,
      data: updatedEntry,
      message: 'Flow entry updated successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error(
      { error: error.message, entryId: id, userId: user.id },
      'Failed to update flow entry'
    );
    throw new ConflictError('Failed to update flow entry');
  }
};

// Delete flow entry (soft delete)
const deleteFlowEntry = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;

  try {
    // Check if entry exists
    const existingEntry = await FlowEntryModel.findById(id);
    if (!existingEntry) {
      throw new NotFoundError('Flow entry');
    }

    // Check cheat mode permissions
    await canEditPastEntry(existingEntry.flow_id, existingEntry.date, user.id);

    // Soft delete entry
    await FlowEntryModel.softDelete(id);

    // Remove from Redis cache
    if (request.server.redis) {
      await request.server.redis.del(`entry:${id}`);
    }

    request.log.info({ entryId: id, userId: user.id }, 'Flow entry deleted');

    return reply.send({
      success: true,
      message: 'Flow entry deleted successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, entryId: id }, 'Failed to delete flow entry');
    throw new ConflictError('Failed to delete flow entry');
  }
};

// Get today's entries for user
const getTodayEntries = async (request, reply) => {
  const { user } = request;
  const today = new Date().toISOString().split('T')[0];

  try {
    const entries = await FlowEntryModel.findByUserId(user.id, { date: today });

    return reply.send({
      success: true,
      data: entries,
      date: today,
    });
  } catch (error) {
    request.log.error({ error: error.message, userId: user.id }, "Failed to get today's entries");
    throw new ConflictError("Failed to retrieve today's entries");
  }
};

// Bulk create entries (for data import)
const bulkCreateEntries = async (request, reply) => {
  const { user } = request;
  const { entries } = request.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new ValidationError('Entries must be a non-empty array');
  }

  try {
    const createdEntries = [];
    const errors = [];

    for (const entryData of entries) {
      try {
        // Validate flow exists and user has access
        const flow = await FlowModel.findById(entryData.flowId);
        if (!flow) {
          errors.push({ flowId: entryData.flowId, error: 'Flow not found' });
          continue;
        }

        if (flow.owner_id !== user.id && user.role !== 'admin') {
          errors.push({ flowId: entryData.flowId, error: 'Access denied' });
          continue;
        }

        // Check if entry already exists
        const existingEntry = await FlowEntryModel.findByFlowId(flow.id, { date: entryData.date });
        if (existingEntry.length > 0) {
          errors.push({
            flowId: entryData.flowId,
            date: entryData.date,
            error: 'Entry already exists',
          });
          continue;
        }

        // Calculate streak count
        const streakCount = await calculateStreakCount(flow.id, entryData.date);

        // Create entry
        const entryRecord = {
          id: generateId(),
          flow_id: entryData.flowId,
          date: entryData.date,
          symbol: entryData.symbol,
          emotion: entryData.emotion,
          mood_score: entryData.moodScore,
          note: entryData.note,
          quantitative: entryData.quantitative,
          timebased: entryData.timebased,
          device: entryData.device || 'api',
          geo: entryData.geo,
          streak_count: streakCount,
          edited: false,
          timestamp: getCurrentTimestamp(),
          schema_version: 1,
        };

        const entry = await FlowEntryModel.create(entryRecord);
        createdEntries.push(entry);
      } catch (error) {
        errors.push({ flowId: entryData.flowId, error: error.message });
      }
    }

    request.log.info(
      {
        userId: user.id,
        created: createdEntries.length,
        errors: errors.length,
      },
      'Bulk create entries completed'
    );

    return reply.send({
      success: true,
      data: {
        created: createdEntries,
        errors,
        summary: {
          total: entries.length,
          created: createdEntries.length,
          errors: errors.length,
        },
      },
      message: `Created ${createdEntries.length} entries, ${errors.length} errors`,
    });
  } catch (error) {
    request.log.error({ error: error.message, userId: user.id }, 'Failed to bulk create entries');
    throw new ConflictError('Failed to bulk create entries');
  }
};

module.exports = {
  createFlowEntry,
  getFlowEntry,
  getUserFlowEntries,
  updateFlowEntry,
  updateFlowStatus,
  deleteFlowEntry,
  getTodayEntries,
  bulkCreateEntries,
};
