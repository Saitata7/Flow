// screens/plans/PlansLanding.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';

const PlansLanding = () => {
  const navigation = useNavigation();
  const { theme } = React.useContext(ThemeContext) || { theme: 'light' };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? colors.dark.background : colors.light.background,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: typography.sizes.xlarge,
      fontWeight: typography.weights.bold,
      color: theme === 'dark' ? colors.dark.text : colors.light.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    subtitle: {
      fontSize: typography.sizes.medium,
      color: theme === 'dark' ? colors.dark.textSecondary : colors.light.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
      lineHeight: 24,
    },
    button: {
      backgroundColor: colors.light.primaryOrange,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
      marginBottom: 20,
    },
    buttonText: {
      fontSize: typography.sizes.medium,
      fontWeight: typography.weights.semibold,
      color: '#fff',
      textAlign: 'center',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme === 'dark' ? colors.dark.border : colors.light.border,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
    },
    secondaryButtonText: {
      fontSize: typography.sizes.medium,
      fontWeight: typography.weights.semibold,
      color: theme === 'dark' ? colors.dark.text : colors.light.text,
      textAlign: 'center',
    },
  });

  const handleCreatePlan = () => {
    navigation.navigate('AddPlanFlow');
  };

  const handleBrowsePlans = () => {
    navigation.navigate('PlansDashboard');
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView 
        contentContainerStyle={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <Ionicons 
          name="calendar-outline" 
          size={80} 
          color={colors.light.primaryOrange} 
          style={{ marginBottom: 30 }}
        />
        
        <Text style={dynamicStyles.title}>Welcome to Plans</Text>
        
        <Text style={dynamicStyles.subtitle}>
          Create personalized rituals and join community challenges to build lasting habits.
        </Text>
        
        <TouchableOpacity style={dynamicStyles.button} onPress={handleCreatePlan}>
          <Text style={dynamicStyles.buttonText}>Create New Plan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={dynamicStyles.secondaryButton} onPress={handleBrowsePlans}>
          <Text style={dynamicStyles.secondaryButtonText}>Browse Plans</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlansLanding;
