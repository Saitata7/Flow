// Models index file - exports all database models
const { FlowModel } = require('./flowModel');
const UserModel = require('./minimalJWTUserModel');

// Export models
module.exports = {
  FlowModel,
  FlowEntryModel: FlowModel, // FlowEntryModel is part of FlowModel
  UserModel
};
