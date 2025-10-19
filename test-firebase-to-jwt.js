#!/usr/bin/env node

/**
 * Test Firebase-to-JWT Conversion
 * This test verifies that the Firebase-to-JWT conversion endpoint works
 */

const https = require('https');

const API_URL = 'https://flow-api-891963913698.us-central1.run.app';

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

const testFirebaseToJWT = async () => {
  console.log('🔥 Testing Firebase-to-JWT Conversion');
  console.log('================================================================================');
  
  try {
    // Test 1: Check API health
    console.log('📋 Test 1: Checking API health...');
    const healthResponse = await makeRequest('/');
    console.log('   Status:', healthResponse.status);
    
    if (healthResponse.status !== 200) {
      throw new Error('API is not healthy');
    }
    
    // Test 2: Test Firebase-to-JWT conversion endpoint
    console.log('\n🔄 Test 2: Testing Firebase-to-JWT conversion...');
    const mockFirebaseToken = createMockFirebaseToken();
    console.log('   Mock Firebase token created:', mockFirebaseToken.substring(0, 50) + '...');
    
    const conversionResponse = await makeRequest('/v1/auth/firebase-to-jwt', 'POST', null, {
      firebaseToken: mockFirebaseToken,
      user: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      }
    });
    
    console.log('   Status:', conversionResponse.status);
    console.log('   Response:', JSON.stringify(conversionResponse.data, null, 2));
    
    if (conversionResponse.status === 200 && conversionResponse.data.success) {
      console.log('   ✅ Firebase-to-JWT conversion successful!');
      console.log('   ✅ JWT Token:', conversionResponse.data.jwtToken.substring(0, 50) + '...');
      
      // Test 3: Test the converted JWT token
      console.log('\n🔐 Test 3: Testing converted JWT token...');
      const jwtToken = conversionResponse.data.jwtToken;
      const protectedResponse = await makeRequest('/v1/flows', 'GET', jwtToken);
      
      console.log('   Status:', protectedResponse.status);
      console.log('   Response:', JSON.stringify(protectedResponse.data, null, 2));
      
      if (protectedResponse.status === 200) {
        console.log('   ✅ JWT token works for protected endpoints!');
      } else {
        console.log('   ❌ JWT token failed for protected endpoints');
      }
    } else {
      console.log('   ❌ Firebase-to-JWT conversion failed');
    }
    
    console.log('\n✅ Firebase-to-JWT Conversion Test Complete');
    console.log('================================================================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
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
testFirebaseToJWT();
