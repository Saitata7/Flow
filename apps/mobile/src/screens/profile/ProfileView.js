import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, layout } from '../../../styles';

const ProfileView = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile View</Text>
        <Text style={styles.subtitle}>Profile management coming soon</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
  },
  title: {
    ...typography.styles.title1,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.sm,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    textAlign: 'center',
  },
});

export default ProfileView;
