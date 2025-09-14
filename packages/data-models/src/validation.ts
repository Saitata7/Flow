const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { readFileSync } = require('fs');
const { join } = require('path');

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load schemas
const loadSchema = (filename) => {
  const schemaPath = join(__dirname, '../schemas', filename);
  return JSON.parse(readFileSync(schemaPath, 'utf8'));
};

const schemas = {
  flow: loadSchema('flow.schema.json'),
  flowEntry: loadSchema('flowEntry.schema.json'),
  plan: loadSchema('plan.schema.json'),
  profile: loadSchema('profile.schema.json'),
  settings: loadSchema('settings.schema.json'),
};

// Compile validators
const validators = {
  flow: ajv.compile(schemas.flow),
  flowEntry: ajv.compile(schemas.flowEntry),
  plan: ajv.compile(schemas.plan),
  profile: ajv.compile(schemas.profile),
  settings: ajv.compile(schemas.settings),
};

const createValidator = (schemaName) => {
  const validator = validators[schemaName];
  
  return (data) => {
    const valid = validator(data);
    
    if (valid) {
      return { valid: true };
    }
    
    const errors = validator.errors?.map(error => {
      const path = error.instancePath ? `${error.instancePath}: ` : '';
      return `${path}${error.message}`;
    }) || ['Unknown validation error'];
    
    return { valid: false, errors };
  };
};

// Convenience validators
const validateFlow = createValidator('flow');
const validateFlowEntry = createValidator('flowEntry');
const validatePlan = createValidator('plan');
const validateProfile = createValidator('profile');
const validateSettings = createValidator('settings');

// Validation with casting
const validateAndCast = (validator, data) => {
  const result = validator(data);
  
  if (result.valid) {
    return { valid: true, data };
  }
  
  return { valid: false, errors: result.errors || ['Validation failed'] };
};

module.exports = {
  createValidator,
  validateFlow,
  validateFlowEntry,
  validatePlan,
  validateProfile,
  validateSettings,
  validateAndCast
};
