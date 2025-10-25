// debug-sync.js
// Quick script to check sync status and test API connection

import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtApiService from './src/services/jwtApiService';

const FLOWS_STORAGE_KEY = 'flows_data';

async function debugSyncStatus() {
  console.log('🔍 Debug Sync Status');
  
  try {
    // Check local flows
    const localFlows = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
    const flows = localFlows ? JSON.parse(localFlows) : [];
    
    console.log('📱 Local flows count:', flows.length);
    console.log('📱 Local flows:', flows.map(f => ({ 
      id: f.id, 
      title: f.title, 
      storagePreference: f.storagePreference 
    })));
    
    // Check for "king" habit specifically
    const kingFlow = flows.find(f => f.title === 'king');
    if (kingFlow) {
      console.log('👑 Found "king" habit:', {
        id: kingFlow.id,
        title: kingFlow.title,
        storagePreference: kingFlow.storagePreference,
        createdAt: kingFlow.createdAt,
        updatedAt: kingFlow.updatedAt
      });
      
      // Test API connection
      console.log('🌐 Testing API connection...');
      try {
        const apiResult = await jwtApiService.getFlows();
        console.log('✅ API connection successful:', apiResult);
      } catch (apiError) {
        console.log('❌ API connection failed:', apiError.message);
      }
    } else {
      console.log('❌ "king" habit not found in local storage');
    }
    
    // Check sync queue
    const syncQueue = await AsyncStorage.getItem('sync_queue');
    const queue = syncQueue ? JSON.parse(syncQueue) : [];
    console.log('🔄 Sync queue:', queue);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugSyncStatus();
