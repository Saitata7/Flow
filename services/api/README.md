# Flow API Service

Backend API service for Flow v1 - A habit tracking and personal development application.

## Overview

This is the main API service for the Flow application, built with Node.js and Fastify. It provides RESTful endpoints for managing flows, entries, plans, user profiles, settings, and statistics.

## Features

- **Fastify Framework**: High-performance web framework
- **Redis Caching**: Leaderboards, public data, and performance optimization
- **Authentication**: JWT-based authentication with role-based access control
- **Validation**: AJV schema validation for all requests/responses
- **Rate Limiting**: Per-user and global rate limiting
- **OpenAPI Documentation**: Auto-generated API documentation
- **Health Checks**: Service monitoring and status endpoints
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Architecture

```
services/api/
├── src/
│   ├── controllers/       # Route handlers per domain
│   ├── routes/            # Route definitions and schemas
│   ├── middleware/        # Auth, validation, error handling
│   ├── redis/             # Redis client and utilities
│   ├── services/          # Business logic
│   ├── utils/             # Helper functions
│   └── index.js           # Server bootstrap
├── tests/                 # Unit and integration tests
├── openapi/               # OpenAPI specifications
├── migrations/            # Database migrations
└── package.json
```

## API Endpoints

### Flows
- `POST /v1/flows` - Create a new flow
- `GET /v1/flows` - Get user's flows (paginated)
- `GET /v1/flows/search` - Search flows
- `GET /v1/flows/:id` - Get flow by ID
- `PUT /v1/flows/:id` - Update flow
- `PATCH /v1/flows/:id/archive` - Archive flow
- `DELETE /v1/flows/:id` - Delete flow (soft delete)
- `GET /v1/flows/:id/stats` - Get flow statistics

### Flow Entries
- `POST /v1/entries` - Create flow entry
- `GET /v1/entries` - Get user's entries
- `GET /v1/entries/:id` - Get entry by ID
- `PUT /v1/entries/:id` - Update entry
- `DELETE /v1/entries/:id` - Delete entry

### Plans
- `POST /v1/plans` - Create plan
- `GET /v1/plans` - Get plans
- `GET /v1/plans/:id` - Get plan by ID
- `PUT /v1/plans/:id` - Update plan
- `POST /v1/plans/:id/join` - Join plan
- `POST /v1/plans/:id/leave` - Leave plan

### Profiles
- `GET /v1/profiles/:id` - Get user profile
- `PUT /v1/profiles/:id` - Update profile
- `GET /v1/profiles/:id/public` - Get public profile

### Settings
- `GET /v1/settings` - Get user settings
- `PUT /v1/settings` - Update settings

### Statistics
- `GET /v1/stats/leaderboard` - Get leaderboard
- `GET /v1/stats/user/:id` - Get user statistics
- `GET /v1/stats/trends` - Get trend data

## Quick Start

### Prerequisites

- Node.js 18+ 
- Redis server
- npm or yarn

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start Redis server:
```bash
redis-server
```

4. Start the development server:
```bash
yarn dev
```

The API will be available at `http://localhost:4000`

## Environment Variables

```bash
# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Database (when implemented)
DATABASE_URL=postgresql://user:password@localhost:5432/flow

# External Services
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY=your-firebase-private-key
```

## Development

### Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage
- `yarn clean` - Clean build artifacts

### Project Structure

#### Controllers
Controllers handle HTTP requests and responses. They should be thin and delegate business logic to services.

```javascript
// Example controller method
const createFlow = async (request, reply) => {
  const { user } = request;
  const flowData = request.body;
  
  const flow = await flowService.createFlow(user.id, flowData);
  
  return reply.status(201).send({
    success: true,
    data: flow,
    message: 'Flow created successfully'
  });
};
```

#### Routes
Routes define API endpoints with validation schemas and middleware.

```javascript
// Example route definition
fastify.post('/', {
  preHandler: [requireAuth, validateFlowData],
  schema: {
    description: 'Create a new flow',
    tags: ['flows'],
    body: {
      type: 'object',
      required: ['title', 'trackingType'],
      properties: {
        title: { type: 'string', minLength: 1 },
        trackingType: { type: 'string', enum: ['Binary', 'Quantitative'] }
      }
    }
  }
}, createFlow);
```

#### Middleware
Middleware handles cross-cutting concerns like authentication, validation, and error handling.

#### Services
Services contain business logic and data access. They should be database-agnostic and testable.

#### Redis Utilities
Redis utilities provide caching and session management.

## Testing

### Unit Tests
Test individual functions and services:

```bash
yarn test src/services/flowService.test.js
```

### Integration Tests
Test API endpoints:

```bash
yarn test tests/integration/flows.test.js
```

### Test Coverage
Generate coverage reports:

```bash
yarn test:coverage
```

## API Documentation

### Swagger UI
Visit `http://localhost:4000/docs` for interactive API documentation.

### OpenAPI Specification
The OpenAPI specification is auto-generated and available at:
- JSON: `http://localhost:4000/docs/json`
- YAML: `http://localhost:4000/docs/yaml`

## Authentication

### JWT Tokens
The API uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
curl -H "Authorization: Bearer your-jwt-token" \
     http://localhost:4000/v1/flows
```

### Mock Authentication
For development, the API includes mock authentication with these test tokens:
- `valid-user-token` - Regular user
- `valid-admin-token` - Admin user

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid request data",
  "errors": ["title is required"],
  "code": "VALIDATION_ERROR"
}
```

### Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

The API implements rate limiting:
- Global: 100 requests per minute
- Per user: Configurable per endpoint
- Redis-backed for distributed systems

## Caching

### Redis Cache Keys
- `flow:{id}` - Individual flows (1 hour TTL)
- `user:{id}:flows` - User's flows (30 minutes TTL)
- `leaderboard:global` - Global leaderboard (24 hours TTL)
- `stats:{userId}` - User statistics (1 hour TTL)

### Cache Strategy
- Write-through for critical data
- TTL-based expiration
- Cache invalidation on updates

## Deployment

### Production Build
```bash
yarn build
yarn start
```

### Docker
```bash
docker build -t flow-api .
docker run -p 4000:4000 flow-api
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure Redis cluster
3. Set up database connections
4. Configure monitoring and logging

## Monitoring

### Health Checks
- `GET /health` - Service health status
- `GET /health/redis` - Redis connection status
- `GET /health/db` - Database connection status

### Metrics
- Request count and duration
- Error rates
- Cache hit/miss ratios
- Database query performance

## Contributing

1. Follow the coding guidelines in `prompt/CODING_GUIDELINES.md`
2. Write tests for new features
3. Update API documentation
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
