const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { NotFoundError, ConflictError, ForbiddenError } = require('../middleware/errorHandler');
const { FlowModel, FlowEntryModel } = require('../db/models');
const UserModel = require('../db/userModel');

// Helper functions
const generateId = () => uuidv4();
const getCurrentTimestamp = () => new Date().toISOString();

// Helper function to get UUID primary key from user ID (JWT auth)
const getUserIdFromJWT = async (userId) => {
  try {
    // In JWT authentication, userId is already the UUID primary key
    console.log('📋 FlowsController: Using JWT user ID:', userId);
    return userId;
  } catch (error) {
    console.error('❌ FlowsController: Error getting user ID:', error);
    throw error;
  }
};

// Create a new flow
const createFlow = async (request, reply) => {
  const { user } = request;
  const flowData = request.body;

  console.log('createFlow called with:', { user: user.id, flowData });

  // Get UUID primary key from JWT user ID
  const userId = await getUserIdFromJWT(user.id);
  console.log('createFlow: Using UUID primary key:', userId);

  // Prepare flow data for database
  const flowRecord = {
    id: generateId(),
    title: flowData.title,
    description: flowData.description,
    tracking_type: flowData.trackingType,
    frequency: flowData.frequency,
    every_day: flowData.everyDay || false,
    days_of_week: flowData.daysOfWeek,
    reminder_time: flowData.reminderTime,
    reminder_level: flowData.reminderLevel,
    cheat_mode: flowData.cheatMode || false,
    plan_id: flowData.planId,
    goal: flowData.goal,
    progress_mode: flowData.progressMode || 'sum',
    tags: flowData.tags,
    archived: false,
    visibility: flowData.visibility || 'private',
    owner_id: userId, // Use UUID primary key, not Firebase UID
    schema_version: 1,
  };

  try {
    // Create flow in database
    const flow = await FlowModel.create(flowRecord);

    // Cache in Redis for quick access
    if (request.server.redis) {
      await request.server.redis.set(`flow:${flow.id}`, flow, 3600); // 1 hour TTL
    }

    request.log.info({ flowId: flow.id, userId: user.id }, 'Flow created');

    return reply.status(201).send({
      success: true,
      data: flow,
      message: 'Flow created successfully',
    });
  } catch (error) {
    request.log.error({ error: error.message, userId: user.id }, 'Failed to create flow');
    
    // Handle specific database errors
    if (error.message.includes('database') || error.message.includes('connection')) {
      return reply.status(503).send({
        success: false,
        error: 'Database temporarily unavailable',
        message: 'Please try again later',
      });
    }
    
    throw new ConflictError('Failed to create flow');
  }
};

// Get flow by ID
const getFlow = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;

  try {
    // Try Redis cache first
    let flow = null;
    if (request.server.redis) {
      flow = await request.server.redis.get(`flow:${id}`);
    }

    // Fallback to database
    if (!flow) {
      flow = await FlowModel.findById(id);

      // Cache the result
      if (flow && request.server.redis) {
        await request.server.redis.set(`flow:${id}`, flow, 3600);
      }
    }

    if (!flow) {
      throw new NotFoundError('Flow');
    }

    // Check access permissions
    if (flow.owner_id !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
      throw new ForbiddenError('Access denied to this flow');
    }

    return reply.send({
      success: true,
      data: flow,
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId: id }, 'Failed to get flow');
    throw new ConflictError('Failed to retrieve flow');
  }
};

