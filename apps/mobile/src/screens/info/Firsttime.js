// screens/splash/Firsttime.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, layout } from '../../../styles';
import useFirstTime from '../../hooks/useFirstTime'; // To mark first time as complete

const Firsttime = ({ navigation }) => {
  const { markFirstLaunchComplete } = useFirstTime();

  const handleContinue = () => {
    markFirstLaunchComplete();
    navigation.replace('Auth');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Flow Tracker!</Text>
      <Text style={styles.description}>
        This is your first time using the app. Here's some info to get you started with tracking your flows.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.background,
    padding: layout.spacing.lg,
  },
  title: {
    ...typography.styles.largeTitle,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
  },
  description: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    textAlign: 'center',
    marginBottom: layout.spacing.lg,
  },
  button: {
    backgroundColor: colors.light.primaryOrange,
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    ...typography.styles.headline,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default Firsttime;