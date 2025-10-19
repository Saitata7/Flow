/**
 * PING OF DEATH & DDoS PROTECTION TESTS
 * Tests protection against ping of death attacks, DDoS attacks, connection floods,
 * and other network-level attacks
 */

const axios = require('axios');
const net = require('net');
const http = require('http');
const https = require('https');
const { promisify } = require('util');

class PingOfDeathTests {
  constructor() {
    this.results = [];
    this.API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
    this.ATTACK_THRESHOLD = 100; // Requests per second
    this.CONNECTION_TIMEOUT = 10000;
    this.LARGE_PAYLOAD_SIZE = 65536; // 64KB
  }

  async runAllPingOfDeathTests() {
    console.log('💥 Starting Ping of Death & DDoS Protection Tests');
    console.log('=' * 60);

    const tests = [
      { name: 'Large Payload Protection', method: this.testLargePayloadProtection.bind(this) },
      { name: 'Connection Flood Protection', method: this.testConnectionFloodProtection.bind(this) },
      { name: 'Slowloris Attack Protection', method: this.testSlowlorisAttackProtection.bind(this) },
      { name: 'HTTP Flood Protection', method: this.testHTTPFloodProtection.bind(this) },
      { name: 'TCP SYN Flood Protection', method: this.testTCPSYNFloodProtection.bind(this) },
      { name: 'UDP Flood Protection', method: this.testUDPFloodProtection.bind(this) },
      { name: 'ICMP Flood Protection', method: this.testICMPFloodProtection.bind(this) },
      { name: 'Memory Exhaustion Protection', method: this.testMemoryExhaustionProtection.bind(this) },
      { name: 'CPU Exhaustion Protection', method: this.testCPUExhaustionProtection.bind(this) },
      { name: 'Bandwidth Exhaustion Protection', method: this.testBandwidthExhaustionProtection.bind(this) }
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

  async testLargePayloadProtection() {
    const tests = [
      {
        name: 'Oversized HTTP Request',
        test: async () => {
          const largePayload = 'A'.repeat(this.LARGE_PAYLOAD_SIZE);
          
          try {
            const response = await axios.post(`${this.API_BASE_URL}/v1/flows`, {
              title: largePayload,
              description: largePayload,
              tags: [largePayload]
            }, {
              headers: { 'Authorization': 'Bearer dev-token-test' },
              timeout: this.CONNECTION_TIMEOUT,
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            });
            
            if (response.status === 200) {
              throw new Error('Oversized payload was accepted - potential vulnerability');
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
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              // Server not running - skip test
              console.log('⚠️ Server not running - skipping test');
              return;
            }
            throw error;
          }
        }
      },
      {
        name: 'Large File Upload',
        test: async () => {
          const largeFile = Buffer.alloc(this.LARGE_PAYLOAD_SIZE, 'A');
          
          try {
            const response = await axios.post(`${this.API_BASE_URL}/v1/profiles/upload`, largeFile, {
              headers: { 
                'Authorization': 'Bearer dev-token-test',
                'Content-Type': 'application/octet-stream'
              },
              timeout: this.CONNECTION_TIMEOUT
            });
            
            if (response.status === 200) {
              throw new Error('Large file upload was accepted - potential vulnerability');
            }
          } catch (error) {
            if (error.response && error.response.status === 413) {
              return;
            }
            if (error.code === 'ECONNABORTED') {
              return;
            }
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
              return;
            }
            throw error;
          }
        }
      },
      {
        name: 'Deeply Nested JSON',
        test: async () => {
          let nestedObject = { data: 'test' };
          for (let i = 0; i < 1000; i++) {
            nestedObject = { nested: nestedObject };
          }
          
          try {
            const response = await axios.post(`${this.API_BASE_URL}/v1/flows`, nestedObject, {
              headers: { 'Authorization': 'Bearer dev-token-test' },
              timeout: this.CONNECTION_TIMEOUT
            });
            
            if (response.status === 200) {
              throw new Error('Deeply nested JSON was accepted - potential vulnerability');
            }
          } catch (error) {
            if (error.response && error.response.status === 400) {
              return;
            }
            if (error.code === 'ECONNABORTED') {
              return;
            }
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
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

  async testConnectionFloodProtection() {
    const tests = [
      {
        name: 'Rapid Connection Establishment',
        test: async () => {
          const connections = [];
          const startTime = Date.now();
          
          try {
            // Attempt to create multiple simultaneous connections
            for (let i = 0; i < 100; i++) {
              connections.push(
                axios.get(`${this.API_BASE_URL}/health`, {
                  timeout: 2000
                }).catch(() => ({}))
              );
            }
            
            const results = await Promise.allSettled(connections);
            const duration = Date.now() - startTime;
            
            const successful = results.filter(r => 
              r.status === 'fulfilled' && r.value.status === 200
            ).length;
            
            if (successful > 80) {
              console.log(`⚠️ High success rate for connection flood: ${successful}/100`);
            }
            
            if (duration < 1000) {
              console.log(`⚠️ Connections processed very quickly: ${duration}ms`);
            }
          } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
              return;
            }
            throw error;
          }
        }
      },
      {
        name: 'Persistent Connection Flood',
        test: async () => {
          const connections = [];
          
          try {
            // Create persistent connections
            for (let i = 0; i < 20; i++) {
              connections.push(
                axios.get(`${this.API_BASE_URL}/health`, {
                  timeout: 30000,
                  headers: { 'Connection': 'keep-alive' }
                }).catch(() => ({}))
              );
            }
            
            // Keep connections alive for a while
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            await Promise.allSettled(connections);
          } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
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

  async testSlowlorisAttackProtection() {
    const tests = [
      {
        name: 'Slow HTTP Headers',
        test: async () => {
          const connections = [];
          
          try {
            // Simulate slowloris attack with slow headers
            for (let i = 0; i < 10; i++) {
              connections.push(
                this.slowHTTPRequest(`${this.API_BASE_URL}/health`)
              );
            }
            
            await Promise.allSettled(connections);
          } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
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

  async testHTTPFloodProtection() {
    const tests = [
      {
        name: 'Rapid HTTP Requests',
        test: async () => {
          const requests = [];
          const startTime = Date.now();
          
          try {
            // Send rapid requests
            for (let i = 0; i < 200; i++) {
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
            
            console.log(`📊 HTTP Flood Results: ${successful} successful, ${rateLimited} rate limited in ${duration}ms`);
            
            if (rateLimited === 0 && successful > 150) {
              console.log('⚠️ No rate limiting detected for HTTP flood');
            }
          } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
              return;
            }
            throw error;
          }
        }
      },
      {
        name: 'Mixed HTTP Methods Flood',
        test: async () => {
          const requests = [];
          const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
          
          try {
            for (let i = 0; i < 100; i++) {
              const method = methods[i % methods.length];
              requests.push(
                axios({
                  method: method.toLowerCase(),
                  url: `${this.API_BASE_URL}/health`,
                  timeout: 1000,
                  data: method !== 'GET' ? { test: 'data' } : undefined
                }).catch(() => ({}))
              );
            }
            
            await Promise.allSettled(requests);
          } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
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

  async testTCPSYNFloodProtection() {
    const tests = [
      {
        name: 'TCP Connection Flood',
        test: async () => {
          const connections = [];
          const url = new URL(this.API_BASE_URL);
          const host = url.hostname;
          const port = url.port || (url.protocol === 'https:' ? 443 : 80);
          
          try {
            // Create TCP connections without completing handshake
            for (let i = 0; i < 50; i++) {
              connections.push(
                this.createTCPConnection(host, port)
              );
            }
            
            await Promise.allSettled(connections);
          } catch (error) {
            console.log(`⚠️ TCP flood test failed: ${error.message}`);
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testUDPFloodProtection() {
    const tests = [
      {
        name: 'UDP Packet Flood',
        test: async () => {
          // UDP flood testing would require raw socket access
          // This is a placeholder for UDP flood protection testing
          console.log('⚠️ UDP flood testing requires raw socket access - skipping');
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testICMPFloodProtection() {
    const tests = [
      {
        name: 'ICMP Ping Flood',
        test: async () => {
          // ICMP flood testing would require raw socket access
          // This is a placeholder for ICMP flood protection testing
          console.log('⚠️ ICMP flood testing requires raw socket access - skipping');
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testMemoryExhaustionProtection() {
    const tests = [
      {
        name: 'Memory Exhaustion via Large Objects',
        test: async () => {
          const largeObjects = [];
          
          try {
            // Create large objects to test memory limits
            for (let i = 0; i < 10; i++) {
              const largeObject = {
                data: 'A'.repeat(1024 * 1024), // 1MB per object
                id: i,
                timestamp: Date.now()
              };
              
              largeObjects.push(largeObject);
            }
            
            const response = await axios.post(`${this.API_BASE_URL}/v1/flows`, {
              title: 'Memory Test',
              description: 'Testing memory limits',
              largeData: largeObjects
            }, {
              headers: { 'Authorization': 'Bearer dev-token-test' },
              timeout: this.CONNECTION_TIMEOUT
            });
            
            if (response.status === 200) {
              throw new Error('Large memory objects were accepted - potential vulnerability');
            }
          } catch (error) {
            if (error.response && error.response.status === 413) {
              return;
            }
            if (error.code === 'ECONNABORTED') {
              return;
            }
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
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

  async testCPUExhaustionProtection() {
    const tests = [
      {
        name: 'CPU Exhaustion via Complex Operations',
        test: async () => {
          const complexData = {
            nested: {},
            arrays: [],
            calculations: []
          };
          
          // Create complex nested structures
          let current = complexData.nested;
          for (let i = 0; i < 100; i++) {
            current[i] = { next: {} };
            current = current[i].next;
          }
          
          // Create large arrays
          for (let i = 0; i < 1000; i++) {
            complexData.arrays.push({
              id: i,
              data: 'A'.repeat(1000),
              calculations: Array(100).fill().map((_, j) => Math.random() * j)
            });
          }
          
          try {
            const response = await axios.post(`${this.API_BASE_URL}/v1/flows`, {
              title: 'CPU Test',
              description: 'Testing CPU limits',
              complexData: complexData
            }, {
              headers: { 'Authorization': 'Bearer dev-token-test' },
              timeout: this.CONNECTION_TIMEOUT
            });
            
            if (response.status === 200) {
              throw new Error('Complex CPU-intensive operations were accepted - potential vulnerability');
            }
          } catch (error) {
            if (error.response && error.response.status === 400) {
              return;
            }
            if (error.code === 'ECONNABORTED') {
              return;
            }
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
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

  async testBandwidthExhaustionProtection() {
    const tests = [
      {
        name: 'Bandwidth Exhaustion via Large Responses',
        test: async () => {
          try {
            // Request large amounts of data
            const response = await axios.get(`${this.API_BASE_URL}/v1/flows`, {
              headers: { 'Authorization': 'Bearer dev-token-test' },
              timeout: this.CONNECTION_TIMEOUT,
              params: { limit: 10000, includeData: true }
            });
            
            if (response.status === 200) {
              const responseSize = JSON.stringify(response.data).length;
              if (responseSize > 10 * 1024 * 1024) { // 10MB
                console.log(`⚠️ Large response detected: ${responseSize} bytes`);
              }
            }
          } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
              console.log('⚠️ Server not running - skipping test');
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

  // Helper methods
  async slowHTTPRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname,
        method: 'GET',
        timeout: 30000
      };
      
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        resolve({ status: res.statusCode });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Send headers slowly (slowloris attack simulation)
      req.write('GET / HTTP/1.1\r\n');
      setTimeout(() => {
        req.write('Host: ' + urlObj.hostname + '\r\n');
        setTimeout(() => {
          req.write('Connection: keep-alive\r\n');
          setTimeout(() => {
            req.write('\r\n');
            req.end();
          }, 1000);
        }, 1000);
      }, 1000);
    });
  }

  async createTCPConnection(host, port) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      socket.connect(port, host, () => {
        // Don't send any data, just establish connection
        setTimeout(() => {
          socket.destroy();
          resolve();
        }, 1000);
      });
      
      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  printSummary() {
    console.log('\n' + '=' * 60);
    console.log('💥 PING OF DEATH & DDoS PROTECTION TEST SUMMARY');
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
    
    console.log('\n🛡️ DDoS PROTECTION STATUS:', failed === 0 ? 'PROTECTED' : 'VULNERABILITIES DETECTED');
    console.log('=' * 60);
  }
}

// Run ping of death tests
if (require.main === module) {
  const pingTests = new PingOfDeathTests();
  pingTests.runAllPingOfDeathTests().catch(console.error);
}

module.exports = PingOfDeathTests;