// Get user's flows
const getUserFlows = async (request, reply) => {
  const { user } = request;
  const { page = 1, limit = 20, archived = false, visibility } = request.query;

  try {
    // Get UUID primary key from JWT user ID
    const userId = await getUserIdFromJWT(user.id);
    console.log('getUserFlows: Using UUID primary key:', userId);
    
    // Get flows from database with status
    console.log('Getting flows for user:', userId);

    let flows;
    try {
      flows = await FlowModel.findByUserIdWithStatus(userId, {
        archived: archived === 'true',
        visibility,
      });
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      return reply.status(500).send({
        success: false,
        error: 'Database connection failed',
        message: 'Unable to retrieve flows',
      });
    }

    console.log('Raw flows from database:', flows.length, 'flows');
    console.log(
      'First flow sample:',
      flows[0]
        ? {
            id: flows[0].id,
            title: flows[0].title,
            tracking_type: flows[0].tracking_type,
            status: flows[0].status,
          }
        : 'No flows'
    );

    // Debug: Log status entries for each flow
    flows.forEach((flow, index) => {
      console.log(`Flow ${index} (${flow.title}) status entries:`, {
        statusKeys: flow.status ? Object.keys(flow.status) : 'No status',
        statusCount: flow.status ? Object.keys(flow.status).length : 0,
        sampleEntry: flow.status ? Object.entries(flow.status)[0] : 'No entries',
      });
    });

    // Transform database fields to mobile app format
    const transformedFlows = flows
      .map((flow, index) => {
        console.log(`Transforming flow ${index}:`, {
          id: flow.id,
          title: flow.title,
          tracking_type: flow.tracking_type,
          status: flow.status,
          allKeys: Object.keys(flow),
        });

        try {
          const transformed = {
            id: flow.id,
            title: flow.title,
            description: flow.description || '',
            trackingType: flow.tracking_type,
            frequency: flow.frequency,
            everyDay: flow.every_day,
            daysOfWeek: flow.days_of_week || [],
            reminderTime: flow.reminder_time,
            reminderLevel: flow.reminder_level,
            cheatMode: flow.cheat_mode,
            planId: flow.plan_id,
            goal: flow.goal,
            progressMode: flow.progress_mode,
            tags: flow.tags || [],
            archived: flow.archived,
            visibility: flow.visibility,
            ownerId: flow.owner_id,
            schemaVersion: flow.schema_version,
            createdAt: flow.created_at,
            updatedAt: flow.updated_at,
            startDate: flow.created_at, // Use created_at as startDate
            deletedAt: flow.deleted_at,

            // Legacy fields for backward compatibility
            goalLegacy: flow.goal_legacy,
            hours: flow.hours,
            minutes: flow.minutes,
            seconds: flow.seconds,
            unitText: flow.unit_text,

            // Status object with daily entries
            status: flow.status || {},
          };

          console.log(`Transformed flow ${index} successfully:`, {
            id: transformed.id,
            title: transformed.title,
            trackingType: transformed.trackingType,
            statusKeys: Object.keys(transformed.status),
            statusCount: Object.keys(transformed.status).length,
            transformedKeys: Object.keys(transformed),
          });

          return transformed;
        } catch (error) {
          console.error(`Error transforming flow ${index}:`, error);
          console.error(`Flow data that caused error:`, flow);
          return null;
        }
      })
      .filter(flow => flow !== null);

    console.log('Transformed flows:', transformedFlows.length, 'flows');
    console.log(
      'First transformed flow sample:',
      transformedFlows[0]
        ? {
            id: transformedFlows[0].id,
            title: transformedFlows[0].title,
            trackingType: transformedFlows[0].trackingType,
            status: transformedFlows[0].status,
          }
        : 'No transformed flows'
    );

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFlows = transformedFlows.slice(startIndex, endIndex);

    console.log('Paginated flows:', paginatedFlows.length, 'flows');
    console.log(
      'First paginated flow sample:',
      paginatedFlows[0]
        ? {
            id: paginatedFlows[0].id,
            title: paginatedFlows[0].title,
            trackingType: paginatedFlows[0].trackingType,
            status: paginatedFlows[0].status,
          }
        : 'No paginated flows'
    );

    const response = {
      success: true,
      data: paginatedFlows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transformedFlows.length,
        totalPages: Math.ceil(transformedFlows.length / limit),
      },
    };

    console.log('Response data:', response.data.length, 'flows');
    console.log(
      'First response flow sample:',
      response.data[0]
        ? {
            id: response.data[0].id,
            title: response.data[0].title,
            trackingType: response.data[0].trackingType,
            status: response.data[0].status,
          }
        : 'No response flows'
    );

    console.log('Full response data before sending:', JSON.stringify(response.data, null, 2));

    // Debug: Check if data is being lost in serialization
    console.log('Response data type:', typeof response.data);
    console.log('Response data length:', response.data.length);
    console.log('First item type:', typeof response.data[0]);
    console.log('First item keys:', response.data[0] ? Object.keys(response.data[0]) : 'No keys');

    // Try direct response instead of wrapped response
    console.log('Sending direct response...');
    console.log('paginatedFlows length:', paginatedFlows.length);
    console.log('paginatedFlows content:', JSON.stringify(paginatedFlows, null, 2));

    return reply.status(200).send({
      success: true,
      data: paginatedFlows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transformedFlows.length,
        totalPages: Math.ceil(transformedFlows.length / limit),
      },
    });
  } catch (error) {
    console.error('Error in getUserFlows:', error);
    request.log.error({ error: error.message, userId: user.id }, 'Failed to get user flows');
    throw new ConflictError('Failed to retrieve flows');
  }
};

