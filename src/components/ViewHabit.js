import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext';
import HabitDetail from '../screens/track/HabitDetails';
import HabitStatsDetail from './HabitStats/HabitStatsDetail';
import EditHabitScreen from '../screens/EditHabit';
import { Ionicons } from '@expo/vector-icons'; // For the back arrow
import { HabitsContext } from '../context/HabitContext'; // Added for deleteHabit

const ViewHabit = ({ route, navigation }) => {
  const { habitId } = route?.params || {};
  const { theme = 'light', textSize = 'medium', highContrast = false } = useContext(ThemeContext) || {};
  const { deleteHabit = () => {} } = useContext(HabitsContext) || {}; // Added to access deleteHabit
  const [selectedView, setSelectedView] = useState('calendar'); // Default to calendar as per initial requirement

  // Set initial view based on route name
  useEffect(() => {
    if (route.name === 'HabitStatsDetail') {
      setSelectedView('stats');
    } else if (route.name === 'HabitDetails') {
      setSelectedView('calendar');
    }
  }, [route.name]);

  // Determine button order based on selected view
  const leftButton = selectedView === 'stats' ? 'calendar' : 'stats';
  const middleButton = selectedView === 'stats' ? 'stats' : 'calendar';
  const rightButton = 'edit';

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteHabit(habitId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'light' ? '#FAF9F6' : '#121212',
    },
    header: {
      height: 56,
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0', // Thin light gray bottom border
      elevation: 2, // Soft shadow for Android
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
      fontSize: textSize === 'small' ? 18 : textSize === 'large' ? 22 : 20,
      fontWeight: 'bold',
      color: theme === 'light' ? '#1a1a1a' : '#e0e0e0',
    },
    menuDots: {
      position: 'absolute',
      right: 16,
    },
    tabContainer: {
      flexDirection: 'row',
      width: '100%',
      backgroundColor: '#FFFFFF',
      elevation: 1, // Soft shadow for Android
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderRightWidth: 1,
      borderColor: '#FFA500',
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: '#FFA500',
      borderBottomWidth: 0,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    tabText: {
      fontSize: textSize === 'small' ? 14 : textSize === 'large' ? 18 : 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    contentContainer: {
      flex: 1,
      margin: 0,
      padding: 0,
    },
    errorText: {
      fontSize: textSize === 'small' ? 16 : textSize === 'large' ? 20 : 18,
      color: theme === 'light' ? '#dc3545' : '#ff6b6b',
      fontWeight: highContrast ? '700' : '600',
      textAlign: 'center',
      marginTop: 20,
    },
  });

  if (!habitId) {
    return (
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
        <Text style={dynamicStyles.errorText}>Habit ID not provided</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top', 'left', 'right']}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity style={dynamicStyles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme === 'light' ? '#1a1a1a' : '#e0e0e0'} />
        </TouchableOpacity>
        <Text style={dynamicStyles.title}>View Habit</Text>
        <TouchableOpacity style={dynamicStyles.menuDots} onPress={handleDelete}>
          <Text style={{ fontSize: 24 }}>⋯</Text>
        </TouchableOpacity>
      </View>
      <View style={dynamicStyles.tabContainer}>
        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            selectedView === leftButton ? dynamicStyles.activeTab : {},
            { borderTopLeftRadius: selectedView === leftButton ? 8 : 0 },
          ]}
          onPress={() => setSelectedView(leftButton)}
        >
          <Text style={[dynamicStyles.tabText, selectedView === leftButton ? dynamicStyles.activeTabText : {}]}>
            {leftButton === 'calendar' ? 'Calendar' : 'Stats'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            selectedView === middleButton ? dynamicStyles.activeTab : {},
          ]}
          onPress={() => setSelectedView(middleButton)}
        >
          <Text style={[dynamicStyles.tabText, selectedView === middleButton ? dynamicStyles.activeTabText : {}]}>
            {middleButton === 'calendar' ? 'Calendar' : 'Stats'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            dynamicStyles.tab,
            selectedView === rightButton ? dynamicStyles.activeTab : {},
            { borderRightWidth: 0, borderTopRightRadius: selectedView === rightButton ? 8 : 0 },
          ]}
          onPress={() => setSelectedView(rightButton)}
        >
          <Text style={[dynamicStyles.tabText, selectedView === rightButton ? dynamicStyles.activeTabText : {}]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>
      <View style={dynamicStyles.contentContainer}>
        {selectedView === 'calendar' ? (
          <HabitDetail route={route} navigation={navigation} />
        ) : selectedView === 'stats' ? (
          <HabitStatsDetail route={route} navigation={navigation} />
        ) : (
          <EditHabitScreen route={route} navigation={navigation} />
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

export default ViewHabit;