// navigation/StatsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatsScreen from '../screens/stats/Stats';
import FlowStatsDetail from '../components/FlowStats/FlowStatsDetail';

const Stack = createNativeStackNavigator();

const StatsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="StatsMain" 
        component={StatsScreen}
        options={{
          title: 'Statistics',
        }}
      />
      <Stack.Screen 
        name="FlowStatsDetail" 
        component={FlowStatsDetail}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default StatsStack;
