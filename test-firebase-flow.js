#!/usr/bin/env node

/**
 * Test Firebase Authentication Flow
 */

const https = require('https');

const API_URL = 'https://flow-api-891963913698.us-central1.run.app';

// Test Firebase authentication flow
const testFirebaseAuthFlow = async () => {
  console.log('🔥 Testing Complete Firebase Authentication Flow');
  console.log('================================================================================');
  
  try {
    // Test 1: Check if API is accessible
    console.log('📋 Test 1: Checking API accessibility...');
    const healthResponse = await makeRequest('/');
    console.log('   Status:', healthResponse.status);
    console.log('   Response:', JSON.stringify(healthResponse.data, null, 2));
    
    // Test 2: Test authentication endpoint
    console.log('\n🔐 Test 2: Testing authentication endpoint...');
    const authResponse = await makeRequest('/v1/auth/verify', 'POST', null, {
      token: 'test-token'
    });
    console.log('   Status:', authResponse.status);
    console.log('   Response:', JSON.stringify(authResponse.data, null, 2));
    
    // Test 3: Test protected endpoint without token
    console.log('\n🔒 Test 3: Testing protected endpoint without token...');
    const protectedResponse = await makeRequest('/v1/flows', 'GET');
    console.log('   Status:', protectedResponse.status);
    console.log('   Response:', JSON.stringify(protectedResponse.data, null, 2));
    
    // Test 4: Test with mock Firebase token
    console.log('\n🔥 Test 4: Testing with mock Firebase token...');
    const mockFirebaseToken = createMockFirebaseToken();
    const mockTokenResponse = await makeRequest('/v1/flows', 'GET', mockFirebaseToken);
    console.log('   Status:', mockTokenResponse.status);
    console.log('   Response:', JSON.stringify(mockTokenResponse.data, null, 2));
    
    console.log('\n✅ Firebase Authentication Flow Test Complete');
    console.log('================================================================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Create a mock Firebase token for testing
const createMockFirebaseToken = () => {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const payload = {
    iss: 'https://securetoken.google.com/quick-doodad-472200-k0',
    aud: 'quick-doodad-472200-k0',
    auth_time: Math.floor(Date.now() / 1000),
    user_id: 'test-user-123',
    sub: 'test-user-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    firebase: {
      identities: {
        email: ['test@example.com']
      },
      sign_in_provider: 'password'
    }
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signature = 'mock-signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const makeRequest = (path, method = 'GET', token = null, body = null) => {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}${path}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': 'flow-test-v1',
        'X-Platform': 'test',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
};

// Run the test
testFirebaseAuthFlow();
