// Simple validation functions since @flow/data-models might not be available
const validateFlow = data => {
  const errors = [];
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  }
  if (!data.trackingType || !['Binary', 'Quantitative', 'Time-based'].includes(data.trackingType)) {
    errors.push('Tracking type must be Binary, Quantitative, or Time-based');
  }
  return { valid: errors.length === 0, errors };
};

const validateFlowEntry = data => {
  const errors = [];
  if (!data.symbol || !['+', '-', '*', '/'].includes(data.symbol)) {
    errors.push('Symbol must be +, -, *, or /');
  }
  if (data.moodScore && (data.moodScore < 1 || data.moodScore > 5)) {
    errors.push('Mood score must be between 1 and 5');
  }
  if (data.note && data.note.length > 1000) {
    errors.push('Note must be less than 1000 characters');
  }
  return { valid: errors.length === 0, errors };
};

const validatePlan = data => {
  return { valid: true, errors: [] };
};

const validateProfile = data => {
  return { valid: true, errors: [] };
};

const validateSettings = data => {
  return { valid: true, errors: [] };
};

// Custom error classes
class FlowError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'FlowError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class ValidationError extends FlowError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends FlowError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends FlowError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends FlowError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends FlowError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends FlowError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Error handler middleware
const errorHandler = (error, request, reply) => {
  const { log } = request;

  // Log error details
  log.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
      },
      user: request.user?.id || 'anonymous',
    },
    'Request error'
  );

  // Handle known error types
  if (error instanceof ValidationError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      message: error.message,
      errors: error.errors,
      code: error.code,
    });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      success: false,
      error: 'Not found',
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({
      success: false,
      error: 'Forbidden',
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof ConflictError) {
    return reply.status(409).send({
      success: false,
      error: 'Conflict',
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof RateLimitError) {
    return reply.status(429).send({
      success: false,
      error: 'Rate limit exceeded',
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof FlowError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: 'Application error',
      message: error.message,
      code: error.code,
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      message: 'Request validation failed',
      errors: error.validation.map(err => err.message),
      code: 'VALIDATION_ERROR',
    });
  }

  // Handle AJV validation errors
  if (error.validationContext) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      message: 'Request validation failed',
      errors: error.validationErrors?.map(err => err.message) || [error.message],
      code: 'VALIDATION_ERROR',
    });
  }

  // Handle Redis connection errors
  if (error.code === 'ECONNREFUSED' && error.syscall === 'connect') {
    return reply.status(503).send({
      success: false,
      error: 'Service unavailable',
      message: 'Cache service is temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // Handle database connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return reply.status(503).send({
      success: false,
      error: 'Service unavailable',
      message: 'Database service is temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // Handle timeout errors
  if (error.code === 'ETIMEDOUT') {
    return reply.status(504).send({
      success: false,
      error: 'Gateway timeout',
      message: 'Request timed out',
      code: 'TIMEOUT',
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;

  return reply.status(statusCode).send({
    success: false,
    error: 'Internal server error',
    message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

// Validation middleware factory
const createValidationMiddleware = (validator, schemaName) => {
  return async (request, reply) => {
    try {
      const result = validator(request.body);

      if (!result.valid) {
        throw new ValidationError(`Invalid ${schemaName} data`, result.errors);
      }

      // Attach validated data to request
      request.validatedData = request.body;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ValidationError(`Failed to validate ${schemaName} data: ${error.message}`);
    }
  };
};

// Convenience validation middlewares
const validateFlowData = createValidationMiddleware(validateFlow, 'flow');
const validateFlowEntryData = createValidationMiddleware(validateFlowEntry, 'flow entry');
const validatePlanData = createValidationMiddleware(validatePlan, 'plan');
const validateProfileData = createValidationMiddleware(validateProfile, 'profile');
const validateSettingsData = createValidationMiddleware(validateSettings, 'settings');

module.exports = {
  errorHandler,
  FlowError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  createValidationMiddleware,
  validateFlowData,
  validateFlowEntryData,
  validatePlanData,
  validateProfileData,
  validateSettingsData,
};
