#!/usr/bin/env node

// Complete API Server with all endpoints
// This server includes all the endpoints the mobile app needs

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import validation utilities
const { validateUsername, validateAge } = require('./utils/profileValidation');

// Redis client for caching
let redis = null;
try {
  const redisClient = require('./redis/client');
  redis = redisClient;
  console.log('✅ Redis client initialized');
} catch (error) {
  console.log('⚠️ Redis not available, using in-memory storage only');
}

const JWT_SECRET = process.env.JWT_SECRET || 'Flow-dev-secret-key-2024';

// Persistent storage file
const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Load data from file or initialize empty arrays
let flows = [];
let flowEntries = [];

const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      flows = data.flows || [];
      flowEntries = data.flowEntries || [];
      console.log(`📁 Loaded ${flows.length} flows and ${flowEntries.length} entries from storage`);
      return data; // Return the full data object
    } else {
      console.log('📁 No existing data file, starting with empty storage');
      return { flows: [], flowEntries: [], profiles: {}, settings: {} }; // Return empty data structure
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
    flows = [];
    flowEntries = [];
    return { flows: [], flowEntries: [], profiles: {}, settings: {} }; // Return empty data structure
  }
};

const saveData = (data = null) => {
  try {
    console.log('💾 saveData called with data:', data ? 'provided' : 'null');
    const dataToSave = data || {
      profiles: {},
      settings: {},
      flows,
      flowEntries,
      lastUpdated: new Date().toISOString()
    };
    console.log('💾 Data to save structure:', Object.keys(dataToSave));
    if (dataToSave.settings) {
      console.log('💾 Settings keys:', Object.keys(dataToSave.settings));
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    console.log(`💾 Saved ${flows.length} flows and ${flowEntries.length} entries to storage`);
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
};

// Load data on startup
loadData();

const fastify = Fastify({
  logger: true
});

// Register CORS
fastify.register(cors, {
  origin: true,
  credentials: true,
});

// JWT helper functions
const generateJWTToken = (userData) => {
  return jwt.sign(
    {
      userId: userData.id,
      email: userData.email,
      emailVerified: userData.emailVerified || true,
      name: userData.name,
      picture: userData.picture,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyJWTToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.userId,
      email: decoded.email,
      emailVerified: decoded.emailVerified || false,
      name: decoded.name,
      picture: decoded.picture,
      provider: 'jwt',
    };
  } catch (error) {
    console.log('JWT verification failed:', error.message);
    return null;
  }
};

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Complete API server is working'
  };
});

// Debug JWT verification
fastify.post('/debug-jwt', async (request, reply) => {
  try {
    const { token } = request.body;
    
    if (!token) {
      return reply.status(400).send({
        success: false,
        error: 'Token is required',
        message: 'Invalid request data'
      });
    }

    console.log('🔍 Debug JWT verification:');
    console.log('  Token length:', token.length);
    console.log('  Token preview:', token.substring(0, 30) + '...');
    
    // Test direct JWT verification
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'Flow-dev-secret-key-2024';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('  Direct JWT verification: SUCCESS');
      console.log('  Decoded payload:', decoded);
      
      return {
        success: true,
        data: {
          valid: true,
          user: {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            emailVerified: decoded.emailVerified,
            provider: 'jwt'
          },
          decoded: decoded
        },
        message: 'Token is valid'
      };
    } catch (jwtError) {
      console.log('  Direct JWT verification: FAILED');
      console.log('  Error:', jwtError.message);
      
      return {
        success: true,
        data: {
          valid: false,
          user: null,
          error: jwtError.message
        },
        message: 'Token is invalid or expired'
      };
    }
  } catch (error) {
    console.error('Debug JWT error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Debug JWT failed'
    });
  }
});

// Auth endpoints
fastify.post('/v1/auth/login-simple', {
  schema: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string' },
        name: { type: 'string' },
      },
    },
  },
}, async (request, reply) => {
  try {
    const { email, name } = request.body;
    
    // Create consistent user ID based on email hash to ensure same user gets same ID
    const crypto = require('crypto');
    const emailHash = crypto.createHash('md5').update(email).digest('hex');
    const userId = `user-${emailHash}`;
    
    // Create user data with consistent ID for proper user persistence
    const userData = {
      id: userId, // Consistent user ID based on email
      email: email,
      name: name || email.split('@')[0],
      emailVerified: true,
      provider: 'jwt',
    };
    
    // Generate JWT token
    const token = generateJWTToken(userData);
    
    console.log(`✅ Login successful for ${email} with consistent user ID: ${userId}`);
    
    return {
      success: true,
      data: {
        token,
        user: userData,
      },
      message: 'Login successful'
    };
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Login failed'
    });
  }
});

