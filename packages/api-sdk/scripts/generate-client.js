const fs = require('fs');
const path = require('path');

console.log('🔧 Generating Flow API SDK client...');

// Read the OpenAPI specification
const openApiPath = path.join(__dirname, '../../services/api/openapi/v1.json');
let openApiSpec;

try {
  const openApiContent = fs.readFileSync(openApiPath, 'utf8');
  openApiSpec = JSON.parse(openApiContent);
} catch (error) {
  console.log('⚠️  OpenAPI spec not found, using default client');
  console.log('   Run "yarn workspace services/api openapi:generate" first');
  return;
}

// Generate TypeScript definitions (simplified)
const generateTypes = (spec) => {
  const types = [];
  
  if (spec.components && spec.components.schemas) {
    Object.entries(spec.components.schemas).forEach(([name, schema]) => {
      types.push(`export interface ${name} {`);
      
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([propName, propSchema]) => {
          const optional = schema.required && !schema.required.includes(propName) ? '?' : '';
          const type = getTypeScriptType(propSchema);
          types.push(`  ${propName}${optional}: ${type};`);
        });
      }
      
      types.push('}');
      types.push('');
    });
  }
  
  return types.join('\n');
};

const getTypeScriptType = (schema) => {
  if (schema.type === 'string') {
    if (schema.enum) {
      return schema.enum.map(val => `'${val}'`).join(' | ');
    }
    return 'string';
  }
  
  if (schema.type === 'number' || schema.type === 'integer') {
    return 'number';
  }
  
  if (schema.type === 'boolean') {
    return 'boolean';
  }
  
  if (schema.type === 'array') {
    const itemType = getTypeScriptType(schema.items || {});
    return `${itemType}[]`;
  }
  
  if (schema.type === 'object') {
    return 'object';
  }
  
  return 'any';
};

// Generate client methods
const generateClientMethods = (spec) => {
  const methods = [];
  
  if (spec.paths) {
    Object.entries(spec.paths).forEach(([path, pathSpec]) => {
      Object.entries(pathSpec).forEach(([method, operation]) => {
        if (operation.summary) {
          const methodName = getMethodName(path, method, operation);
          const params = getMethodParams(path, operation);
          const returnType = getReturnType(operation);
          
          methods.push(`  async ${methodName}(${params}): Promise<${returnType}> {`);
          methods.push(`    return this.client.${method}('${path}', ${getRequestBody(operation)});`);
          methods.push(`  }`);
          methods.push('');
        }
      });
    });
  }
  
  return methods.join('\n');
};

const getMethodName = (path, method, operation) => {
  const summary = operation.summary.toLowerCase();
  const pathParts = path.split('/').filter(part => part && !part.startsWith('{'));
  
  if (summary.includes('create')) {
    return `create${pathParts[pathParts.length - 1]}`;
  }
  
  if (summary.includes('update')) {
    return `update${pathParts[pathParts.length - 1]}`;
  }
  
  if (summary.includes('delete')) {
    return `delete${pathParts[pathParts.length - 1]}`;
  }
  
  if (summary.includes('get')) {
    return `get${pathParts[pathParts.length - 1]}`;
  }
  
  return `${method}${pathParts.join('')}`;
};

const getMethodParams = (path, operation) => {
  const params = [];
  
  // Path parameters
  if (path.includes('{')) {
    const pathParams = path.match(/\{(\w+)\}/g);
    pathParams.forEach(param => {
      const paramName = param.slice(1, -1);
      params.push(`${paramName}: string`);
    });
  }
  
  // Request body
  if (operation.requestBody) {
    params.push('data: any');
  }
  
  // Query parameters
  if (operation.parameters) {
    const queryParams = operation.parameters.filter(param => param.in === 'query');
    if (queryParams.length > 0) {
      params.push('options?: any');
    }
  }
  
  return params.join(', ');
};

const getReturnType = (operation) => {
  if (operation.responses && operation.responses['200']) {
    return 'any';
  }
  return 'any';
};

const getRequestBody = (operation) => {
  if (operation.requestBody) {
    return 'data';
  }
  return '';
};

// Generate the complete client
const generateClient = (spec) => {
  const types = generateTypes(spec);
  const methods = generateClientMethods(spec);
  
  return `// Auto-generated Flow API SDK
// Generated from OpenAPI specification v${spec.info.version}

${types}

export class FlowApiClient {
  private client: any;
  private baseURL: string;
  private apiKey?: string;

  constructor(options: { baseURL?: string; apiKey?: string; timeout?: number } = {}) {
    this.baseURL = options.baseURL || 'http://localhost:4000/v1';
    this.apiKey = options.apiKey;
    
    // Initialize HTTP client (axios, fetch, etc.)
    this.client = this.createHttpClient();
  }

  private createHttpClient() {
    // Implementation depends on your HTTP client choice
    return {
      get: (url: string) => Promise.resolve({}),
      post: (url: string, data?: any) => Promise.resolve({}),
      put: (url: string, data?: any) => Promise.resolve({}),
      patch: (url: string, data?: any) => Promise.resolve({}),
      delete: (url: string) => Promise.resolve({}),
    };
  }

  setAuthToken(token: string): void {
    // Set Authorization header
  }

  clearAuthToken(): void {
    // Remove Authorization header
  }

${methods}
}

export const createClient = (options?: any) => new FlowApiClient(options);
export const defaultClient = new FlowApiClient();
`;
};

// Write generated files
const outputDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const clientCode = generateClient(openApiSpec);
fs.writeFileSync(path.join(outputDir, 'client.ts'), clientCode);

console.log('✅ Flow API SDK client generated successfully!');
console.log(`   📁 Generated files: ${outputDir}`);
console.log('   📄 client.ts - TypeScript client with types');
console.log('');
console.log('💡 Next steps:');
console.log('   1. Install HTTP client dependency (axios, node-fetch, etc.)');
console.log('   2. Implement HTTP client in createHttpClient() method');
console.log('   3. Add error handling and retry logic');
console.log('   4. Generate JavaScript version if needed');
