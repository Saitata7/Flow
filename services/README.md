# Services

This directory contains backend services and infrastructure components for the Flow platform.

## Structure

- `api/` - REST/GraphQL API endpoints (future)
- `cache/` - Redis caching helpers (future)
- `jobs/` - Background workers for leaderboards, emails, etc. (future)
- `openapi/` - OpenAPI specifications (future)

## Purpose

These services provide the backend infrastructure for the Flow applications:

- **API Layer**: RESTful and GraphQL APIs for data access
- **Caching**: Redis-based caching for improved performance
- **Background Jobs**: Async processing for heavy operations
- **Documentation**: API specifications and documentation

## Technology Stack

- Node.js/Express for API services
- Redis for caching
- PostgreSQL/MongoDB for data storage
- Docker for containerization
- OpenAPI for API documentation

## Development

```bash
# Install dependencies
yarn install

# Start all services
yarn dev

# Start specific service
yarn workspace @flow/api dev

# Run tests
yarn test

# Build for production
yarn build
```

## Deployment

Services are designed to be deployed as microservices:

- Each service has its own deployment configuration
- Services communicate via HTTP/gRPC
- Shared infrastructure managed in `infra/` directory
- CI/CD pipelines configured in `.github/`
