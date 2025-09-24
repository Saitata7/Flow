// utils/fcmTestUtils.js
import notificationService from '../services/notificationService';

// FCM Testing Utilities

export const testFCMSetup = async () => {
  console.log('🧪 Testing FCM Setup...');
  
  try {
    // Test 1: Check if FCM is initialized
    console.log('✅ Test 1: Checking FCM initialization...');
    const initialized = await notificationService.initialize();
    console.log(`FCM Initialized: ${initialized}`);
    
    // Test 2: Check permissions
    console.log('✅ Test 2: Checking notification permissions...');
    const permissionsEnabled = await notificationService.areNotificationsEnabled();
    console.log(`Permissions Enabled: ${permissionsEnabled}`);
    
    // Test 3: Get FCM token
    console.log('✅ Test 3: Getting FCM token...');
    const token = await notificationService.getToken();
    console.log(`FCM Token: ${token ? 'Generated successfully' : 'Failed to generate'}`);
    if (token) {
      console.log(`Token: ${token}`);
    }
    
    // Test 4: Test local notification
    console.log('✅ Test 4: Testing local notification...');
    await notificationService.sendTestNotification();
    console.log('Test notification sent');
    
    // Test 5: Check notification settings
    console.log('✅ Test 5: Checking notification settings...');
    const settings = await notificationService.getNotificationSettings();
    console.log('Notification Settings:', settings);
    
    console.log('🎉 FCM Setup Test Complete!');
    
    return {
      success: true,
      initialized,
      permissionsEnabled,
      hasToken: !!token,
      token,
      settings
    };
    
  } catch (error) {
    console.error('❌ FCM Setup Test Failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const testAchievementNotification = async () => {
  console.log('🏆 Testing Achievement Notification...');
  
  try {
    const achievementData = {
      id: 'test_achievement',
      title: 'Test Achievement',
      description: 'This is a test achievement',
      icon: '🎯',
      message: 'Congratulations! You unlocked a test achievement!'
    };
    
    await notificationService.sendAchievementAlert(achievementData);
    console.log('✅ Achievement notification sent successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Achievement notification test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testCommunityNotification = async () => {
  console.log('👥 Testing Community Notification...');
  
  try {
    const updateData = {
      message: 'Test community update: New challenges are available!',
      type: 'community_update'
    };
    
    await notificationService.sendCommunityUpdate(updateData);
    console.log('✅ Community notification sent successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Community notification test failed:', error);
    return { success: false, error: error.message };
  }
};

export const testNotificationSettings = async () => {
  console.log('⚙️ Testing Notification Settings...');
  
  try {
    // Test saving settings
    const testSettings = {
      dailyReminders: true,
      weeklyReports: false,
      achievementAlerts: true,
      communityUpdates: false,
      reminderTime: '10:00',
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    };
    
    await notificationService.updateNotificationSettings(testSettings);
    console.log('✅ Settings saved successfully');
    
    // Test retrieving settings
    const retrievedSettings = await notificationService.getNotificationSettings();
    console.log('✅ Settings retrieved successfully:', retrievedSettings);
    
    // Verify settings match
    const settingsMatch = JSON.stringify(testSettings) === JSON.stringify(retrievedSettings);
    console.log(`Settings Match: ${settingsMatch}`);
    
    return { 
      success: true, 
      settingsMatch,
      testSettings,
      retrievedSettings
    };
  } catch (error) {
    console.error('❌ Notification settings test failed:', error);
    return { success: false, error: error.message };
  }
};

export const runAllFCMTests = async () => {
  console.log('🚀 Running All FCM Tests...');
  console.log('================================');
  
  const results = {
    setup: await testFCMSetup(),
    achievement: await testAchievementNotification(),
    community: await testCommunityNotification(),
    settings: await testNotificationSettings()
  };
  
  console.log('================================');
  console.log('📊 Test Results Summary:');
  console.log(`Setup: ${results.setup.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Achievement: ${results.achievement.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Community: ${results.community.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Settings: ${results.settings.success ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result.success);
  console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return results;
};

// Debug helper to log FCM token for server testing
export const logFCMTokenForServerTesting = async () => {
  try {
    const token = await notificationService.getToken();
    console.log('\n🔑 FCM Token for Server Testing:');
    console.log('================================');
    console.log(token);
    console.log('================================');
    console.log('Copy this token to test server-side notifications');
    
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
};
