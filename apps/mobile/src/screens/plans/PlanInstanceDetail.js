// screens/plans/PlanInstanceDetail.js
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';

const PlanInstanceDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = React.useContext(ThemeContext) || { theme: 'light' };
  
  const { planInstance } = route.params || {};

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? colors.dark.background : colors.light.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme === 'dark' ? colors.dark.border : colors.light.border,
    },
    backButton: {
      marginRight: 15,
      padding: 5,
    },
    headerTitle: {
      fontSize: typography.sizes.large,
      fontWeight: typography.weights.bold,
      color: theme === 'dark' ? colors.dark.text : colors.light.text,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: typography.sizes.medium,
      fontWeight: typography.weights.semibold,
      color: theme === 'dark' ? colors.dark.text : colors.light.text,
      marginBottom: 15,
    },
    infoCard: {
      backgroundColor: theme === 'dark' ? colors.dark.card : colors.light.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    infoLabel: {
      fontSize: typography.sizes.small,
      color: theme === 'dark' ? colors.dark.textSecondary : colors.light.textSecondary,
    },
    infoValue: {
      fontSize: typography.sizes.small,
      fontWeight: typography.weights.medium,
      color: theme === 'dark' ? colors.dark.text : colors.light.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.light.primaryOrange,
    },
    statusText: {
      fontSize: typography.sizes.small,
      fontWeight: typography.weights.medium,
      color: '#fff',
    },
    placeholderText: {
      fontSize: typography.sizes.medium,
      color: theme === 'dark' ? colors.dark.textSecondary : colors.light.textSecondary,
      textAlign: 'center',
      marginTop: 50,
    },
  });

  const handleBack = () => {
    navigation.goBack();
  };

  if (!planInstance) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.backButton} onPress={handleBack}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme === 'dark' ? colors.dark.text : colors.light.text} 
            />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Plan Instance</Text>
        </View>
        <View style={dynamicStyles.content}>
          <Text style={dynamicStyles.placeholderText}>
            No plan instance data available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity style={dynamicStyles.backButton} onPress={handleBack}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme === 'dark' ? colors.dark.text : colors.light.text} 
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>
          {planInstance.name || 'Plan Instance'}
        </Text>
      </View>

      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        {/* Plan Instance Info */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Instance Details</Text>
          
          <View style={dynamicStyles.infoCard}>
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Status</Text>
              <View style={dynamicStyles.statusBadge}>
                <Text style={dynamicStyles.statusText}>
                  {planInstance.status || 'Active'}
                </Text>
              </View>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Start Date</Text>
              <Text style={dynamicStyles.infoValue}>
                {planInstance.startDate || 'Not set'}
              </Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>End Date</Text>
              <Text style={dynamicStyles.infoValue}>
                {planInstance.endDate || 'Ongoing'}
              </Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Progress</Text>
              <Text style={dynamicStyles.infoValue}>
                {planInstance.progress || '0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Plan Details */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Plan Information</Text>
          
          <View style={dynamicStyles.infoCard}>
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Plan Name</Text>
              <Text style={dynamicStyles.infoValue}>
                {planInstance.planName || 'Unknown Plan'}
              </Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Type</Text>
              <Text style={dynamicStyles.infoValue}>
                {planInstance.type || 'Personal'}
              </Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Frequency</Text>
              <Text style={dynamicStyles.infoValue}>
                {planInstance.frequency || 'Daily'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={dynamicStyles.section}>
          <TouchableOpacity 
            style={[dynamicStyles.infoCard, { backgroundColor: colors.light.primaryOrange }]}
            onPress={() => {
              // Handle plan instance actions
              console.log('Plan instance action pressed');
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="play" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={[dynamicStyles.infoValue, { color: '#fff', fontWeight: typography.weights.semibold }]}>
                Continue Plan
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlanInstanceDetail;
