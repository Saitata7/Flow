// navigation/AuthNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'react-native-haptic-feedback';
import Login from '../auth/Login';
import Register from '../auth/Register';
import { colors } from '../styles';

const screenOptions = {
  headerShown: false,
  presentation: 'card',
  gestureEnabled: true,
  cardStyle: { borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.light.background },
  transitionSpec: {
    open: { animation: 'spring', config: { damping: 20, stiffness: 90, mass: 1 } },
    close: { animation: 'spring', config: { damping: 20, stiffness: 90, mass: 1 } },
  },
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [{
        scale: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      }],
    },
  }),
};

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={screenOptions}
      onTransitionStart={() => Haptics.trigger('impactMedium')}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      {/* Add ForgotPassword screen if needed */}
    </Stack.Navigator>
  );
};

export default AuthNavigator;