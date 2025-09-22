// screens/splash/Splash.js
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, layout } from '../../../styles';
import useFirstTime from '../../hooks/useFirstTime';
import useAuth from '../../hooks/useAuth';

const Splash = () => {
  const navigation = useNavigation();
  const { isFirstLaunch, isLoading } = useFirstTime();
  const { user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Add a small delay to ensure navigation stack is ready
      const timer = setTimeout(() => {
        if (isFirstLaunch) {
          navigation.replace('Onboarding');
        } else if (user) {
          navigation.replace('Main');
        } else {
          navigation.replace('Auth');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isFirstLaunch, user, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Flow Tracker</Text>
      <ActivityIndicator size="large" color={colors.light.primaryOrange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.background,
  },
  logo: {
    ...typography.styles.largeTitle,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.lg,
  },
});

export default Splash;