fastify.post('/v1/auth/verify-simple', {
  schema: {
    body: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string' },
      },
    },
  },
}, async (request, reply) => {
  try {
    const { token } = request.body;
    
    if (!token) {
      return reply.status(400).send({
        success: false,
        error: 'Token is required',
        message: 'Invalid request data'
      });
    }

    // Verify the token
    const user = verifyJWTToken(token);

    return {
      success: true,
      data: {
        valid: !!user,
        user: user || null,
      },
      message: user ? 'Token is valid' : 'Token is invalid or expired'
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Token verification failed'
    });
  }
});

// Authentication middleware
const requireAuth = async (request, reply) => {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      message: 'Please provide a valid JWT token'
    });
  }
  
  const token = authHeader.substring(7);
  const user = verifyJWTToken(token);
  
  if (!user) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid token',
      message: 'Please provide a valid JWT token'
    });
  }
  
  request.user = user;
};

// Flows endpoints
fastify.get('/v1/flows', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    // Return actual flows stored in memory
    const userFlows = flows.filter(flow => flow.ownerId === request.user.id);
    
    console.log('GET /v1/flows - Returning', userFlows.length, 'flows for user', request.user.id);
    console.log('Flows:', userFlows.map(f => ({ id: f.id, title: f.title })));
    
    // Merge flow entries into flows status objects
    const flowsWithEntries = userFlows.map(flow => {
      const flowEntriesForFlow = flowEntries.filter(entry => entry.flowId === flow.id && entry.ownerId === request.user.id);
      
      // Convert flow entries to status object format
      const status = {};
      flowEntriesForFlow.forEach(entry => {
        status[entry.date] = {
          symbol: entry.symbol,
          emotion: entry.emotion,
          moodScore: entry.moodScore,
          note: entry.note,
          quantitative: entry.quantitative,
          timebased: entry.timebased,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        };
      });
      
      return {
        ...flow,
        status: status
      };
    });
    
    console.log('GET /v1/flows - Merged entries for flows:', flowsWithEntries.map(f => ({ 
      id: f.id, 
      title: f.title, 
      statusCount: Object.keys(f.status).length,
      statusKeys: Object.keys(f.status)
    })));
    
    return {
      success: true,
      data: flowsWithEntries,
      message: 'Flows retrieved successfully'
    };
  } catch (error) {
    console.error('Get flows error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve flows'
    });
  }
});

fastify.post('/v1/flows', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { title, description, trackingType, frequency, goal, unitText } = request.body;
    
    const newFlow = {
      id: `flow-${Date.now()}`,
      title: title || 'New Flow',
      description: description || '',
      trackingType: trackingType || 'Binary',
      frequency: frequency || 'Daily',
      goal: goal || 1,
      unitText: unitText || '',
      ownerId: request.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: {}, // Initialize empty status object
      // Set default scheduling properties for mobile app compatibility
      everyDay: (frequency || 'Daily') === 'Daily' ? true : false,
      daysOfWeek: (frequency || 'Daily') === 'Daily' ? [0, 1, 2, 3, 4, 5, 6] : []
    };
    
    // Store the flow in memory
    flows.push(newFlow);
    
    // Save data to file
    saveData();
    
    // No cache invalidation needed - using real-time stats
    console.log('Flow entry created - stats will be calculated in real-time');
    
    console.log('Created flow:', newFlow);
    console.log('Total flows in memory:', flows.length);
    
    return {
      success: true,
      data: newFlow,
      message: 'Flow created successfully'
    };
  } catch (error) {
    console.error('Create flow error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to create flow'
    });
  }
});

// Get single flow
fastify.get('/v1/flows/:flowId', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { flowId } = request.params;
    const flow = flows.find(f => f.id === flowId && f.ownerId === request.user.id);
    
    if (!flow) {
      return reply.status(404).send({
        success: false,
        error: 'Flow not found',
        message: 'The specified flow does not exist'
      });
    }
    
    // Merge flow entries into flow status object
    const flowEntriesForFlow = flowEntries.filter(entry => entry.flowId === flowId && entry.ownerId === request.user.id);
    
    // Convert flow entries to status object format
    const status = {};
    flowEntriesForFlow.forEach(entry => {
      status[entry.date] = {
        symbol: entry.symbol,
        emotion: entry.emotion,
        moodScore: entry.moodScore,
        note: entry.note,
        quantitative: entry.quantitative,
        timebased: entry.timebased,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
    });
    
    const flowWithEntries = {
      ...flow,
      status: status
    };
    
    console.log('GET /v1/flows/:flowId - Returning flow:', flow.title, 'with', Object.keys(status).length, 'entries');
    
    return {
      success: true,
      data: flowWithEntries,
      message: 'Flow retrieved successfully'
    };
  } catch (error) {
    console.error('Get flow error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve flow'
    });
  }
});

// Update flow
fastify.put('/v1/flows/:flowId', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { flowId } = request.params;
    const updates = request.body;
    
    const flowIndex = flows.findIndex(f => f.id === flowId && f.ownerId === request.user.id);
    if (flowIndex === -1) {
      return reply.status(404).send({
        success: false,
        error: 'Flow not found',
        message: 'The specified flow does not exist'
      });
    }
    
    const updatedFlow = {
      ...flows[flowIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    flows[flowIndex] = updatedFlow;
    saveData();
    
    console.log('Updated flow:', updatedFlow.title);
    
    return {
      success: true,
      data: updatedFlow,
      message: 'Flow updated successfully'
    };
  } catch (error) {
    console.error('Update flow error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to update flow'
    });
  }
});

// Flow entries endpoints
fastify.get('/v1/flow-entries', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { startDate, endDate } = request.query;
    
    // Return actual flow entries from storage
    let userEntries = flowEntries.filter(entry => entry.ownerId === request.user.id);
    
    // Filter by date range if provided
    if (startDate && endDate) {
      userEntries = userEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return entryDate >= start && entryDate <= end;
      });
    }
    
    console.log('GET /v1/flow-entries - Returning', userEntries.length, 'entries for user', request.user.id);
    console.log('Entries:', userEntries.map(e => ({ id: e.id, flowId: e.flowId, date: e.date })));
    
    return {
      success: true,
      data: userEntries,
      message: 'Flow entries retrieved successfully'
    };
  } catch (error) {
    console.error('Get flow entries error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve flow entries'
    });
  }
});

fastify.post('/v1/flow-entries', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { flowId, date, symbol, emotion, moodScore, note, quantitative, timebased } = request.body;
    
    const entry = {
      id: `entry-${Date.now()}`,
      flowId: flowId || 'flow-1',
      date: date || new Date().toISOString().split('T')[0],
      symbol: symbol || '+',
      emotion: emotion || 'neutral',
      moodScore: moodScore || 3,
      note: note || '',
      quantitative: quantitative || null,
      timebased: timebased || null,
      ownerId: request.user.id,
      createdAt: new Date().toISOString(),
    };
    
    // Store the entry in memory
    flowEntries.push(entry);
    
    // Update the flow's status for the specific date
    const flow = flows.find(f => f.id === flowId);
    if (flow) {
      if (!flow.status) flow.status = {};
      flow.status[date] = {
        symbol: symbol || '+',
        emotion: emotion || 'neutral',
        note: note || '',
        quantitative: quantitative || null,
        timebased: timebased || null,
        timestamp: entry.createdAt
      };
    }
    
    // Save data to file
    saveData();
    
    // No cache invalidation needed - using real-time stats
    console.log('Flow entry created - stats will be calculated in real-time');
    
    console.log('Created flow entry:', entry);
    console.log('Total entries in memory:', flowEntries.length);
    
    return {
      success: true,
      data: entry,
      message: 'Flow entry created successfully'
    };
  } catch (error) {
    console.error('Create flow entry error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to create flow entry'
    });
  }
});

