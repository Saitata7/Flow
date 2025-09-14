const knex = require('knex');
const { Pool } = require('pg');

// Knex configuration
const knexConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'flow',
    user: process.env.DB_USER || 'flow_user',
    password: process.env.DB_PASSWORD || 'flow_password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

// Create Knex instance
const db = knex(knexConfig);

// Model classes for each entity
class FlowModel {
  static tableName = 'flows';

  static async create(data) {
    const [flow] = await db(this.tableName)
      .insert(data)
      .returning('*');
    return flow;
  }

  static async findById(id) {
    return db(this.tableName)
      .where({ id, deleted_at: null })
      .first();
  }

  static async findByUserId(userId, options = {}) {
    let query = db(this.tableName)
      .where({ owner_id: userId, deleted_at: null });

    if (options.archived !== undefined) {
      query = query.where('archived', options.archived);
    }

    if (options.visibility) {
      query = query.where('visibility', options.visibility);
    }

    return query.orderBy('created_at', 'desc');
  }

  static async update(id, data) {
    const [flow] = await db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return flow;
  }

  static async softDelete(id) {
    return db(this.tableName)
      .where({ id })
      .update({ deleted_at: new Date(), updated_at: new Date() });
  }

  static async search(searchTerm, filters = {}) {
    let query = db(this.tableName)
      .where({ deleted_at: null });

    if (searchTerm) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${searchTerm}%`)
            .orWhere('description', 'ilike', `%${searchTerm}%`);
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.whereRaw('tags && ?', [filters.tags]);
    }

    if (filters.trackingType) {
      query = query.where('tracking_type', filters.trackingType);
    }

    if (filters.visibility) {
      query = query.where('visibility', filters.visibility);
    }

    return query.orderBy('created_at', 'desc');
  }
}

class FlowEntryModel {
  static tableName = 'flow_entries';

  static async create(data) {
    const [entry] = await db(this.tableName)
      .insert(data)
      .returning('*');
    return entry;
  }

  static async findById(id) {
    return db(this.tableName)
      .where({ id, deleted_at: null })
      .first();
  }

  static async findByFlowId(flowId, options = {}) {
    let query = db(this.tableName)
      .where({ flow_id: flowId, deleted_at: null });

    if (options.date) {
      query = query.where('date', options.date);
    }

    if (options.startDate && options.endDate) {
      query = query.whereBetween('date', [options.startDate, options.endDate]);
    }

    return query.orderBy('date', 'desc');
  }

  static async findByUserId(userId, options = {}) {
    let query = db(this.tableName)
      .join('flows', 'flow_entries.flow_id', 'flows.id')
      .where('flows.owner_id', userId)
      .where('flow_entries.deleted_at', null);

    if (options.date) {
      query = query.where('flow_entries.date', options.date);
    }

    return query
      .select('flow_entries.*')
      .orderBy('flow_entries.date', 'desc');
  }

  static async update(id, data) {
    const [entry] = await db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return entry;
  }

  static async softDelete(id) {
    return db(this.tableName)
      .where({ id })
      .update({ deleted_at: new Date(), updated_at: new Date() });
  }

  static async getStreakData(flowId) {
    return db(this.tableName)
      .where({ flow_id: flowId, symbol: '✓', deleted_at: null })
      .orderBy('date', 'desc');
  }
}

class PlanModel {
  static tableName = 'plans';

  static async create(data) {
    const [plan] = await db(this.tableName)
      .insert(data)
      .returning('*');
    return plan;
  }

  static async findById(id) {
    return db(this.tableName)
      .where({ id, deleted_at: null })
      .first();
  }

  static async findByUserId(userId) {
    return db(this.tableName)
      .where({ owner_id: userId, deleted_at: null })
      .orderBy('created_at', 'desc');
  }

  static async findPublic(options = {}) {
    let query = db(this.tableName)
      .where({ visibility: 'public', status: 'active', deleted_at: null });

    if (options.type) {
      query = query.where('type', options.type);
    }

    if (options.status) {
      query = query.where('status', options.status);
    }

    return query.orderBy('created_at', 'desc');
  }

  static async update(id, data) {
    const [plan] = await db(this.tableName)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return plan;
  }

  static async addParticipant(planId, userId) {
    return db('plan_participants')
      .insert({ plan_id: planId, user_id: userId, joined_at: new Date() })
      .onConflict(['plan_id', 'user_id'])
      .ignore();
  }

  static async removeParticipant(planId, userId) {
    return db('plan_participants')
      .where({ plan_id: planId, user_id: userId })
      .del();
  }

  static async getParticipants(planId) {
    return db('plan_participants')
      .where('plan_id', planId)
      .select('user_id', 'joined_at');
  }
}

class UserProfileModel {
  static tableName = 'user_profiles';

  static async create(data) {
    const [profile] = await db(this.tableName)
      .insert(data)
      .returning('*');
    return profile;
  }

  static async findByUserId(userId) {
    return db(this.tableName)
      .where({ user_id: userId, deleted_at: null })
      .first();
  }

  static async findByUsername(username) {
    return db(this.tableName)
      .where({ username, deleted_at: null })
      .first();
  }

  static async update(userId, data) {
    const [profile] = await db(this.tableName)
      .where({ user_id: userId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return profile;
  }

  static async search(searchTerm, options = {}) {
    let query = db(this.tableName)
      .where({ deleted_at: null });

    if (searchTerm) {
      query = query.where(function() {
        this.where('username', 'ilike', `%${searchTerm}%`)
            .orWhere('display_name', 'ilike', `%${searchTerm}%`)
            .orWhere('bio', 'ilike', `%${searchTerm}%`);
      });
    }

    return query.orderBy('created_at', 'desc');
  }
}

class UserSettingsModel {
  static tableName = 'user_settings';

  static async create(data) {
    const [settings] = await db(this.tableName)
      .insert(data)
      .returning('*');
    return settings;
  }

  static async findByUserId(userId) {
    return db(this.tableName)
      .where({ user_id: userId, deleted_at: null })
      .first();
  }

  static async update(userId, data) {
    const [settings] = await db(this.tableName)
      .where({ user_id: userId })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return settings;
  }
}

// Statistics aggregation methods
class StatsModel {
  static async getUserStats(userId) {
    const flows = await db('flows')
      .where({ owner_id: userId, deleted_at: null })
      .count('* as total_flows');

    const entries = await db('flow_entries')
      .join('flows', 'flow_entries.flow_id', 'flows.id')
      .where('flows.owner_id', userId)
      .where('flow_entries.deleted_at', null)
      .count('* as total_entries');

    const completedEntries = await db('flow_entries')
      .join('flows', 'flow_entries.flow_id', 'flows.id')
      .where('flows.owner_id', userId)
      .where('flow_entries.symbol', '✓')
      .where('flow_entries.deleted_at', null)
      .count('* as completed_entries');

    return {
      totalFlows: parseInt(flows[0].total_flows),
      totalEntries: parseInt(entries[0].total_entries),
      completedEntries: parseInt(completedEntries[0].completed_entries),
    };
  }

  static async getLeaderboard(options = {}) {
    const { type = 'streak', timeframe = 'month', limit = 50 } = options;
    
    let query = db('flow_entries')
      .join('flows', 'flow_entries.flow_id', 'flows.id')
      .join('user_profiles', 'flows.owner_id', 'user_profiles.user_id')
      .where('flow_entries.deleted_at', null)
      .where('user_profiles.deleted_at', null);

    // Apply timeframe filter
    if (timeframe === 'week') {
      query = query.where('flow_entries.date', '>=', db.raw("CURRENT_DATE - INTERVAL '7 days'"));
    } else if (timeframe === 'month') {
      query = query.where('flow_entries.date', '>=', db.raw("CURRENT_DATE - INTERVAL '30 days'"));
    }

    if (type === 'streak') {
      return query
        .select('user_profiles.username', 'user_profiles.display_name', 'flows.owner_id')
        .sum('flow_entries.streak_count as total_streak')
        .groupBy('user_profiles.username', 'user_profiles.display_name', 'flows.owner_id')
        .orderBy('total_streak', 'desc')
        .limit(limit);
    } else if (type === 'completion') {
      return query
        .where('flow_entries.symbol', '✓')
        .select('user_profiles.username', 'user_profiles.display_name', 'flows.owner_id')
        .count('* as completed_count')
        .groupBy('user_profiles.username', 'user_profiles.display_name', 'flows.owner_id')
        .orderBy('completed_count', 'desc')
        .limit(limit);
    }
  }
}

module.exports = {
  db,
  FlowModel,
  FlowEntryModel,
  PlanModel,
  UserProfileModel,
  UserSettingsModel,
  StatsModel,
};