// Update flow
const updateFlow = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;
  const updateData = request.body;

  try {
    // Check if flow exists and user has permission
    const existingFlow = await FlowModel.findById(id);
    if (!existingFlow) {
      throw new NotFoundError('Flow');
    }

    // Check ownership
    if (existingFlow.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('You can only update your own flows');
    }

    // Prepare update data
    const updateRecord = {};
    if (updateData.title) updateRecord.title = updateData.title;
    if (updateData.description !== undefined) updateRecord.description = updateData.description;
    if (updateData.trackingType) updateRecord.tracking_type = updateData.trackingType;
    if (updateData.frequency) updateRecord.frequency = updateData.frequency;
    if (updateData.everyDay !== undefined) updateRecord.every_day = updateData.everyDay;
    if (updateData.daysOfWeek) updateRecord.days_of_week = updateData.daysOfWeek;
    if (updateData.reminderTime) updateRecord.reminder_time = updateData.reminderTime;
    if (updateData.reminderLevel) updateRecord.reminder_level = updateData.reminderLevel;
    if (updateData.cheatMode !== undefined) updateRecord.cheat_mode = updateData.cheatMode;
    if (updateData.planId !== undefined) updateRecord.plan_id = updateData.planId;
    if (updateData.goal) updateRecord.goal = updateData.goal;
    if (updateData.progressMode) updateRecord.progress_mode = updateData.progressMode;
    if (updateData.tags) updateRecord.tags = updateData.tags;
    if (updateData.visibility) updateRecord.visibility = updateData.visibility;
    if (updateData.archived !== undefined) updateRecord.archived = updateData.archived;

    // Update flow in database
    const updatedFlow = await FlowModel.update(id, updateRecord);

    // Update Redis cache
    if (request.server.redis) {
      await request.server.redis.set(`flow:${id}`, updatedFlow, 3600);
    }

    request.log.info({ flowId: id, userId: user.id }, 'Flow updated');

    return reply.send({
      success: true,
      data: updatedFlow,
      message: 'Flow updated successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId: id }, 'Failed to update flow');
    throw new ConflictError('Failed to update flow');
  }
};

// Archive flow
const archiveFlow = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;

  const flow = flows.get(id);
  if (!flow) {
    throw new NotFoundError('Flow');
  }

  // Check ownership
  if (flow.ownerId !== user.id && user.role !== 'admin') {
    throw new ForbiddenError('You can only archive your own flows');
  }

  // Archive flow
  const archivedFlow = {
    ...flow,
    archived: true,
    updatedAt: getCurrentTimestamp(),
  };

  flows.set(id, archivedFlow);

  // Update Redis cache
  if (request.server.redis) {
    await request.server.redis.set(`flow:${id}`, archivedFlow, 3600);
  }

  request.log.info({ flowId: id, userId: user.id }, 'Flow archived');

  return reply.send({
    success: true,
    data: archivedFlow,
    message: 'Flow archived successfully',
  });
};