// Update flow entry
fastify.put('/v1/flow-entries/:id', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { id } = request.params;
    const { symbol, emotion, moodScore, note, quantitative, timebased } = request.body;
    
    let entryIndex = -1;
    let existingEntry = null;
    
    // Handle composite ID format (flowId_date) for mobile app compatibility
    if (id.includes('_')) {
      const [flowId, date] = id.split('_');
      console.log('PUT /v1/flow-entries - Composite ID detected:', { flowId, date });
      
      // Find entry by flowId and date
      entryIndex = flowEntries.findIndex(entry => 
        entry.flowId === flowId && 
        entry.date === date && 
        entry.ownerId === request.user.id
      );
      
      if (entryIndex !== -1) {
        existingEntry = flowEntries[entryIndex];
        console.log('PUT /v1/flow-entries - Found existing entry:', existingEntry.id);
      } else {
        console.log('PUT /v1/flow-entries - No existing entry found, will create new one');
      }
    } else {
      // Handle direct entry ID
      entryIndex = flowEntries.findIndex(entry => entry.id === id && entry.ownerId === request.user.id);
      if (entryIndex !== -1) {
        existingEntry = flowEntries[entryIndex];
      }
    }
    
    // If entry doesn't exist, create a new one
    if (entryIndex === -1) {
      console.log('PUT /v1/flow-entries - Creating new entry for composite ID:', id);
      
      // Extract flowId and date from composite ID
      const [flowId, date] = id.includes('_') ? id.split('_') : [null, null];
      
      if (!flowId || !date) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid entry ID format',
          message: 'Entry ID must be in format flowId_date or a valid entry ID'
        });
      }
      
      // Create new entry
      const newEntry = {
        id: `entry-${Date.now()}`,
        flowId: flowId,
        date: date,
        symbol: symbol || '+',
        emotion: emotion || 'neutral',
        moodScore: moodScore || 3,
        note: note || '',
        quantitative: quantitative || null,
        timebased: timebased || null,
        ownerId: request.user.id,
        createdAt: new Date().toISOString()
      };
      
      flowEntries.push(newEntry);
      existingEntry = newEntry;
      entryIndex = flowEntries.length - 1;
      
      console.log('PUT /v1/flow-entries - Created new entry:', newEntry.id);
    } else {
      // Update existing entry
      console.log('PUT /v1/flow-entries - Updating existing entry:', existingEntry.id);
    }
    
    // Update the entry
    const updatedEntry = {
      ...existingEntry,
      symbol: symbol || existingEntry.symbol,
      emotion: emotion !== undefined ? emotion : existingEntry.emotion,
      moodScore: moodScore !== undefined ? moodScore : existingEntry.moodScore,
      note: note !== undefined ? note : existingEntry.note,
      quantitative: quantitative !== undefined ? quantitative : existingEntry.quantitative,
      timebased: timebased !== undefined ? timebased : existingEntry.timebased,
      updatedAt: new Date().toISOString(),
      edited: true,
      editedBy: request.user.id,
    };
    
    // Update the entry in memory
    flowEntries[entryIndex] = updatedEntry;
    
    // Update the flow's status for the specific date
    const flow = flows.find(f => f.id === existingEntry.flowId);
    if (flow && flow.status && flow.status[existingEntry.date]) {
      flow.status[existingEntry.date] = {
        ...flow.status[existingEntry.date],
        symbol: updatedEntry.symbol,
        emotion: updatedEntry.emotion,
        note: updatedEntry.note,
        quantitative: updatedEntry.quantitative,
        timebased: updatedEntry.timebased,
        timestamp: updatedEntry.updatedAt
      };
    }
    
    // Save data to file
    saveData();
    
    console.log('Updated flow entry:', updatedEntry);
    
    return {
      success: true,
      data: updatedEntry,
      message: 'Flow entry updated successfully'
    };
  } catch (error) {
    console.error('Update flow entry error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to update flow entry'
    });
  }
});

// Delete flow entry
fastify.delete('/v1/flow-entries/:id', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { id } = request.params;
    
    // Find the entry
    const entryIndex = flowEntries.findIndex(entry => entry.id === id && entry.ownerId === request.user.id);
    
    if (entryIndex === -1) {
      return reply.status(404).send({
        success: false,
        error: 'Flow entry not found',
        message: 'The specified flow entry does not exist'
      });
    }
    
    const deletedEntry = flowEntries[entryIndex];
    
    // Remove from array
    flowEntries.splice(entryIndex, 1);
    
    // Update flow status if needed
    const flow = flows.find(f => f.id === deletedEntry.flowId);
    if (flow && flow.status && flow.status[deletedEntry.date]) {
      delete flow.status[deletedEntry.date];
    }
    
    // Save data to file
    saveData();
    
    console.log('Deleted flow entry:', deletedEntry.id);
    
    return {
      success: true,
      message: 'Flow entry deleted successfully'
    };
  } catch (error) {
    console.error('Delete flow entry error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to delete flow entry'
    });
  }
});

