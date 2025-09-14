// src/screens/plans/AddPublicPlan.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { colors, typography, layout } from '../../../styles';
import { usePlanContext } from '../../context/PlanContext';
import useAuth from '../../hooks/useAuth';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AddPublicPlan = () => {
  const { createPlan, loading } = usePlanContext();
  const { user } = useAuth();
  const navigation = useNavigation();

  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('mindfulness');
  const [steps, setSteps] = useState([{ id: '1', title: '', duration: 1 }]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);

  const categories = [
    { id: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline' },
    { id: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
    { id: 'learning', label: 'Learning', icon: 'book-outline' },
    { id: 'productivity', label: 'Productivity', icon: 'checkmark-circle-outline' },
    { id: 'social', label: 'Social', icon: 'people-outline' },
    { id: 'creative', label: 'Creative', icon: 'color-palette-outline' },
  ];

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

  const addStep = () => {
    const newStep = {
      id: (steps.length + 1).toString(),
      title: '',
      duration: 1,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== stepId));
    }
  };

  const updateStep = (stepId, field, value) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
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

    // Validate steps
    const validSteps = steps.filter(step => step.title.trim());
    if (validSteps.length === 0) {
      Alert.alert('Error', 'Please add at least one step');
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
        visibility: 'public',
        ownerId: user.id,
        steps: validSteps.map(step => ({
          ...step,
          title: step.title.trim(),
          duration: parseInt(step.duration) || 1,
        })),
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
        'Public plan created successfully and is now available for others to join.',
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={['#FFE3C3', '#FFFFFF']}
          style={styles.gradientBackground}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
              </TouchableOpacity>
              <Text style={styles.title}>Create Public Plan</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Plan Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Plan Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., 30-Day Meditation Challenge"
                placeholderTextColor={colors.light.secondaryText}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your plan and what participants will achieve..."
                placeholderTextColor={colors.light.secondaryText}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      category === cat.id && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Icon
                      name={cat.icon}
                      size={20}
                      color={category === cat.id ? colors.light.cardBackground : colors.light.primaryOrange}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat.id && styles.categoryTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Steps */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Plan Steps</Text>
                <TouchableOpacity style={styles.addButton} onPress={addStep}>
                  <Icon name="add-outline" size={20} color={colors.light.primaryOrange} />
                  <Text style={styles.addButtonText}>Add Step</Text>
                </TouchableOpacity>
              </View>
              
              {steps.map((step, index) => (
                <View key={step.id} style={styles.stepContainer}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepNumber}>Step {index + 1}</Text>
                    {steps.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeStep(step.id)}
                      >
                        <Icon name="close-outline" size={16} color={colors.light.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <TextInput
                    style={styles.input}
                    value={step.title}
                    onChangeText={(text) => updateStep(step.id, 'title', text)}
                    placeholder="Enter step description..."
                    placeholderTextColor={colors.light.secondaryText}
                  />
                  
                  <View style={styles.durationContainer}>
                    <Text style={styles.durationLabel}>Duration (minutes):</Text>
                    <TextInput
                      style={[styles.input, styles.durationInput]}
                      value={step.duration.toString()}
                      onChangeText={(text) => updateStep(step.id, 'duration', parseInt(text) || 1)}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={colors.light.secondaryText}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Reminder Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Daily Reminder Time (Optional)</Text>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="time-outline" size={20} color={colors.light.primaryOrange} />
                <Text style={styles.timeInputText}>
                  {formatTime(reminderTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={reminderTime || new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <Button
              variant="primary"
              title="Create Public Plan"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    padding: layout.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.lg,
  },
  backButton: {
    padding: layout.spacing.sm,
  },
  title: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginBottom: layout.spacing.lg,
  },
  label: {
    ...typography.styles.headline,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.sm,
    fontWeight: '600',
  },
  input: {
    ...typography.styles.body,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    color: colors.light.primaryText,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.cardBackground,
    gap: layout.spacing.xs,
  },
  categoryButtonSelected: {
    backgroundColor: colors.light.primaryOrange,
    borderColor: colors.light.primaryOrange,
  },
  categoryText: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: colors.light.cardBackground,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.cardBackground,
    gap: layout.spacing.xs,
  },
  addButtonText: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '500',
  },
  stepContainer: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md,
    marginBottom: layout.spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.sm,
  },
  stepNumber: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  removeButton: {
    padding: layout.spacing.xs,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: layout.spacing.sm,
    gap: layout.spacing.sm,
  },
  durationLabel: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  durationInput: {
    width: 80,
    textAlign: 'center',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.borderRadius.lg,
    padding: layout.spacing.md,
    backgroundColor: colors.light.cardBackground,
    gap: layout.spacing.sm,
  },
  timeInputText: {
    ...typography.styles.body,
    color: colors.light.primaryOrange,
    fontWeight: '500',
  },
  footer: {
    padding: layout.spacing.lg,
    backgroundColor: colors.light.background,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  submitButton: {
    backgroundColor: colors.light.primaryOrange,
  },
});

export default AddPublicPlan;
