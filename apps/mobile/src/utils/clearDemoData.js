// utils/clearDemoData.js
// Utility to clear demo/test data

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clear all demo data from storage
 */
export const clearDemoData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const demoKeys = keys.filter(key => 
      key.includes('demo') || 
      key.includes('test') || 
      key.includes('mock')
    );
    
    if (demoKeys.length > 0) {
      await AsyncStorage.multiRemove(demoKeys);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return false;
  }
};

export default clearDemoData;
