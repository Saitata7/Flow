# Services

This directory contains backend services and infrastructure components for the Flow platform.

## 📂 Structure

```
services/
└── api/              # REST API service (Node.js + Fastify)
```

## 🎯 Overview

The services directory hosts backend services that power the Flow platform. Currently, it contains:

- **API Service** - Main REST API backend for mobile and web applications

Future services (planned):
- `jobs/` - Background workers for scheduled tasks
- `cache/` - Dedicated caching service
- `analytics/` - Analytics processing service

## 🔧 API Service

The main API service provides:

- **REST API** endpoints for flows, entries, statistics, and user management
- **Authentication** via JWT tokens
- **Database** integration with PostgreSQL (Cloud SQL)
- **Caching** with Redis (MemoryStore)
- **Health Monitoring** and logging
- **OpenAPI Documentation** with Swagger UI

### Quick Start

```bash
# Navigate to API service
cd api

# Install dependencies
npm install

# Set up environment
cp env.template.secure .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

### Documentation

For complete API service documentation, see:
- [services/api/README.md](api/README.md) - Complete API documentation
- [docs/API_USAGE.md](../docs/API_USAGE.md) - API usage guide

## 🏗️ Architecture

Services are designed as **independent microservices**:

- Each service has its own deployment configuration
- Services communicate via HTTP/REST APIs
- Shared infrastructure managed in `infra/` directory
- CI/CD pipelines configured in Cloud Build

## 🔐 Security

All services follow security best practices:

- **Environment Variables** - Sensitive config via env vars
- **Secret Management** - GCP Secret Manager for production
- **Authentication** - JWT-based authentication
- **Rate Limiting** - Built-in protection against abuse
- **Input Validation** - Comprehensive request validation

## 🚀 Deployment

### API Service

```bash
# Deploy to Cloud Run
cd api
./scripts/deployGCP.sh

# Or use Cloud Build
gcloud builds submit --config=../cloudbuild.yaml
```

### Docker

```bash
# Build Docker image
cd api
docker build -t flow-api .

# Run container
docker run -p 4000:4000 --env-file .env.local flow-api
```

## 🧪 Testing

```bash
# Run all service tests
cd api
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e           # E2E tests
```

## 📦 Development

```bash
# Install all service dependencies
yarn install

# Start all services in development mode
yarn workspace @flow/api dev

# Run linting
yarn workspace @flow/api lint

# Run tests
yarn workspace @flow/api test
```

## 🔄 Future Services

### Background Jobs Service (`jobs/`)
- Scheduled tasks and cron jobs
- Queue processing
- Email notifications
- Analytics aggregation

### Caching Service (`cache/`)
- Dedicated Redis management
- Cache invalidation strategies
- Performance optimization

### Analytics Service (`analytics/`)
- Data processing pipeline
- Statistics computation
- Reporting generation

## 📚 Documentation

- **API Service**: [api/README.md](api/README.md)
- **Deployment Guide**: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- **Architecture**: [../prompt/ARCHITECTURE.md](../prompt/ARCHITECTURE.md)

## 🤝 Contributing

When adding new services:

1. Create service directory
2. Add `package.json` with service name (`@flow/service-name`)
3. Implement service following existing patterns
4. Add Dockerfile for containerization
5. Update root `package.json` workspaces
6. Add service-specific README
7. Configure CI/CD pipeline

## 📄 License

Part of the Flow ecosystem. See main project README for license information.
