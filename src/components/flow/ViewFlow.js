import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../../context/ThemeContext';
import { colors, typography, layout } from '../../../styles';
import FlowDetail from '../../screens/track/FlowDetails';
import FlowStatsDetail from '../FlowStats/FlowStatsDetail';
import EditFlowScreen from '../../screens/flow/EditFlow';
import { Ionicons } from '@expo/vector-icons';
import { FlowsContext } from '../../context/FlowContext';

const ViewFlow = ({ route, navigation }) => {
  const { flowId, initialTab = 'calendar' } = route?.params || {};
  const { theme = 'light' } = useContext(ThemeContext) || {};
  const { deleteFlow = () => {} } = useContext(FlowsContext) || {};
  const [selectedView, setSelectedView] = useState(initialTab);

  // Set initial view based on route params
  useEffect(() => {
    if (initialTab) {
      setSelectedView(initialTab);
    }
  }, [initialTab]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Flow',
      'Are you sure you want to delete this flow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFlow(flowId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const tabs = [
    { key: 'calendar', label: 'Calendar' },
    { key: 'stats', label: 'Stats' },
    { key: 'edit', label: 'Edit' }
  ];

  const themeColors = colors[theme];
  
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      height: 56,
      backgroundColor: themeColors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    backArrow: {
      position: 'absolute',
      left: 16,
    },
    title: {
      ...typography.heading2,
      color: themeColors.primaryText,
    },
    menuDots: {
      position: 'absolute',
      right: 16,
    },
    tabContainer: {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: themeColors.surface,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderColor: themeColors.border,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: themeColors.primary,
      borderBottomWidth: 0,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    tabText: {
      ...typography.body,
      textAlign: 'center',
      color: themeColors.secondaryText,
    },
    activeTabText: {
      color: themeColors.surface,
    },
    contentContainer: {
      flex: 1,
      margin: 0,
      padding: 0,
    },
    errorText: {
      ...typography.body,
      color: themeColors.error,
      textAlign: 'center',
      marginTop: 20,
    },
  });

  if (!flowId) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <Text style={dynamicStyles.errorText}>Flow ID not provided</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top', 'left', 'right']}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity style={dynamicStyles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme === 'light' ? '#1a1a1a' : '#e0e0e0'} />
        </TouchableOpacity>
        <Text style={dynamicStyles.title}>View Flow</Text>
        <TouchableOpacity style={dynamicStyles.menuDots} onPress={handleDelete}>
          <Text style={{ fontSize: 24 }}>⋯</Text>
        </TouchableOpacity>
      </View>
      <View style={dynamicStyles.tabContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              dynamicStyles.tab,
              selectedView === tab.key ? dynamicStyles.activeTab : {},
              index === 0 && { borderTopLeftRadius: selectedView === tab.key ? 8 : 0 },
              index === tabs.length - 1 && { 
                borderRightWidth: 0, 
                borderTopRightRadius: selectedView === tab.key ? 8 : 0 
              },
            ]}
            onPress={() => setSelectedView(tab.key)}
          >
            <Text style={[
              dynamicStyles.tabText, 
              selectedView === tab.key ? dynamicStyles.activeTabText : {}
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={dynamicStyles.contentContainer}>
        {selectedView === 'calendar' ? (
          <FlowDetail route={route} navigation={navigation} />
        ) : selectedView === 'stats' ? (
          <FlowStatsDetail route={route} navigation={navigation} />
        ) : (
          <EditFlowScreen route={route} navigation={navigation} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ViewFlow;