// General stats endpoint (mobile app compatibility)
fastify.get('/v1/stats', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    // DISABLE Redis caching for real-time stats
    console.log('GET /v1/stats - Calculating REAL-TIME stats for user:', request.user.id);
    
    // Calculate stats from data
    const userFlows = flows.filter(flow => flow.ownerId === request.user.id);
    const userEntries = flowEntries.filter(entry => entry.ownerId === request.user.id);
    
    const totalFlows = userFlows.length;
    const totalEntries = userEntries.length;
    const completedEntries = userEntries.filter(entry => entry.symbol === '+').length;
    const overallCompletionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
    
    // Calculate average mood score
    const moodEntries = userEntries.filter(entry => entry.moodScore && entry.moodScore > 0);
    const averageMoodScore = moodEntries.length > 0 
      ? Math.round((moodEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / moodEntries.length) * 10) / 10
      : 0;
    
    // Get last activity date
    const lastActivityDate = userEntries.length > 0 
      ? userEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
      : null;
    
    const stats = {
      totalFlows,
      totalEntries,
      completedEntries,
      overallCompletionRate,
      averageMoodScore,
      lastActivityDate,
      calculatedAt: new Date().toISOString()
    };
    
    // DISABLE Redis caching for real-time stats
    console.log('GET /v1/stats - Returning REAL-TIME stats (no caching) for user:', request.user.id);
    
    console.log('GET /v1/stats - Returning calculated stats for user:', request.user.id);
    
    return {
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    };
  } catch (error) {
    console.error('Get stats error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve statistics'
    });
  }
});

// Stats endpoints
fastify.get('/v1/stats/flows/:flowId', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { flowId } = request.params;
    const flow = flows.find(f => f.id === flowId && f.ownerId === request.user.id);
    
    if (!flow) {
      return reply.status(404).send({
        success: false,
        error: 'Flow not found',
        message: 'The specified flow does not exist'
      });
    }
    
    // Calculate basic stats from flow entries
    const flowEntriesForFlow = flowEntries.filter(entry => entry.flowId === flowId);
    const completedEntries = flowEntriesForFlow.filter(entry => entry.symbol === '+').length;
    const totalEntries = flowEntriesForFlow.length;
    const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
    
    const stats = {
      flowId: flowId,
      flowTitle: flow.title,
      totalEntries: totalEntries,
      completedEntries: completedEntries,
      completionRate: completionRate,
      currentStreak: 0, // Calculate based on consecutive completed entries
      longestStreak: 0, // Calculate based on flow entries
      averageMoodScore: flowEntriesForFlow.length > 0 ? 
        flowEntriesForFlow.reduce((sum, entry) => sum + (entry.moodScore || 0), 0) / flowEntriesForFlow.length : 0,
      lastEntryDate: flowEntriesForFlow.length > 0 ? 
        flowEntriesForFlow.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt
    };
    
    console.log('GET /v1/stats/flows/:flowId - Returning stats for flow:', flow.title);
    
    return {
      success: true,
      data: stats,
      message: 'Flow stats retrieved successfully'
    };
  } catch (error) {
    console.error('Get flow stats error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve flow stats'
    });
  }
});

fastify.get('/v1/stats/overall', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const userFlows = flows.filter(flow => flow.ownerId === request.user.id);
    const userEntries = flowEntries.filter(entry => entry.ownerId === request.user.id);
    
    const totalFlows = userFlows.length;
    const totalEntries = userEntries.length;
    const completedEntries = userEntries.filter(entry => entry.symbol === '+').length;
    const overallCompletionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;
    
    const stats = {
      totalFlows: totalFlows,
      totalEntries: totalEntries,
      completedEntries: completedEntries,
      overallCompletionRate: overallCompletionRate,
      averageMoodScore: userEntries.length > 0 ? 
        userEntries.reduce((sum, entry) => sum + (entry.moodScore || 0), 0) / userEntries.length : 0,
      lastActivityDate: userEntries.length > 0 ? 
        userEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null,
      calculatedAt: new Date().toISOString()
    };
    
    console.log('GET /v1/stats/overall - Returning overall stats for user:', request.user.id);
    
    return {
      success: true,
      data: stats,
      message: 'Overall stats retrieved successfully'
    };
  } catch (error) {
    console.error('Get overall stats error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve overall stats'
    });
  }
});

