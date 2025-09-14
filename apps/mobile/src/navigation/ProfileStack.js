// src/navigation/ProfileStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileDashboard from '../screens/profile/ProfileDashboard';
import ProfileView from '../screens/profile/ProfileView';
import EditProfile from '../screens/profile/EditProfile';
import ProfilePublicView from '../screens/profile/ProfilePublicView';
import ProfileShare from '../screens/profile/ProfileShare';

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ProfileDashboard" 
        component={ProfileDashboard}
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name="ProfileView" 
        component={ProfileView}
        options={{
          title: 'View Profile',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfile}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen 
        name="ProfilePublicView" 
        component={ProfilePublicView}
        options={{
          title: 'Public Profile',
        }}
      />
      <Stack.Screen 
        name="ProfileShare" 
        component={ProfileShare}
        options={{
          title: 'Share Profile',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;