// utils/clearDemoData.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearDemoData = async () => {
  try {
    // Clear all possible demo data keys
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('demo_user');
    
    console.log('✅ Demo data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    return false;
  }
};

export default clearDemoData;