// Username availability check endpoint
fastify.get('/v1/auth/check-username/:username', {
  schema: {
    params: {
      type: 'object',
      properties: {
        username: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { username } = request.params;
    
    // Validate username format
    if (!username || username.length < 3) {
      return reply.status(400).send({
        success: false,
        error: 'Username must be at least 3 characters long',
        data: { available: false }
      });
    }
    
    if (username.length > 20) {
      return reply.status(400).send({
        success: false,
        error: 'Username must be less than 20 characters',
        data: { available: false }
      });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return reply.status(400).send({
        success: false,
        error: 'Username can only contain letters, numbers, and underscores',
        data: { available: false }
      });
    }
    
    if (username.startsWith('_') || username.endsWith('_')) {
      return reply.status(400).send({
        success: false,
        error: 'Username cannot start or end with underscore',
        data: { available: false }
      });
    }
    
    // Check if username is already taken
    const data = loadData();
    const profiles = data.profiles || {};
    
    // Check if any existing profile has this username
    const usernameExists = Object.values(profiles).some(profile => 
      profile.username && profile.username.toLowerCase() === username.toLowerCase()
    );
    
    console.log(`🔍 Username check for "${username}": ${usernameExists ? 'taken' : 'available'}`);
    
    return {
      success: true,
      data: {
        available: !usernameExists,
        username: username
      },
      message: usernameExists ? 'Username is already taken' : 'Username is available'
    };
  } catch (error) {
    console.error('Username check error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      data: { available: false }
    });
  }
});

// Profile endpoints
fastify.get('/v1/profile', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    console.log('GET /v1/profile - Getting profile for user:', request.user.id);
    
    // Get profile from persistent storage
    const profileData = loadData();
    const userProfile = profileData.profiles?.[request.user.id] || {
      id: request.user.id,
      email: request.user.email,
      firstName: request.user.name || 'John',
      lastName: 'Doe',
      phoneNumber: '',
      dateOfBirth: null,
      gender: '',
      race: '',
      ethnicity: '',
      disability: '',
      preferredLanguage: 'en',
      country: '',
      timezone: '',
      healthGoals: [],
      fitnessLevel: '',
      medicalConditions: '',
      profileVisibility: 'private',
      dataSharing: {
        analytics: true,
        research: false,
        marketing: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return reply.send({
      success: true,
      data: userProfile,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
});

fastify.put('/v1/profile', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const profileData = request.body;
    console.log('PUT /v1/profile - Updating profile for user:', request.user.id);
    console.log('PUT /v1/profile - Profile data:', profileData);
    
    // Validate required fields (email removed as it's not editable)
    const requiredFields = ['firstName', 'lastName', 'username', 'dateOfBirth', 'gender'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      return reply.status(400).send({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Validate username format using utility function
    const usernameValidation = validateUsername(profileData.username);
    if (!usernameValidation.valid) {
      return reply.status(400).send({
        success: false,
        error: usernameValidation.message
      });
    }
    
    // Check username uniqueness and load existing data
    const data = loadData();
    const profiles = data.profiles || {};
    
    // Check if username is already taken by another user
    const usernameExists = Object.entries(profiles).some(([userId, profile]) => 
      userId !== request.user.id && 
      profile.username && 
      profile.username.toLowerCase() === username.toLowerCase()
    );
    
    if (usernameExists) {
      return reply.status(400).send({
        success: false,
        error: 'Username is already taken by another user'
      });
    }
    
    // Validate date of birth and age restriction using utility function
    const ageValidation = validateAge(profileData.dateOfBirth);
    if (!ageValidation.valid) {
      return reply.status(400).send({
        success: false,
        error: ageValidation.message
      });
    }
    if (!data.profiles) {
      data.profiles = {};
    }
    
    // Update profile in persistent storage
    const existingProfile = data.profiles[request.user.id] || {};
    const updatedProfile = {
      id: request.user.id,
      email: existingProfile.email || profileData.email, // Preserve existing email, don't update it
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      username: profileData.username,
      phoneNumber: profileData.phoneNumber || '',
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      race: profileData.race || '',
      ethnicity: profileData.ethnicity || '',
      disability: profileData.disability || '',
      preferredLanguage: profileData.preferredLanguage || 'en',
      country: profileData.country || '',
      timezone: profileData.timezone || '',
      healthGoals: profileData.healthGoals || [],
      fitnessLevel: profileData.fitnessLevel || '',
      medicalConditions: profileData.medicalConditions || '',
      profileVisibility: profileData.profileVisibility || 'private',
      dataSharing: profileData.dataSharing || {
        analytics: true,
        research: false,
        marketing: false
      },
      createdAt: data.profiles[request.user.id]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to persistent storage
    data.profiles[request.user.id] = updatedProfile;
    saveData(data);
    
    console.log('PUT /v1/profile - Profile updated successfully');
    
    return reply.send({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

fastify.get('/v1/profile/stats', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    console.log('GET /v1/profile/stats - Getting profile stats for user:', request.user.id);
    
    // Mock profile stats - in production this would come from database
    const stats = {
      totalFlows: 3,
      completedEntries: 15,
      currentStreak: 5,
      longestStreak: 12,
      achievements: 2,
      badges: 1,
      joinDate: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    
    return reply.send({
      success: true,
      data: stats,
      message: 'Profile stats retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting profile stats:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve profile stats'
    });
  }
});

// Profile completeness check endpoint
fastify.get('/v1/profile/completeness', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    console.log('GET /v1/profile/completeness - Checking profile completeness for user:', request.user.id);
    
    const data = loadData();
    const profiles = data.profiles || {};
    const userProfile = profiles[request.user.id];
    
    // Import the validation utility
    const { canCreateFlows } = require('./src/utils/profileValidation');
    
    // Check profile completeness
    const validation = canCreateFlows(request.user, userProfile);
    
    return reply.send({
      success: true,
      data: {
        canCreateFlows: validation.canCreateFlows,
        message: validation.message,
        missingFields: validation.missingFields,
        profileComplete: validation.canCreateFlows
      },
      message: 'Profile completeness checked successfully'
    });
  } catch (error) {
    console.error('Error checking profile completeness:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to check profile completeness'
    });
  }
});

// Settings endpoints
fastify.get('/v1/settings', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    console.log('GET /v1/settings - Getting settings for user:', request.user.id);
    
    // Load existing data to get user-specific settings
    const data = loadData();
    const defaultSettings = {
      theme: 'light',
      notifications: true,
      language: 'en',
      dataPrivacy: {
        cloudBackup: false
      },
      timezone: {
        autoTimezone: true,
        manualTimezone: 'UTC'
      }
    };
    
    const storedSettings = data.settings?.[request.user.id] || {};
    const userSettings = {
      ...defaultSettings,
      ...storedSettings,
      // Ensure nested objects are properly merged
      dataPrivacy: {
        ...defaultSettings.dataPrivacy,
        ...storedSettings.dataPrivacy
      },
      timezone: {
        ...defaultSettings.timezone,
        ...storedSettings.timezone
      }
    };
    
    console.log('GET /v1/settings - Returning settings:', userSettings);
    
    return {
      success: true,
      data: userSettings,
      message: 'Settings retrieved successfully'
    };
  } catch (error) {
    console.error('Get settings error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve settings'
    });
  }
});

fastify.put('/v1/settings', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    console.log('PUT /v1/settings - Updating settings for user:', request.user.id);
    console.log('PUT /v1/settings - Settings data:', request.body);
    
    // Load existing data
    const data = loadData();
    console.log('PUT /v1/settings - Loaded data structure:', Object.keys(data));
    console.log('PUT /v1/settings - Existing settings:', data.settings);
    if (!data.settings) {
      data.settings = {};
    }
    
    // Update user settings
    data.settings[request.user.id] = {
      ...data.settings[request.user.id],
      ...request.body,
      userId: request.user.id,
      updatedAt: new Date().toISOString()
    };
    
    // Save to persistent storage
    saveData(data);
    
    console.log('PUT /v1/settings - Settings updated successfully');
    console.log('PUT /v1/settings - Saved data structure:', JSON.stringify(data, null, 2));
    
    return {
      success: true,
      data: data.settings[request.user.id],
      message: 'Settings updated successfully'
    };
  } catch (error) {
    console.error('Update settings error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to update settings'
    });
  }
});

// Stats endpoints
fastify.get('/v1/stats/users/:userId', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { userId } = request.params;
    
    // Mock stats data
    const stats = {
      totalFlows: 2,
      totalEntries: 15,
      completedEntries: 12,
      currentStreak: 5,
      longestStreak: 10,
      completionRate: 0.8,
      joinDate: new Date().toISOString(),
      username: request.user.name,
      displayName: request.user.name,
    };
    
    return {
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully'
    };
  } catch (error) {
    console.error('Get stats error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve statistics'
    });
  }
});