// Soft delete flow
const deleteFlow = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;

  try {
    // Check if flow exists and user has permission
    const existingFlow = await FlowModel.findById(id);
    if (!existingFlow) {
      throw new NotFoundError('Flow');
    }

    // Check ownership
    if (existingFlow.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('You can only delete your own flows');
    }

    // Soft delete flow using database model
    await FlowModel.softDelete(id);

    // Remove from Redis cache
    if (request.server.redis) {
      await request.server.redis.del(`flow:${id}`);
    }

    request.log.info({ flowId: id, userId: user.id }, 'Flow deleted');

    return reply.send({
      success: true,
      message: 'Flow deleted successfully',
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    request.log.error({ error: error.message, flowId: id }, 'Failed to delete flow');
    throw new ConflictError('Failed to delete flow');
  }
};

// Search flows
const searchFlows = async (request, reply) => {
  const { user } = request;
  const { q, tags, trackingType, visibility, page = 1, limit = 20 } = request.query;

  // Build search criteria
  const searchCriteria = [];

  if (q) {
    searchCriteria.push(
      flow =>
        flow.title.toLowerCase().includes(q.toLowerCase()) ||
        (flow.description && flow.description.toLowerCase().includes(q.toLowerCase()))
    );
  }

  if (tags) {
    const tagList = Array.isArray(tags) ? tags : [tags];
    searchCriteria.push(flow => flow.tags && tagList.some(tag => flow.tags.includes(tag)));
  }

  if (trackingType) {
    searchCriteria.push(flow => flow.trackingType === trackingType);
  }

  if (visibility) {
    searchCriteria.push(flow => flow.visibility === visibility);
  }

  // Filter flows
  const searchResults = Array.from(flows.values()).filter(flow => {
    // Only show non-deleted flows
    if (flow.deletedAt) return false;

    // Apply search criteria
    return searchCriteria.every(criteria => criteria(flow));
  });

  // Sort by relevance (title match first, then by creation date)
  searchResults.sort((a, b) => {
    if (q) {
      const aTitleMatch = a.title.toLowerCase().includes(q.toLowerCase());
      const bTitleMatch = b.title.toLowerCase().includes(q.toLowerCase());

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

  return reply.send({
    success: true,
    data: paginatedResults,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: searchResults.length,
      totalPages: Math.ceil(searchResults.length / limit),
    },
  });
};

// Get flow statistics
const getFlowStats = async (request, reply) => {
  const { id } = request.params;
  const { user } = request;

  const flow = flows.get(id);
  if (!flow) {
    throw new NotFoundError('Flow');
  }

  // Check access permissions
  if (flow.ownerId !== user.id && flow.visibility === 'private' && user.role !== 'admin') {
    throw new ForbiddenError('Access denied to this flow');
  }

  // Get flow entries
  const entries = Array.from(flowEntries.values()).filter(entry => entry.flowId === id);

  // Calculate statistics
  const stats = {
    totalEntries: entries.length,
    completedEntries: entries.filter(entry => entry.symbol === '+').length,
    skippedEntries: entries.filter(entry => entry.symbol === '-').length,
    bonusEntries: entries.filter(entry => entry.symbol === '+').length,
    currentStreak: calculateCurrentStreak(entries),
    longestStreak: calculateLongestStreak(entries),
    averageMoodScore: calculateAverageMoodScore(entries),
    completionRate:
      entries.length > 0
        ? (entries.filter(entry => entry.symbol === '+').length / entries.length) * 100
        : 0,
  };

  return reply.send({
    success: true,
    data: stats,
  });
};

// Helper functions for statistics
const calculateCurrentStreak = entries => {
  if (entries.length === 0) return 0;

  const sortedEntries = entries
    .filter(entry => entry.symbol === '+')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sortedEntries.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - streak);

    if (entryDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

const calculateLongestStreak = entries => {
  const completedEntries = entries
    .filter(entry => entry.symbol === '+')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (completedEntries.length === 0) return 0;

  let longestStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < completedEntries.length; i++) {
    const prevDate = new Date(completedEntries[i - 1].date);
    const currDate = new Date(completedEntries[i].date);
    const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }

  return Math.max(longestStreak, currentStreak);
};

const calculateAverageMoodScore = entries => {
  const moodEntries = entries.filter(entry => entry.moodScore);

  if (moodEntries.length === 0) return null;

  const totalScore = moodEntries.reduce((sum, entry) => sum + entry.moodScore, 0);
  return Math.round((totalScore / moodEntries.length) * 100) / 100;
};

module.exports = {
  createFlow,
  getFlow,
  getUserFlows,
  updateFlow,
  archiveFlow,
  deleteFlow,
  searchFlows,
  getFlowStats,
};
