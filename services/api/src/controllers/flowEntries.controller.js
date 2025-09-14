const { v4: uuidv4 } = require('uuid');
const { NotFoundError, ConflictError, ForbiddenError, ValidationError } = require('../middleware/errorHandler');
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
  if (!flow.cheat_mode) {
    const today = new Date().toISOString().split('T')[0];
    if (entryDate !== today) {
      throw new ForbiddenError('Cheat mode is disabled. You can only edit today\'s entries.');
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
    
    // Cache in Redis
    if (request.server.redis) {
      await request.server.redis.set(`entry:${entry.id}`, entry, 3600);
    }
    
    request.log.info({ entryId: entry.id, flowId: entryData.flowId, userId: user.id }, 'Flow entry created');
    
    return reply.status(201).send({
      success: true,
      data: entry,
      message: 'Flow entry created successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ConflictError) {
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
    // Try Redis cache first
    let entry = null;
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

// Get user's flow entries
const getUserFlowEntries = async (request, reply) => {
  const { user } = request;
  const { flowId, date, page = 1, limit = 20 } = request.query;
  
  try {
    let entries;
    
    if (flowId) {
      // Get entries for specific flow
      entries = await FlowEntryModel.findByFlowId(flowId, { date });
    } else {
      // Get all user's entries
      entries = await FlowEntryModel.findByUserId(user.id, { date });
    }
    
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
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get user flow entries');
    throw new ConflictError('Failed to retrieve flow entries');
  }
};

// Update flow entry
const updateFlowEntry = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;
  const updateData = request.body;
  
  try {
    // Check if entry exists
    const existingEntry = await FlowEntryModel.findById(id);
    if (!existingEntry) {
      throw new NotFoundError('Flow entry');
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
    
    // Update entry in database
    const updatedEntry = await FlowEntryModel.update(id, updateRecord);
    
    // Update Redis cache
    if (request.server.redis) {
      await request.server.redis.set(`entry:${id}`, updatedEntry, 3600);
    }
    
    request.log.info({ entryId: id, userId: user.id }, 'Flow entry updated');
    
    return reply.send({
      success: true,
      data: updatedEntry,
      message: 'Flow entry updated successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, entryId: id }, 'Failed to update flow entry');
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
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get today\'s entries');
    throw new ConflictError('Failed to retrieve today\'s entries');
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
          errors.push({ flowId: entryData.flowId, date: entryData.date, error: 'Entry already exists' });
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
    
    request.log.info({ 
      userId: user.id, 
      created: createdEntries.length, 
      errors: errors.length 
    }, 'Bulk create entries completed');
    
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
  deleteFlowEntry,
  getTodayEntries,
  bulkCreateEntries,
};
