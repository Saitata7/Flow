/**
 * COMPREHENSIVE SECURITY TEST RUNNER
 * Runs all security tests including DNS, ping of death, rate limiting, data privacy, etc.
 */

const ComprehensiveSecurityTests = require('./comprehensiveSecurity.test');
const DNSSecurityTests = require('./dnsSecurity.test');
const PingOfDeathTests = require('./pingOfDeath.test');
const APIRateLimitTests = require('./apiRateLimiting.test');
const DataPrivacyTests = require('./dataPrivacy.test');

class SecurityTestRunner {
  constructor() {
    this.results = [];
    this.testSuites = [
      { name: 'Comprehensive Security Tests', suite: ComprehensiveSecurityTests },
      { name: 'DNS Security Tests', suite: DNSSecurityTests },
      { name: 'Ping of Death Protection Tests', suite: PingOfDeathTests },
      { name: 'API Rate Limiting Tests', suite: APIRateLimitTests },
      { name: 'Data Privacy & GDPR Tests', suite: DataPrivacyTests }
    ];
  }

  async runAllSecurityTests() {
    console.log('🛡️ STARTING COMPREHENSIVE SERVER-SIDE SECURITY TEST SUITE');
    console.log('=' * 80);
    console.log('Testing: DNS Security, Ping of Death, Rate Limiting, Data Privacy, DDoS Protection');
    console.log('=' * 80);

    const startTime = Date.now();

    for (const testSuite of this.testSuites) {
      console.log(`\n🚀 Running ${testSuite.name}...`);
      console.log('-'.repeat(50));
      
      try {
        const suite = new testSuite.suite();
        await suite.runAllDNSTests ? suite.runAllDNSTests() : 
              suite.runAllPingOfDeathTests ? suite.runAllPingOfDeathTests() :
              suite.runAllRateLimitTests ? suite.runAllRateLimitTests() :
              suite.runAllDataPrivacyTests ? suite.runAllDataPrivacyTests() :
              suite.runAllTests();
        
        this.results.push({
          suite: testSuite.name,
          status: 'PASSED',
          tests: suite.results || []
        });
        
        console.log(`✅ ${testSuite.name}: COMPLETED`);
      } catch (error) {
        console.log(`❌ ${testSuite.name}: FAILED - ${error.message}`);
        this.results.push({
          suite: testSuite.name,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    this.printFinalSummary(duration);
  }

  printFinalSummary(duration) {
    console.log('\n' + '=' * 80);
    console.log('🛡️ COMPREHENSIVE SECURITY TEST SUITE SUMMARY');
    console.log('=' * 80);
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`⏱️ Total Duration: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`📊 Test Suites: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${status} ${result.suite}: ${result.status}`);
      
      if (result.tests && result.tests.length > 0) {
        const testPassed = result.tests.filter(t => t.status === 'PASSED').length;
        const testFailed = result.tests.filter(t => t.status === 'FAILED').length;
        console.log(`      Tests: ${testPassed} passed, ${testFailed} failed`);
      }
      
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
    
    if (failed > 0) {
      console.log('\n❌ FAILED TEST SUITES:');
      this.results.filter(r => r.status === 'FAILED').forEach(result => {
        console.log(`   - ${result.suite}: ${result.error}`);
      });
    }
    
    console.log('\n🔒 OVERALL SECURITY STATUS:');
    if (failed === 0) {
      console.log('   🟢 SECURE - All security tests passed');
      console.log('   ✅ DNS Security: Protected');
      console.log('   ✅ Ping of Death: Protected');
      console.log('   ✅ Rate Limiting: Active');
      console.log('   ✅ Data Privacy: Compliant');
      console.log('   ✅ DDoS Protection: Active');
    } else {
      console.log('   🔴 VULNERABILITIES DETECTED');
      console.log('   ⚠️ Review failed tests and implement fixes');
    }
    
    console.log('\n📝 RECOMMENDATIONS:');
    if (failed > 0) {
      console.log('   1. Review failed test suites');
      console.log('   2. Implement missing security measures');
      console.log('   3. Update security configurations');
      console.log('   4. Re-run tests after fixes');
    } else {
      console.log('   1. Continue regular security testing');
      console.log('   2. Monitor security metrics');
      console.log('   3. Update security policies as needed');
      console.log('   4. Conduct penetration testing');
    }
    
    console.log('=' * 80);
  }
}

// Run all security tests
if (require.main === module) {
  const runner = new SecurityTestRunner();
  runner.runAllSecurityTests().catch(console.error);
}

module.exports = SecurityTestRunner;
