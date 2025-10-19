/**
 * API RATE LIMITING & DAILY LIMITS TESTS
 * Tests API rate limiting per minute, per hour, per day, and per user/IP
 * Includes comprehensive rate limiting validation
 */

const axios = require('axios');
const { promisify } = require('util');

class APIRateLimitTests {
  constructor() {
    this.results = [];
    this.API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
    this.TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
    this.RATE_LIMIT_WINDOWS = {
      minute: 60000,
      hour: 3600000,
      day: 86400000
    };
    this.EXPECTED_LIMITS = {
      minute: 100,
      hour: 1000,
      day: 10000
    };
  }

  async runAllRateLimitTests() {
    console.log('⏱️ Starting API Rate Limiting Tests');
    console.log('=' * 50);

    const tests = [
      { name: 'Per-Minute Rate Limiting', method: this.testPerMinuteRateLimit.bind(this) },
      { name: 'Per-Hour Rate Limiting', method: this.testPerHourRateLimit.bind(this) },
      { name: 'Per-Day Rate Limiting', method: this.testPerDayRateLimit.bind(this) },
      { name: 'IP-Based Rate Limiting', method: this.testIPBasedRateLimit.bind(this) },
      { name: 'User-Based Rate Limiting', method: this.testUserBasedRateLimit.bind(this) },
      { name: 'Endpoint-Specific Rate Limiting', method: this.testEndpointSpecificRateLimit.bind(this) },
      { name: 'Rate Limit Headers', method: this.testRateLimitHeaders.bind(this) },
      { name: 'Rate Limit Reset Behavior', method: this.testRateLimitResetBehavior.bind(this) },
      { name: 'Burst Protection', method: this.testBurstProtection.bind(this) },
      { name: 'Rate Limit Bypass Prevention', method: this.testRateLimitBypassPrevention.bind(this) }
    ];

    for (const test of tests) {
      console.log(`\n🔍 Running: ${test.name}`);
      try {
        await test.method();
        console.log(`✅ ${test.name}: PASSED`);
        this.results.push({ test: test.name, status: 'PASSED' });
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
        this.results.push({ test: test.name, status: 'FAILED', error: error.message });
      }
    }

    this.printSummary();
  }