// Plans endpoints
fastify.get('/v1/plans', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    // Mock plans data
    const plans = [
      {
        id: 'plan-1',
        title: 'Morning Routine',
        description: 'Daily morning habits',
        flows: ['flow-1', 'flow-2'],
        ownerId: request.user.id,
        createdAt: new Date().toISOString(),
      }
    ];
    
    return {
      success: true,
      data: plans,
      message: 'Plans retrieved successfully'
    };
  } catch (error) {
    console.error('Get plans error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve plans'
    });
  }
});

// Activities endpoints
fastify.get('/v1/activities/stats', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    // Mock activities stats
    const stats = {
      totalActivities: 25,
      completedToday: 3,
      weeklyGoal: 21,
      monthlyGoal: 84,
      currentStreak: 5,
      longestStreak: 12,
    };
    
    return {
      success: true,
      data: stats,
      message: 'Activity statistics retrieved successfully'
    };
  } catch (error) {
    console.error('Get activities stats error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve activity statistics'
    });
  }
});

// Notifications endpoints
fastify.get('/v1/notifications', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    // Mock notifications data
    const notifications = [
      {
        id: 'notif-1',
        title: 'Daily Reminder',
        message: 'Time to log your daily activities!',
        type: 'reminder',
        read: false,
        userId: request.user.id,
        createdAt: new Date().toISOString(),
      }
    ];
    
    return {
      success: true,
      data: notifications,
      message: 'Notifications retrieved successfully'
    };
  } catch (error) {
    console.error('Get notifications error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve notifications'
    });
  }
});

