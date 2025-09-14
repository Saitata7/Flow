const fs = require('fs');
const path = require('path');

// Basic OpenAPI v3 specification
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Flow API',
    description: 'Flow v1 API - Backend for Flow habit tracking application',
    version: '1.0.0',
    contact: {
      name: 'Flow Team',
      email: 'api@flow.app',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.flow.app/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Flow: {
        type: 'object',
        required: ['id', 'title', 'trackingType', 'frequency', 'ownerId'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          trackingType: { type: 'string', enum: ['Binary', 'Quantitative', 'Time-based'] },
          frequency: { type: 'string', enum: ['Daily', 'Weekly', 'Monthly'] },
          everyDay: { type: 'boolean' },
          daysOfWeek: {
            type: 'array',
            items: { type: 'string', enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
          },
          reminderTime: { type: 'string', format: 'date-time' },
          reminderLevel: { type: 'string', enum: ['1', '2', '3'] },
          cheatMode: { type: 'boolean' },
          planId: { type: 'string' },
          goal: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['number', 'duration', 'count'] },
              value: { type: 'number' },
              unit: { type: 'string' }
            }
          },
          progressMode: { type: 'string', enum: ['sum', 'average', 'latest'] },
          tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 },
          archived: { type: 'boolean' },
          visibility: { type: 'string', enum: ['private', 'friends', 'public'] },
          ownerId: { type: 'string' },
          schemaVersion: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      FlowEntry: {
        type: 'object',
        required: ['id', 'flowId', 'date', 'symbol'],
        properties: {
          id: { type: 'string' },
          flowId: { type: 'string' },
          date: { type: 'string', format: 'date' },
          symbol: { type: 'string', enum: ['✓', '✗', '+'] },
          emotion: { type: 'string' },
          moodScore: { type: 'integer', minimum: 1, maximum: 5 },
          note: { type: 'string', maxLength: 1000 },
          quantitative: {
            type: 'object',
            properties: {
              unitText: { type: 'string' },
              count: { type: 'number' }
            }
          },
          timebased: {
            type: 'object',
            properties: {
              totalDuration: { type: 'number' }
            }
          },
          device: { type: 'string', enum: ['mobile', 'web', 'api'] },
          geo: {
            type: 'object',
            properties: {
              lat: { type: 'number', minimum: -90, maximum: 90 },
              lng: { type: 'number', minimum: -180, maximum: 180 },
              accuracy: { type: 'number', minimum: 0 }
            }
          },
          streakCount: { type: 'integer', minimum: 0 },
          edited: { type: 'boolean' },
          editedBy: { type: 'string' },
          editedAt: { type: 'string', format: 'date-time' },
          timestamp: { type: 'string', format: 'date-time' },
          schemaVersion: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {},
          error: { type: 'string' },
          message: { type: 'string' }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'array', items: {} },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' }
            }
          }
        }
      }
    }
  },
  paths: {
    '/flows': {
      post: {
        summary: 'Create a new flow',
        description: 'Create a new flow for the authenticated user',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'trackingType', 'frequency'],
                properties: {
                  title: { type: 'string', minLength: 1, maxLength: 100 },
                  description: { type: 'string', maxLength: 500 },
                  trackingType: { type: 'string', enum: ['Binary', 'Quantitative', 'Time-based'] },
                  frequency: { type: 'string', enum: ['Daily', 'Weekly', 'Monthly'] },
                  cheatMode: { type: 'boolean' },
                  visibility: { type: 'string', enum: ['private', 'friends', 'public'] }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Flow created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Flow' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      },
      get: {
        summary: 'Get user flows',
        description: 'Get paginated list of flows for the authenticated user',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', minimum: 1, default: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
          },
          {
            name: 'archived',
            in: 'query',
            description: 'Filter archived flows',
            schema: { type: 'boolean', default: false }
          }
        ],
        responses: {
          '200': {
            description: 'Flows retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Flow' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/flows/{id}': {
      get: {
        summary: 'Get flow by ID',
        description: 'Get a specific flow by its ID',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Flow ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Flow retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Flow' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': {
            description: 'Flow not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check API service health status',
        tags: ['health'],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    uptime: { type: 'number' },
                    version: { type: 'string' },
                    redis: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: 'flows', description: 'Flow management endpoints' },
    { name: 'entries', description: 'Flow entry endpoints' },
    { name: 'plans', description: 'Plan management endpoints' },
    { name: 'profiles', description: 'User profile endpoints' },
    { name: 'settings', description: 'User settings endpoints' },
    { name: 'stats', description: 'Statistics and analytics endpoints' },
    { name: 'health', description: 'Health check endpoints' }
  ]
};

// Write OpenAPI specification to file
const outputDir = path.join(__dirname, '../openapi');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const yamlPath = path.join(outputDir, 'v1.yaml');
const jsonPath = path.join(outputDir, 'v1.json');

// Convert to YAML (basic conversion)
const yamlContent = `openapi: ${openApiSpec.openapi}
info:
  title: ${openApiSpec.info.title}
  description: ${openApiSpec.info.description}
  version: ${openApiSpec.info.version}
  contact:
    name: ${openApiSpec.info.contact.name}
    email: ${openApiSpec.info.contact.email}
  license:
    name: ${openApiSpec.info.license.name}
    url: ${openApiSpec.info.license.url}
servers:
  - url: ${openApiSpec.servers[0].url}
    description: ${openApiSpec.servers[0].description}
  - url: ${openApiSpec.servers[1].url}
    description: ${openApiSpec.servers[1].description}
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
paths:
  /flows:
    post:
      summary: Create a new flow
      description: Create a new flow for the authenticated user
      tags:
        - flows
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - title
                - trackingType
                - frequency
              properties:
                title:
                  type: string
                  minLength: 1
                  maxLength: 100
                description:
                  type: string
                  maxLength: 500
                trackingType:
                  type: string
                  enum:
                    - Binary
                    - Quantitative
                    - Time-based
                frequency:
                  type: string
                  enum:
                    - Daily
                    - Weekly
                    - Monthly
                cheatMode:
                  type: boolean
                visibility:
                  type: string
                  enum:
                    - private
                    - friends
                    - public
      responses:
        '201':
          description: Flow created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/Flow'
                  message:
                    type: string
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  error:
                    type: string
                  message:
                    type: string
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  error:
                    type: string
                  message:
                    type: string
    get:
      summary: Get user flows
      description: Get paginated list of flows for the authenticated user
      tags:
        - flows
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          description: Page number
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: Items per page
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: archived
          in: query
          description: Filter archived flows
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: Flows retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Flow'
                  pagination:
                    type: object
                    properties:
                      page:
                        type: integer
                      limit:
                        type: integer
                      total:
                        type: integer
                      totalPages:
                        type: integer
  /flows/{id}:
    get:
      summary: Get flow by ID
      description: Get a specific flow by its ID
      tags:
        - flows
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          description: Flow ID
          schema:
            type: string
      responses:
        '200':
          description: Flow retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/Flow'
        '404':
          description: Flow not found
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  error:
                    type: string
                  message:
                    type: string
  /health:
    get:
      summary: Health check
      description: Check API service health status
      tags:
        - health
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  timestamp:
                    type: string
                  uptime:
                    type: number
                  version:
                    type: string
                  redis:
                    type: string
components:
  schemas:
    Flow:
      type: object
      required:
        - id
        - title
        - trackingType
        - frequency
        - ownerId
      properties:
        id:
          type: string
        title:
          type: string
          minLength: 1
          maxLength: 100
        description:
          type: string
          maxLength: 500
        trackingType:
          type: string
          enum:
            - Binary
            - Quantitative
            - Time-based
        frequency:
          type: string
          enum:
            - Daily
            - Weekly
            - Monthly
        cheatMode:
          type: boolean
        visibility:
          type: string
          enum:
            - private
            - friends
            - public
        ownerId:
          type: string
        schemaVersion:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        deletedAt:
          type: string
          format: date-time
          nullable: true
tags:
  - name: flows
    description: Flow management endpoints
  - name: entries
    description: Flow entry endpoints
  - name: plans
    description: Plan management endpoints
  - name: profiles
    description: User profile endpoints
  - name: settings
    description: User settings endpoints
  - name: stats
    description: Statistics and analytics endpoints
  - name: health
    description: Health check endpoints`;

fs.writeFileSync(yamlPath, yamlContent);
fs.writeFileSync(jsonPath, JSON.stringify(openApiSpec, null, 2));

console.log('✅ OpenAPI specification generated:');
console.log(`   📄 YAML: ${yamlPath}`);
console.log(`   📄 JSON: ${jsonPath}`);
