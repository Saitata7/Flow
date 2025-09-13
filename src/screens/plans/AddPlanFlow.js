// src/screens/plans/AddPlanFlow.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import { usePlanContext } from '../../context/PlanContext';
import useAuth from '../../hooks/useAuth';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const AddPlanFlow = () => {
  const { createPlan, loading } = usePlanContext();
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { planType = 'personal' } = route.params || {}; // 'personal' or 'public'

  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trackingType, setTrackingType] = useState('Binary');
  const [frequency, setFrequency] = useState('Daily');
  const [everyDay, setEveryDay] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [reminderTimeEnabled, setReminderTimeEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderLevel, setReminderLevel] = useState('1');
  const [unitText, setUnitText] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hoursInput, setHoursInput] = useState('00');
  const [minutesInput, setMinutesInput] = useState('00');
  const [secondsInput, setSecondsInput] = useState('00');
  const [goal, setGoal] = useState(0);
  const [goalInput, setGoalInput] = useState('');
  const [category, setCategory] = useState('mindfulness');

  const categories = [
    { id: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline' },
    { id: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
    { id: 'learning', label: 'Learning', icon: 'book-outline' },
    { id: 'productivity', label: 'Productivity', icon: 'checkmark-circle-outline' },
    { id: 'social', label: 'Social', icon: 'people-outline' },
    { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
  ];

  const handleDayToggle = (day) => {
    if (everyDay) return;
    
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Select time';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a plan title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a plan description');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    try {
      const planData = {
        title: title.trim(),
        description: description.trim(),
        category,
        visibility: planType === 'personal' ? 'private' : 'public',
        ownerId: user.id,
        trackingType,
        frequency,
        everyDay,
        daysOfWeek: everyDay ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : selectedDays,
        reminderTimeEnabled,
        reminderTime: reminderTime?.toISOString(),
        reminderLevel,
        unitText: unitText.trim(),
        goal,
        participants: [{ userId: user.id, role: 'owner', joinedAt: new Date().toISOString() }],
        analytics: {
          strictScore: 0,
          flexibleScore: 0,
          streak: 0,
        },
      };

      await createPlan(planData);
      
      Alert.alert(
        'Success!',
        `${planType === 'personal' ? 'Personal' : 'Public'} plan created successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create plan. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
        <Text style={styles.title}>
          Create {planType === 'personal' ? 'Personal' : 'Public'} Plan
        </Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[colors.light.primaryOrangeVariants.light, colors.light.primaryOrange]}
            style={styles.gradientHeader}
          >
            <Text style={styles.gradientTitle}>Plan Details</Text>
            <Text style={styles.gradientSubtitle}>
              Create a {planType === 'personal' ? 'personal ritual' : 'community challenge'}
            </Text>
          </LinearGradient>

          <View style={styles.form}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter plan title"
                placeholderTextColor={colors.light.placeholderText}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what this plan is about"
                placeholderTextColor={colors.light.placeholderText}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      category === cat.id && styles.categoryItemActive,
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Icon
                      name={cat.icon}
                      size={24}
                      color={
                        category === cat.id
                          ? colors.light.primaryOrange
                          : colors.light.secondaryText
                      }
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.id && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tracking Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tracking Type</Text>
              <View style={styles.trackingTypeContainer}>
                {['Binary', 'Quantitative', 'Time-based'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.trackingTypeButton,
                      trackingType === type && styles.trackingTypeButtonActive,
                    ]}
                    onPress={() => setTrackingType(type)}
                  >
                    <Text
                      style={[
                        styles.trackingTypeText,
                        trackingType === type && styles.trackingTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Frequency */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencyContainer}>
                {['Daily', 'Weekly', 'Monthly'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      frequency === freq && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        frequency === freq && styles.frequencyTextActive,
                      ]}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Days Selection */}
            {frequency === 'Weekly' && (
              <View style={styles.inputGroup}>
                <View style={styles.daysHeader}>
                  <Text style={styles.label}>Days of Week</Text>
                  <View style={styles.everyDayContainer}>
                    <Text style={styles.everyDayLabel}>Every day</Text>
                    <Switch
                      value={everyDay}
                      onValueChange={setEveryDay}
                      trackColor={{ false: colors.light.border, true: colors.light.primaryOrange }}
                      thumbColor={colors.light.cardBackground}
                    />
                  </View>
                </View>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        (everyDay || selectedDays.includes(day)) && styles.dayButtonActive,
                      ]}
                      onPress={() => handleDayToggle(day)}
                      disabled={everyDay}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          (everyDay || selectedDays.includes(day)) && styles.dayTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Reminder Settings */}
            <View style={styles.inputGroup}>
              <View style={styles.reminderHeader}>
                <Text style={styles.label}>Reminder</Text>
                <Switch
                  value={reminderTimeEnabled}
                  onValueChange={setReminderTimeEnabled}
                  trackColor={{ false: colors.light.border, true: colors.light.primaryOrange }}
                  thumbColor={colors.light.cardBackground}
                />
              </View>
              
              {reminderTimeEnabled && (
                <View style={styles.reminderSettings}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Icon name="time-outline" size={20} color={colors.light.primaryOrange} />
                    <Text style={styles.timeText}>{formatTime(reminderTime)}</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.reminderLevelContainer}>
                    <Text style={styles.reminderLevelLabel}>Reminder Level</Text>
                    <View style={styles.reminderLevelButtons}>
                      {['1', '2', '3'].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.reminderLevelButton,
                            reminderLevel === level && styles.reminderLevelButtonActive,
                          ]}
                          onPress={() => setReminderLevel(level)}
                        >
                          <Text
                            style={[
                              styles.reminderLevelText,
                              reminderLevel === level && styles.reminderLevelTextActive,
                            ]}
                          >
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Goal Setting for Quantitative */}
            {trackingType === 'Quantitative' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Goal</Text>
                <View style={styles.goalContainer}>
                  <TextInput
                    style={[styles.input, styles.goalInput]}
                    placeholder="0"
                    placeholderTextColor={colors.light.placeholderText}
                    value={goalInput}
                    onChangeText={(text) => {
                      setGoalInput(text);
                      setGoal(parseInt(text) || 0);
                    }}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.unitInput]}
                    placeholder="units"
                    placeholderTextColor={colors.light.placeholderText}
                    value={unitText}
                    onChangeText={setUnitText}
                  />
                </View>
              </View>
            )}

            {/* Time Setting for Time-based */}
            {trackingType === 'Time-based' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration Goal</Text>
                <View style={styles.timeContainer}>
                  <View style={styles.timeInputGroup}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      placeholder="00"
                      placeholderTextColor={colors.light.placeholderText}
                      value={hoursInput}
                      onChangeText={(text) => {
                        setHoursInput(text);
                        setHours(parseInt(text) || 0);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>Hours</Text>
                  </View>
                  <View style={styles.timeInputGroup}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      placeholder="00"
                      placeholderTextColor={colors.light.placeholderText}
                      value={minutesInput}
                      onChangeText={(text) => {
                        setMinutesInput(text);
                        setMinutes(parseInt(text) || 0);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>Minutes</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="primary"
            title={`Create ${planType === 'personal' ? 'Personal' : 'Public'} Plan`}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </KeyboardAvoidingView>

      {showTimePicker && (
        <DateTimePicker
          value={reminderTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    padding: layout.spacing.sm,
  },
  title: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  gradientHeader: {
    padding: layout.spacing.lg,
    alignItems: 'center',
  },
  gradientTitle: {
    ...typography.styles.title1,
    color: colors.light.cardBackground,
    marginBottom: layout.spacing.xs,
  },
  gradientSubtitle: {
    ...typography.styles.body,
    color: colors.light.cardBackground,
    opacity: 0.9,
  },
  form: {
    padding: layout.spacing.lg,
  },
  inputGroup: {
    marginBottom: layout.spacing.lg,
  },
  label: {
    ...typography.styles.headline,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.sm,
  },
  input: {
    ...typography.styles.body,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    padding: layout.spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    color: colors.light.primaryText,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.sm,
  },
  categoryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  categoryItemActive: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  categoryLabel: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    marginTop: layout.spacing.xs,
  },
  categoryLabelActive: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  trackingTypeContainer: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  trackingTypeButton: {
    flex: 1,
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  trackingTypeButtonActive: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  trackingTypeText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  trackingTypeTextActive: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  frequencyButton: {
    flex: 1,
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  frequencyText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  frequencyTextActive: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  everyDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.sm,
  },
  everyDayLabel: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.sm,
  },
  dayButton: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  dayButtonActive: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  dayText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  dayTextActive: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderSettings: {
    marginTop: layout.spacing.md,
    gap: layout.spacing.md,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: layout.spacing.sm,
  },
  timeText: {
    ...typography.styles.body,
    color: colors.light.primaryText,
  },
  reminderLevelContainer: {
    gap: layout.spacing.sm,
  },
  reminderLevelLabel: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  reminderLevelButtons: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  reminderLevelButton: {
    flex: 1,
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
  },
  reminderLevelButtonActive: {
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  reminderLevelText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  reminderLevelTextActive: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  goalContainer: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  goalInput: {
    flex: 1,
  },
  unitInput: {
    flex: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: layout.spacing.md,
  },
  timeInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  timeInput: {
    textAlign: 'center',
    marginBottom: layout.spacing.xs,
  },
  timeLabel: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  footer: {
    padding: layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    backgroundColor: colors.light.background,
  },
  submitButton: {
    ...layout.shadows.small,
  },
});

export default AddPlanFlow;