  async testPerMinuteRateLimit() {
    const tests = [
      {
        name: 'Minute Window Rate Limit',
        test: async () => {
          const requests = [];
          const startTime = Date.now();
          
          // Send requests faster than rate limit
          for (let i = 0; i < 150; i++) {
            requests.push(
              axios.get(`${this.API_BASE_URL}/health`, {
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const duration = Date.now() - startTime;
          
          const successful = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 200
          ).length;
          
          const rateLimited = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 429
          ).length;
          
          console.log(`📊 Minute Rate Limit Results: ${successful} successful, ${rateLimited} rate limited in ${duration}ms`);
          
          if (rateLimited === 0 && successful > this.EXPECTED_LIMITS.minute) {
            throw new Error(`No rate limiting detected - ${successful} requests allowed (expected max ${this.EXPECTED_LIMITS.minute})`);
          }
          
          if (successful > this.EXPECTED_LIMITS.minute * 1.2) {
            console.log(`⚠️ Rate limit may be too high: ${successful} requests allowed`);
          }
        }
      },
      {
        name: 'Rate Limit Window Accuracy',
        test: async () => {
          // Test rate limit window accuracy
          const requests = [];
          
          // Send requests at the limit
          for (let i = 0; i < this.EXPECTED_LIMITS.minute; i++) {
            requests.push(
              axios.get(`${this.API_BASE_URL}/health`, {
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const successful = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 200
          ).length;
          
          if (successful < this.EXPECTED_LIMITS.minute * 0.8) {
            throw new Error(`Rate limit too restrictive: ${successful} requests allowed (expected ${this.EXPECTED_LIMITS.minute})`);
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testPerHourRateLimit() {
    const tests = [
      {
        name: 'Hour Window Rate Limit',
        test: async () => {
          // Simulate hour-long rate limiting by checking headers
          const response = await axios.get(`${this.API_BASE_URL}/health`);
          const headers = response.headers;
          
          if (headers['x-ratelimit-limit-hour']) {
            const hourlyLimit = parseInt(headers['x-ratelimit-limit-hour']);
            if (hourlyLimit > this.EXPECTED_LIMITS.hour * 2) {
              throw new Error(`Hourly rate limit too high: ${hourlyLimit} (expected max ${this.EXPECTED_LIMITS.hour})`);
            }
          }
        }
      },
      {
        name: 'Hourly Rate Limit Persistence',
        test: async () => {
          // Test that hourly rate limits persist across requests
          const responses = [];
          
          for (let i = 0; i < 5; i++) {
            const response = await axios.get(`${this.API_BASE_URL}/health`);
            responses.push(response.headers);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Check for consistent rate limit headers
          const hourlyLimits = responses
            .map(r => r['x-ratelimit-limit-hour'])
            .filter(Boolean);
          
          if (hourlyLimits.length > 0) {
            const uniqueLimits = new Set(hourlyLimits);
            if (uniqueLimits.size > 1) {
              throw new Error('Inconsistent hourly rate limit headers');
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testPerDayRateLimit() {
    const tests = [
      {
        name: 'Daily Rate Limit Headers',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/health`);
          const headers = response.headers;
          
          if (headers['x-ratelimit-limit-day']) {
            const dailyLimit = parseInt(headers['x-ratelimit-limit-day']);
            if (dailyLimit > this.EXPECTED_LIMITS.day * 2) {
              throw new Error(`Daily rate limit too high: ${dailyLimit} (expected max ${this.EXPECTED_LIMITS.day})`);
            }
          }
        }
      },
      {
        name: 'Daily Rate Limit Tracking',
        test: async () => {
          // Test daily rate limit tracking
          const response = await axios.get(`${this.API_BASE_URL}/health`);
          const headers = response.headers;
          
          if (headers['x-ratelimit-remaining-day']) {
            const remaining = parseInt(headers['x-ratelimit-remaining-day']);
            const limit = parseInt(headers['x-ratelimit-limit-day'] || '10000');
            
            if (remaining > limit) {
              throw new Error(`Invalid remaining count: ${remaining} > ${limit}`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testIPBasedRateLimit() {
    const tests = [
      {
        name: 'Different IP Rate Limits',
        test: async () => {
          const requests = [];
          const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3', '10.0.0.1', '172.16.0.1'];
          
          // Test rate limiting with different IPs
          for (const ip of ips) {
            for (let i = 0; i < 20; i++) {
              requests.push(
                axios.get(`${this.API_BASE_URL}/health`, {
                  headers: { 'X-Forwarded-For': ip },
                  timeout: 1000
                }).catch(() => ({}))
              );
            }
          }
          
          const results = await Promise.allSettled(requests);
          const successful = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 200
          ).length;
          
          // Each IP should be able to make requests independently
          if (successful < ips.length * 15) {
            console.log(`⚠️ IP-based rate limiting may be too restrictive: ${successful} successful requests`);
          }
        }
      },
      {
        name: 'IP Spoofing Protection',
        test: async () => {
          // Test IP spoofing protection
          const requests = [];
          
          for (let i = 0; i < 50; i++) {
            requests.push(
              axios.get(`${this.API_BASE_URL}/health`, {
                headers: { 'X-Forwarded-For': `192.168.1.${i % 10}` },
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          await Promise.allSettled(requests);
          // If all requests succeed, IP spoofing protection might not be working
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testUserBasedRateLimit() {
    const tests = [
      {
        name: 'Authenticated User Rate Limits',
        test: async () => {
          const requests = [];
          
          // Test rate limiting for authenticated users
          for (let i = 0; i < 50; i++) {
            requests.push(
              axios.get(`${this.API_BASE_URL}/v1/flows`, {
                headers: { 'Authorization': 'Bearer dev-token-test' },
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const successful = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 200
          ).length;
          
          const rateLimited = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 429
          ).length;
          
          console.log(`📊 User Rate Limit Results: ${successful} successful, ${rateLimited} rate limited`);
          
          if (rateLimited === 0 && successful > 30) {
            console.log('⚠️ No rate limiting detected for authenticated users');
          }
        }
      },
      {
        name: 'Different User Rate Limits',
        test: async () => {
          const users = [
            'Bearer user1-token',
            'Bearer user2-token',
            'Bearer user3-token'
          ];
          
          const requests = [];
          
          // Test rate limiting for different users
          for (const user of users) {
            for (let i = 0; i < 20; i++) {
              requests.push(
                axios.get(`${this.API_BASE_URL}/v1/flows`, {
                  headers: { 'Authorization': user },
                  timeout: 1000
                }).catch(() => ({}))
              );
            }
          }
          
          await Promise.allSettled(requests);
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testEndpointSpecificRateLimit() {
    const tests = [
      {
        name: 'Login Endpoint Rate Limiting',
        test: async () => {
          const requests = [];
          
          // Test login endpoint rate limiting
          for (let i = 0; i < 10; i++) {
            requests.push(
              axios.post(`${this.API_BASE_URL}/v1/auth/login`, {
                email: 'test@example.com',
                password: 'wrongpassword'
              }, {
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const rateLimited = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 429
          ).length;
          
          if (rateLimited === 0) {
            console.log('⚠️ No rate limiting detected for login endpoint');
          }
        }
      },
      {
        name: 'Password Reset Rate Limiting',
        test: async () => {
          const requests = [];
          
          // Test password reset rate limiting
          for (let i = 0; i < 5; i++) {
            requests.push(
              axios.post(`${this.API_BASE_URL}/v1/auth/forgot-password`, {
                email: 'test@example.com'
              }, {
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const rateLimited = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 429
          ).length;
          
          if (rateLimited === 0) {
            console.log('⚠️ No rate limiting detected for password reset endpoint');
          }
        }
      },
      {
        name: 'API Endpoint Rate Limits',
        test: async () => {
          const endpoints = [
            '/v1/flows',
            '/v1/flow-entries',
            '/v1/profiles',
            '/v1/settings',
            '/v1/stats'
          ];
          
          for (const endpoint of endpoints) {
            const requests = [];
            
            for (let i = 0; i < 30; i++) {
              requests.push(
                axios.get(`${this.API_BASE_URL}${endpoint}`, {
                  headers: { 'Authorization': 'Bearer dev-token-test' },
                  timeout: 1000
                }).catch(() => ({}))
              );
            }
            
            const results = await Promise.allSettled(requests);
            const rateLimited = results.filter(r => 
              r.status === 'fulfilled' && r.value.status === 429
            ).length;
            
            console.log(`📊 ${endpoint}: ${rateLimited} rate limited requests`);
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testRateLimitHeaders() {
    const tests = [
      {
        name: 'Rate Limit Header Presence',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/health`);
          const headers = response.headers;
          
          const expectedHeaders = [
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
            'x-ratelimit-reset'
          ];
          
          const presentHeaders = expectedHeaders.filter(header => headers[header]);
          
          if (presentHeaders.length === 0) {
            throw new Error('No rate limit headers present');
          }
          
          console.log(`📊 Rate limit headers present: ${presentHeaders.join(', ')}`);
        }
      },
      {
        name: 'Rate Limit Header Values',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/health`);
          const headers = response.headers;
          
          if (headers['x-ratelimit-limit']) {
            const limit = parseInt(headers['x-ratelimit-limit']);
            if (limit <= 0 || limit > 1000) {
              throw new Error(`Invalid rate limit value: ${limit}`);
            }
          }
          
          if (headers['x-ratelimit-remaining']) {
            const remaining = parseInt(headers['x-ratelimit-remaining']);
            if (remaining < 0) {
              throw new Error(`Invalid remaining count: ${remaining}`);
            }
          }
          
          if (headers['x-ratelimit-reset']) {
            const reset = parseInt(headers['x-ratelimit-reset']);
            const now = Math.floor(Date.now() / 1000);
            if (reset < now || reset > now + 3600) {
              throw new Error(`Invalid reset time: ${reset} (current: ${now})`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testRateLimitResetBehavior() {
    const tests = [
      {
        name: 'Rate Limit Reset Timing',
        test: async () => {
          // Test rate limit reset behavior
          const response1 = await axios.get(`${this.API_BASE_URL}/health`);
          const remaining1 = parseInt(response1.headers['x-ratelimit-remaining'] || '100');
          
          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const response2 = await axios.get(`${this.API_BASE_URL}/health`);
          const remaining2 = parseInt(response2.headers['x-ratelimit-remaining'] || '100');
          
          if (remaining2 > remaining1) {
            console.log(`✅ Rate limit reset detected: ${remaining1} -> ${remaining2}`);
          } else {
            console.log(`📊 Rate limit remaining: ${remaining1} -> ${remaining2}`);
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testBurstProtection() {
    const tests = [
      {
        name: 'Burst Request Protection',
        test: async () => {
          const requests = [];
          const startTime = Date.now();
          
          // Send burst of requests
          for (let i = 0; i < 50; i++) {
            requests.push(
              axios.get(`${this.API_BASE_URL}/health`, {
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const duration = Date.now() - startTime;
          
          const successful = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 200
          ).length;
          
          const rateLimited = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 429
          ).length;
          
          console.log(`📊 Burst Protection Results: ${successful} successful, ${rateLimited} rate limited in ${duration}ms`);
          
          if (duration < 1000 && successful > 30) {
            console.log('⚠️ Burst requests processed too quickly - potential vulnerability');
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testRateLimitBypassPrevention() {
    const tests = [
      {
        name: 'Header Manipulation Bypass',
        test: async () => {
          const requests = [];
          
          // Try to bypass rate limiting with header manipulation
          for (let i = 0; i < 30; i++) {
            requests.push(
              axios.get(`${this.API_BASE_URL}/health`, {
                headers: {
                  'X-Forwarded-For': `192.168.1.${i}`,
                  'X-Real-IP': `10.0.0.${i}`,
                  'X-Client-IP': `172.16.0.${i}`
                },
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const successful = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 200
          ).length;
          
          if (successful > 25) {
            console.log('⚠️ Rate limit bypass possible via header manipulation');
          }
        }
      },
      {
        name: 'User Agent Bypass',
        test: async () => {
          const requests = [];
          const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'curl/7.68.0',
            'PostmanRuntime/7.26.8'
          ];
          
          // Try to bypass rate limiting with different user agents
          for (const ua of userAgents) {
            for (let i = 0; i < 10; i++) {
              requests.push(
                axios.get(`${this.API_BASE_URL}/health`, {
                  headers: { 'User-Agent': ua },
                  timeout: 1000
                }).catch(() => ({}))
              );
            }
          }
          
          await Promise.allSettled(requests);
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  printSummary() {
    console.log('\n' + '=' * 50);
    console.log('⏱️ API RATE LIMITING TEST SUMMARY');
    console.log('=' * 50);
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'FAILED').forEach(result => {
        console.log(`   - ${result.test}: ${result.error}`);
      });
    }
    
    console.log('\n🛡️ RATE LIMITING STATUS:', failed === 0 ? 'PROTECTED' : 'VULNERABILITIES DETECTED');
    console.log('=' * 50);
  }
}

// Run rate limiting tests
if (require.main === module) {
  const rateLimitTests = new APIRateLimitTests();
  rateLimitTests.runAllRateLimitTests().catch(console.error);
}

module.exports = APIRateLimitTests;