// Notification endpoints
fastify.get('/v1/notifications/settings', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    // Mock notification settings
    const settings = {
      enabled: true,
      reminderTime: '09:00',
      dailyReminders: true,
      weeklyReports: true,
      achievements: true,
      userId: request.user.id,
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: settings,
      message: 'Notification settings retrieved successfully'
    };
  } catch (error) {
    console.error('Get notification settings error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve notification settings'
    });
  }
});

fastify.get('/v1/notifications/logs', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { startDate, endDate, limit = 50 } = request.query;
    
    // Mock notification logs
    const logs = [
      {
        id: 'log-1',
        type: 'daily_reminder',
        title: 'Daily Habit Reminder',
        message: 'Time to check in on your habits!',
        sentAt: new Date().toISOString(),
        status: 'sent',
        userId: request.user.id
      }
    ];
    
    return {
      success: true,
      data: logs,
      message: 'Notification logs retrieved successfully'
    };
  } catch (error) {
    console.error('Get notification logs error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to retrieve notification logs'
    });
  }
});

fastify.post('/v1/notifications/registerDevice', { preHandler: [requireAuth] }, async (request, reply) => {
  try {
    const { deviceToken, platform, deviceId } = request.body;
    
    // Mock device registration
    const device = {
      id: `device-${Date.now()}`,
      deviceToken: deviceToken,
      platform: platform || 'ios',
      deviceId: deviceId,
      userId: request.user.id,
      registeredAt: new Date().toISOString(),
      active: true
    };
    
    console.log('Registered device:', device);
    
    return {
      success: true,
      data: device,
      message: 'Device registered successfully'
    };
  } catch (error) {
    console.error('Register device error:', error);
    return reply.status(500).send({
      success: false,
      error: error.message,
      message: 'Failed to register device'
    });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 4003, host: '0.0.0.0' });
    console.log('🚀 Complete API server running on http://0.0.0.0:4003');
    console.log('📋 Available endpoints:');
    console.log('  - GET /health - Health check');
    console.log('  - POST /v1/auth/login-simple - Login');
    console.log('  - POST /v1/auth/verify-simple - Verify token');
    console.log('  - GET /v1/flows - Get flows (auth required)');
    console.log('  - POST /v1/flows - Create flow (auth required)');
    console.log('  - GET /v1/flow-entries - Get flow entries (auth required)');
    console.log('  - POST /v1/flow-entries - Create flow entry (auth required)');
    console.log('  - GET /v1/settings - Get settings (auth required)');
    console.log('  - PUT /v1/settings - Update settings (auth required)');
    console.log('  - GET /v1/stats/users/:userId - Get user stats (auth required)');
    console.log('  - GET /v1/plans - Get plans (auth required)');
    console.log('  - GET /v1/activities/stats - Get activity stats (auth required)');
    console.log('  - GET /v1/notifications - Get notifications (auth required)');
  } catch (error) {
    console.error('❌ Failed to start complete server:', error);
    process.exit(1);
  }
};

start();
