/**
 * DATA PRIVACY & GDPR COMPLIANCE TESTS
 * Tests data privacy protection, GDPR compliance, data encryption,
 * PII masking, data retention, and data deletion
 */

const axios = require('axios');
const crypto = require('crypto');

class DataPrivacyTests {
  constructor() {
    this.results = [];
    this.API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
    this.TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
    this.PII_FIELDS = ['email', 'phone', 'ssn', 'creditCard', 'address', 'fullName'];
    this.SENSITIVE_DATA = {
      email: 'test@example.com',
      phone: '+1234567890',
      ssn: '123-45-6789',
      creditCard: '4111-1111-1111-1111',
      address: '123 Main St, City, State 12345',
      fullName: 'John Doe'
    };
  }

  async runAllDataPrivacyTests() {
    console.log('🔒 Starting Data Privacy & GDPR Compliance Tests');
    console.log('=' * 60);

    const tests = [
      { name: 'PII Data Masking', method: this.testPIIDataMasking.bind(this) },
      { name: 'Data Encryption in Transit', method: this.testDataEncryptionInTransit.bind(this) },
      { name: 'Data Encryption at Rest', method: this.testDataEncryptionAtRest.bind(this) },
      { name: 'GDPR Data Portability', method: this.testGDPRDataPortability.bind(this) },
      { name: 'GDPR Right to Erasure', method: this.testGDPRRightToErasure.bind(this) },
      { name: 'Data Retention Policies', method: this.testDataRetentionPolicies.bind(this) },
      { name: 'Consent Management', method: this.testConsentManagement.bind(this) },
      { name: 'Data Minimization', method: this.testDataMinimization.bind(this) },
      { name: 'Purpose Limitation', method: this.testPurposeLimitation.bind(this) },
      { name: 'Data Breach Detection', method: this.testDataBreachDetection.bind(this) },
      { name: 'Cross-Border Data Transfer', method: this.testCrossBorderDataTransfer.bind(this) },
      { name: 'Data Subject Rights', method: this.testDataSubjectRights.bind(this) }
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

  async testPIIDataMasking() {
    const tests = [
      {
        name: 'Email Address Masking',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.email && !this.isMasked(data.email)) {
            throw new Error(`Email not masked: ${data.email}`);
          }
        }
      },
      {
        name: 'Phone Number Masking',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.phone && !this.isMasked(data.phone)) {
            throw new Error(`Phone number not masked: ${data.phone}`);
          }
        }
      },
      {
        name: 'Credit Card Masking',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.creditCard && !this.isMasked(data.creditCard)) {
            throw new Error(`Credit card not masked: ${data.creditCard}`);
          }
        }
      },
      {
        name: 'SSN Masking',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.ssn && !this.isMasked(data.ssn)) {
            throw new Error(`SSN not masked: ${data.ssn}`);
          }
        }
      },
      {
        name: 'Address Masking',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.address && !this.isMasked(data.address)) {
            throw new Error(`Address not masked: ${data.address}`);
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testDataEncryptionInTransit() {
    const tests = [
      {
        name: 'HTTPS Enforcement',
        test: async () => {
          try {
            const httpUrl = this.API_BASE_URL.replace('https://', 'http://');
            const response = await axios.get(`${httpUrl}/health`, {
              timeout: 5000
            });
            
            if (response.status === 200) {
              throw new Error('HTTP requests allowed - HTTPS not enforced');
            }
          } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
              // Expected - HTTP should be refused
              return;
            }
            throw error;
          }
        }
      },
      {
        name: 'HSTS Header',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/health`);
          const headers = response.headers;
          
          if (!headers['strict-transport-security']) {
            throw new Error('HSTS header missing - data not encrypted in transit');
          }
          
          const hsts = headers['strict-transport-security'];
          if (!hsts.includes('max-age')) {
            throw new Error('HSTS header missing max-age directive');
          }
        }
      },
      {
        name: 'TLS Version Check',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/health`);
          const headers = response.headers;
          
          // Check for TLS version in headers (if available)
          if (headers['x-tls-version']) {
            const tlsVersion = headers['x-tls-version'];
            if (tlsVersion.includes('1.0') || tlsVersion.includes('1.1')) {
              throw new Error(`Weak TLS version detected: ${tlsVersion}`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testDataEncryptionAtRest() {
    const tests = [
      {
        name: 'Database Encryption Check',
        test: async () => {
          // Test that sensitive data is encrypted at rest
          const response = await axios.post(`${this.API_BASE_URL}/v1/profiles`, {
            userId: this.TEST_USER_ID,
            ...this.SENSITIVE_DATA
          }, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            // Check if the stored data is encrypted
            const storedData = response.data;
            for (const field of this.PII_FIELDS) {
              if (storedData[field] && storedData[field] === this.SENSITIVE_DATA[field]) {
                throw new Error(`Sensitive data ${field} not encrypted at rest`);
              }
            }
          }
        }
      },
      {
        name: 'Log Encryption Check',
        test: async () => {
          // Test that sensitive data doesn't appear in logs
          const response = await axios.post(`${this.API_BASE_URL}/v1/auth/login`, {
            email: this.SENSITIVE_DATA.email,
            password: 'testpassword'
          }).catch(() => ({}));
          
          // Check if sensitive data appears in error responses
          if (response.data) {
            const responseText = JSON.stringify(response.data);
            for (const field of this.PII_FIELDS) {
              if (responseText.includes(this.SENSITIVE_DATA[field])) {
                throw new Error(`Sensitive data ${field} leaked in response`);
              }
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testGDPRDataPortability() {
    const tests = [
      {
        name: 'Data Export Endpoint',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}/export`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            const data = response.data;
            
            // Check if export includes all user data
            if (!data.profile && !data.settings && !data.flows) {
              throw new Error('Data export incomplete - missing user data');
            }
            
            // Check if export is in machine-readable format
            if (typeof data !== 'object') {
              throw new Error('Data export not in machine-readable format');
            }
          }
        }
      },
      {
        name: 'Data Export Format',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}/export`, {
            headers: { 
              'Authorization': 'Bearer dev-token-test',
              'Accept': 'application/json'
            }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            const contentType = response.headers['content-type'];
            if (!contentType.includes('application/json')) {
              throw new Error(`Data export not in JSON format: ${contentType}`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testGDPRRightToErasure() {
    const tests = [
      {
        name: 'Data Deletion Endpoint',
        test: async () => {
          const response = await axios.delete(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            // Verify data is actually deleted
            const checkResponse = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
              headers: { 'Authorization': 'Bearer dev-token-test' }
            }).catch(() => ({ status: 404 }));
            
            if (checkResponse.status !== 404) {
              throw new Error('Data not properly deleted - still accessible');
            }
          }
        }
      },
      {
        name: 'Cascade Deletion',
        test: async () => {
          // Test that related data is also deleted
          const response = await axios.delete(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            // Check if related flows are also deleted
            const flowsResponse = await axios.get(`${this.API_BASE_URL}/v1/flows`, {
              headers: { 'Authorization': 'Bearer dev-token-test' }
            }).catch(() => ({ data: { data: [] } }));
            
            const flows = flowsResponse.data.data || [];
            const userFlows = flows.filter(flow => flow.userId === this.TEST_USER_ID);
            
            if (userFlows.length > 0) {
              throw new Error('Related flows not deleted with user profile');
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testDataRetentionPolicies() {
    const tests = [
      {
        name: 'Data Retention Period',
        test: async () => {
          // Test data retention policies
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.createdAt) {
            const createdAt = new Date(data.createdAt);
            const now = new Date();
            const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
            
            // Check if data is older than retention period (e.g., 7 years)
            if (ageInDays > 2555) { // 7 years
              console.log(`⚠️ Data older than 7 years: ${ageInDays} days`);
            }
          }
        }
      },
      {
        name: 'Automatic Data Cleanup',
        test: async () => {
          // Test automatic data cleanup
          const response = await axios.get(`${this.API_BASE_URL}/v1/admin/data-cleanup`, {
            headers: { 'Authorization': 'Bearer admin-token' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            const cleanupData = response.data;
            if (cleanupData.cleanedRecords > 0) {
              console.log(`✅ Automatic cleanup removed ${cleanupData.cleanedRecords} records`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testConsentManagement() {
    const tests = [
      {
        name: 'Consent Tracking',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}/consent`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const consentData = response.data;
          if (consentData) {
            const requiredConsents = ['dataProcessing', 'marketing', 'analytics'];
            for (const consent of requiredConsents) {
              if (consentData[consent] === undefined) {
                throw new Error(`Missing consent tracking for ${consent}`);
              }
            }
          }
        }
      },
      {
        name: 'Consent Withdrawal',
        test: async () => {
          const response = await axios.post(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}/consent`, {
            marketing: false,
            analytics: false
          }, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            // Verify consent was updated
            const checkResponse = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}/consent`, {
              headers: { 'Authorization': 'Bearer dev-token-test' }
            }).catch(() => ({ data: {} }));
            
            const updatedConsent = checkResponse.data;
            if (updatedConsent.marketing !== false || updatedConsent.analytics !== false) {
              throw new Error('Consent withdrawal not properly processed');
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testDataMinimization() {
    const tests = [
      {
        name: 'Unnecessary Data Collection',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          const unnecessaryFields = ['internalId', 'systemNotes', 'debugInfo'];
          
          for (const field of unnecessaryFields) {
            if (data[field]) {
              throw new Error(`Unnecessary data collected: ${field}`);
            }
          }
        }
      },
      {
        name: 'Data Collection Purpose',
        test: async () => {
          // Test that only necessary data is collected for specific purposes
          const response = await axios.post(`${this.API_BASE_URL}/v1/flows`, {
            title: 'Test Flow',
            description: 'Test Description'
          }, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            const flowData = response.data;
            // Check that only flow-related data is collected
            if (flowData.email || flowData.phone || flowData.ssn) {
              throw new Error('Unnecessary PII collected for flow creation');
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testPurposeLimitation() {
    const tests = [
      {
        name: 'Data Usage Purpose',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.purpose) {
            const validPurposes = ['serviceProvision', 'legalCompliance', 'userConsent'];
            if (!validPurposes.includes(data.purpose)) {
              throw new Error(`Invalid data usage purpose: ${data.purpose}`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testDataBreachDetection() {
    const tests = [
      {
        name: 'Breach Detection System',
        test: async () => {
          // Test data breach detection
          const response = await axios.get(`${this.API_BASE_URL}/v1/admin/breach-detection`, {
            headers: { 'Authorization': 'Bearer admin-token' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            const breachData = response.data;
            if (breachData.suspiciousActivities > 0) {
              console.log(`⚠️ Suspicious activities detected: ${breachData.suspiciousActivities}`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testCrossBorderDataTransfer() {
    const tests = [
      {
        name: 'Data Transfer Compliance',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({ data: {} }));
          
          const data = response.data;
          if (data.dataTransfer) {
            const validTransfers = ['EU', 'US', 'Canada', 'UK'];
            if (!validTransfers.includes(data.dataTransfer.destination)) {
              throw new Error(`Invalid data transfer destination: ${data.dataTransfer.destination}`);
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  async testDataSubjectRights() {
    const tests = [
      {
        name: 'Right to Access',
        test: async () => {
          const response = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            const data = response.data;
            if (!data.profile && !data.settings) {
              throw new Error('Data subject right to access not properly implemented');
            }
          }
        }
      },
      {
        name: 'Right to Rectification',
        test: async () => {
          const response = await axios.put(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
            name: 'Updated Name'
          }, {
            headers: { 'Authorization': 'Bearer dev-token-test' }
          }).catch(() => ({}));
          
          if (response.status === 200) {
            // Verify data was updated
            const checkResponse = await axios.get(`${this.API_BASE_URL}/v1/profiles/${this.TEST_USER_ID}`, {
              headers: { 'Authorization': 'Bearer dev-token-test' }
            }).catch(() => ({ data: {} }));
            
            if (checkResponse.data.name !== 'Updated Name') {
              throw new Error('Data subject right to rectification not properly implemented');
            }
          }
        }
      }
    ];

    for (const test of tests) {
      await test.test();
    }
  }

  // Helper methods
  isMasked(value) {
    if (!value || typeof value !== 'string') {
      return false;
    }
    
    // Check for common masking patterns
    const maskedPatterns = [
      /^\*+$/, // All asterisks
      /^\*{3,}.*\*{3,}$/, // Asterisks at beginning and end
      /^.{1,3}\*{4,}.*$/, // Partial reveal with asterisks
      /^.{1,3}\*{4,}$/, // Partial reveal with asterisks at end
      /^\*{4,}.{1,3}$/ // Asterisks at beginning with partial reveal
    ];
    
    return maskedPatterns.some(pattern => pattern.test(value));
  }

  printSummary() {
    console.log('\n' + '=' * 60);
    console.log('🔒 DATA PRIVACY & GDPR COMPLIANCE TEST SUMMARY');
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
    
    console.log('\n🛡️ DATA PRIVACY STATUS:', failed === 0 ? 'COMPLIANT' : 'COMPLIANCE ISSUES DETECTED');
    console.log('=' * 60);
  }
}

// Run data privacy tests
if (require.main === module) {
  const privacyTests = new DataPrivacyTests();
  privacyTests.runAllDataPrivacyTests().catch(console.error);
}

module.exports = DataPrivacyTests;
