// src/navigation/SettingsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Settings from '../screens/settings/Settings';
import SettingsMenu from '../screens/settings/SettingsMenu';
import AccountSettings from '../screens/settings/AccountSettings';
import NotificationSettings from '../screens/settings/NotificationSettings';
import PrivacySettings from '../screens/settings/PrivacySettings';
import LocationSettings from '../screens/settings/LocationSettings';
import CheatModeSettings from '../screens/settings/CheatModeSettings';
import HelpAbout from '../screens/settings/HelpAbout';

const Stack = createNativeStackNavigator();

const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Settings" 
        component={Settings}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name="SettingsMenu" 
        component={SettingsMenu}
        options={{
          title: 'Settings Menu',
        }}
      />
      <Stack.Screen 
        name="AccountSettings" 
        component={AccountSettings}
        options={{
          title: 'Account Settings',
        }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettings}
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={PrivacySettings}
        options={{
          title: 'Privacy',
        }}
      />
      <Stack.Screen 
        name="LocationSettings" 
        component={LocationSettings}
        options={{
          title: 'Location',
        }}
      />
      <Stack.Screen 
        name="CheatModeSettings" 
        component={CheatModeSettings}
        options={{
          title: 'Cheat Mode',
        }}
      />
      <Stack.Screen 
        name="HelpAbout" 
        component={HelpAbout}
        options={{
          title: 'Help & About',
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsStack;