// src/screens/plans/CreateGroupWizard.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import TimePicker from '../../components/TimePicker';
import { colors, typography, layout } from '../../../styles';
import useAuth from '../../hooks/useAuth';
import { usePlanContext } from '../../context/PlanContext';

const CreateGroupWizard = ({ navigation }) => {
  const { user } = useAuth();
  const { createPlan } = usePlanContext();
  const insets = useSafeAreaInsets();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerFlowIndex, setTimePickerFlowIndex] = useState(null);
  const [groupData, setGroupData] = useState({
    // Basic Info
    title: '',
    description: '',
    category: 'fitness',
    visibility: 'public',
    planKind: 'Group',
    
    // Group Settings
    maxParticipants: 50,
    allowInvites: true,
    requireApproval: false,
    allowMemberPlans: true,
    
    // Group Flows (up to 10 different flows)
    flows: [
      {
        id: '1',
        title: '',
        description: '',
        trackingType: 'binary',
        goal: '',
        unit: '',
        frequency: 'daily',
        everyDay: true,
        selectedDays: []
      }
    ],
    
    // Legacy tracking (for backward compatibility)
    trackingType: 'binary',
    frequency: 'daily',
    everyDay: true,
    selectedDays: [],
    
    // Binary Tracking
    binaryGoal: 'complete',
    
    // Quantitative Tracking
    quantitativeGoal: 0,
    quantitativeUnit: '',
    
    // Time-based Tracking
    timeGoal: 0,
    timeUnit: 'minutes',
    
    // Group Rules
    rules: {
      frequency: 'daily',
      scoring: {
        method: 'binary',
        pointsPerCompletion: 1
      },
      cheatModePolicy: 'flexible',
      maxParticipants: 50,
      groupSettings: {
        allowInvites: true,
        requireApproval: false,
        allowMemberPlans: true,
        leaderboardEnabled: true,
        chatEnabled: true,
      }
    }
  });

  const categories = [
    { id: 'fitness', label: 'Fitness', icon: 'fitness-outline', color: colors.light.error },
    { id: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline', color: colors.light.success },
    { id: 'learning', label: 'Learning', icon: 'book-outline', color: colors.light.info },
    { id: 'productivity', label: 'Productivity', icon: 'checkmark-circle-outline', color: colors.light.primaryOrange },
    { id: 'social', label: 'Social', icon: 'people-outline', color: colors.light.warning },
    { id: 'creative', label: 'Creative', icon: 'color-palette-outline', color: colors.light.secondaryText },
  ];

  const trackingTypes = [
    {
      id: 'binary',
      label: 'Binary',
      description: 'Yes/No completion tracking',
      icon: 'checkmark-circle-outline',
      examples: ['No junk food', 'Meditation done', 'Exercise completed']
    },
    {
      id: 'quantitative',
      label: 'Quantitative',
      description: 'Numeric value tracking',
      icon: 'bar-chart-outline',
      examples: ['2 miles run', '5 glasses water', '10 pages read']
    },
    {
      id: 'time-based',
      label: 'Time-based',
      description: 'Duration tracking',
      icon: 'time-outline',
      examples: ['8 hours sleep', '30 min workout', '2 hours study']
    },
    {
      id: 'frequency',
      label: 'Frequency',
      description: 'How often something happens',
      icon: 'repeat-outline',
      examples: ['3 times per week', 'Daily meditation', 'Weekly review']
    },
    {
      id: 'distance',
      label: 'Distance',
      description: 'Physical distance tracking',
      icon: 'walk-outline',
      examples: ['5km walk', '10 miles bike', 'Marathon training']
    },
    {
      id: 'weight',
      label: 'Weight',
      description: 'Weight-based tracking',
      icon: 'fitness-outline',
      examples: ['Lift 50kg', 'Body weight', 'Progress tracking']
    },
    {
      id: 'calories',
      label: 'Calories',
      description: 'Calorie intake/burn tracking',
      icon: 'flame-outline',
      examples: ['2000 calories', 'Burn 500 cal', 'Calorie deficit']
    },
    {
      id: 'mood',
      label: 'Mood',
      description: 'Emotional state tracking',
      icon: 'happy-outline',
      examples: ['Daily mood', 'Stress level', 'Happiness scale']
    },
    {
      id: 'habit',
      label: 'Habit',
      description: 'Habit formation tracking',
      icon: 'leaf-outline',
      examples: ['Morning routine', 'Evening ritual', 'Daily habits']
    },
    {
      id: 'custom',
      label: 'Custom',
      description: 'Custom tracking type',
      icon: 'create-outline',
      examples: ['Define your own', 'Personal goals', 'Unique metrics']
    }
  ];

  const frequencyOptions = [
    { id: 'daily', label: 'Daily', icon: 'calendar-outline' },
    { id: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
    { id: 'monthly', label: 'Monthly', icon: 'calendar-outline' }
  ];

  const weekDays = [
    { id: 'monday', label: 'Mon', short: 'M' },
    { id: 'tuesday', label: 'Tue', short: 'T' },
    { id: 'wednesday', label: 'Wed', short: 'W' },
    { id: 'thursday', label: 'Thu', short: 'T' },
    { id: 'friday', label: 'Fri', short: 'F' },
    { id: 'saturday', label: 'Sat', short: 'S' },
    { id: 'sunday', label: 'Sun', short: 'S' }
  ];

  const monthDays = Array.from({ length: 31 }, (_, i) => ({
    id: i + 1,
    label: (i + 1).toString(),
    short: (i + 1).toString()
  }));

  const groupSizes = [
    { id: 10, label: 'Small (10 members)', description: 'Close-knit group' },
    { id: 25, label: 'Medium (25 members)', description: 'Balanced community' },
    { id: 50, label: 'Large (50 members)', description: 'Active community' },
    { id: 100, label: 'Very Large (100 members)', description: 'Large community' },
  ];

  const updateGroupData = (field, value) => {
    setGroupData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateFlow = (index, field, value) => {
    setGroupData(prev => ({
      ...prev,
      flows: prev.flows.map((flow, i) => 
        i === index ? { ...flow, [field]: value } : flow
      )
    }));
  };

  const toggleDaySelection = (index, day, frequencyType) => {
    setGroupData(prev => ({
      ...prev,
      flows: prev.flows.map((flow, i) => {
        if (i === index) {
          const currentDays = flow.selectedDays || [];
          const isSelected = currentDays.includes(day);
          
          let newDays;
          if (isSelected) {
            newDays = currentDays.filter(d => d !== day);
          } else {
            newDays = [...currentDays, day];
          }
          
          return {
            ...flow,
            selectedDays: newDays,
            everyDay: frequencyType === 'daily' ? true : false
          };
        }
        return flow;
      })
    }));
  };

  const setFlowFrequency = (index, frequency) => {
    setGroupData(prev => ({
      ...prev,
      flows: prev.flows.map((flow, i) => {
        if (i === index) {
          return {
            ...flow,
            frequency,
            everyDay: frequency === 'daily' ? true : false,
            selectedDays: frequency === 'daily' ? [] : (flow.selectedDays || [])
          };
        }
        return flow;
      })
    }));
  };

  const addFlow = () => {
    if (groupData.flows.length < 10) {
      const newFlow = {
        id: Date.now().toString(),
        title: '',
        description: '',
        trackingType: 'binary',
        goal: '',
        unit: '',
        frequency: 'daily',
        everyDay: true,
        selectedDays: []
      };
      setGroupData(prev => ({
        ...prev,
        flows: [...prev.flows, newFlow]
      }));
    }
  };

  const removeFlow = (flowId) => {
    if (groupData.flows.length > 1) {
      setGroupData(prev => ({
        ...prev,
        flows: prev.flows.filter(flow => flow.id !== flowId)
      }));
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < 5) {
      // Skip step 3, go directly from step 2 to step 4
      if (currentStep === 2) {
        setCurrentStep(4);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!groupData.title.trim()) {
          Alert.alert('Validation Error', 'Please enter a group title');
          return false;
        }
        if (!groupData.description.trim()) {
          Alert.alert('Validation Error', 'Please enter a group description');
          return false;
        }
        if (!groupData.category) {
          Alert.alert('Validation Error', 'Please select a group category');
          return false;
        }
        break;
      case 2:
        if (!groupData.maxParticipants || groupData.maxParticipants < 2) {
          Alert.alert('Validation Error', 'Please select a valid group size (minimum 2 members)');
          return false;
        }
        break;
      case 4:
        // Validate that at least one flow has a title
        const hasValidFlow = groupData.flows.some(flow => flow.title.trim());
        if (!hasValidFlow) {
          Alert.alert('Validation Error', 'Please enter at least one flow title');
          return false;
        }
        // Validate each flow that has a title
        for (let i = 0; i < groupData.flows.length; i++) {
          const flow = groupData.flows[i];
          if (flow.title.trim()) {
            if (!flow.title.trim()) {
              Alert.alert('Validation Error', `Please enter a title for Flow ${i + 1}`);
              return false;
            }
            if (flow.trackingType === 'quantitative' && (!flow.goal || !flow.unit)) {
              Alert.alert('Validation Error', `Please enter goal and unit for Flow ${i + 1}`);
              return false;
            }
            if (flow.trackingType === 'time-based' && (!flow.goal || !flow.unit)) {
              Alert.alert('Validation Error', `Please set duration for Flow ${i + 1}`);
              return false;
            }
          }
        }
        break;
      default:
        break;
    }
    return true;
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Skip step 3, go directly from step 4 to step 2
      if (currentStep === 4) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleSubmit = async () => {
    // Validate all steps before submitting
    if (!validateCurrentStep()) {
      return;
    }
    
    if (!groupData.title.trim()) {
      Alert.alert('Error', 'Please enter a group title');
      return;
    }

    if (!groupData.description.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      // Create default steps for group
      const defaultSteps = [
        {
          id: '1',
          title: 'Group participation',
          duration: 1,
          description: 'Participate in group activities'
        }
      ];

      const finalGroupData = {
        ...groupData,
        steps: defaultSteps,
        ownerId: user.id,
        participants: [{ userId: user.id, role: 'owner', joinedAt: new Date().toISOString() }],
        analytics: {
          strictScore: 0,
          flexibleScore: 0,
          streak: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        schemaVersion: 2,
      };

      await createPlan(finalGroupData);
      
      Alert.alert(
        'Success!',
        'Group created successfully. You can now invite members and start tracking together.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Plans tab and reset to PlansDashboard with groups tab
              navigation.getParent()?.navigate('Plans', { 
                screen: 'PlansDashboard',
                params: { initialTab: 'groups' }
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 4, 5].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            currentStep >= step && styles.activeStepDot,
            currentStep === step && styles.currentStepDot
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Group Information</Text>
      <Text style={styles.stepSubtitle}>Set up your group basics</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Group Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter group name"
          placeholderTextColor={colors.light.secondaryText}
          value={groupData.title}
          onChangeText={(text) => updateGroupData('title', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Describe your group's purpose..."
          placeholderTextColor={colors.light.secondaryText}
          value={groupData.description}
          onChangeText={(text) => updateGroupData('description', text)}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                groupData.category === category.id && styles.selectedCategoryCard
              ]}
              onPress={() => updateGroupData('category', category.id)}
            >
              <Icon
                name={category.icon}
                size={24}
                color={groupData.category === category.id ? colors.light.cardBackground : category.color}
              />
              <Text style={[
                styles.categoryText,
                groupData.category === category.id && styles.selectedCategoryText
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Group Size</Text>
        <View style={styles.groupSizeOptions}>
          {groupSizes.map((size) => (
            <TouchableOpacity
              key={size.id}
              style={[
                styles.groupSizeOption,
                groupData.maxParticipants === size.id && styles.selectedGroupSizeOption
              ]}
              onPress={() => updateGroupData('maxParticipants', size.id)}
            >
              <View style={styles.groupSizeInfo}>
                <Text style={[
                  styles.groupSizeLabel,
                  groupData.maxParticipants === size.id && styles.selectedGroupSizeLabel
                ]}>
                  {size.label}
                </Text>
                <Text style={[
                  styles.groupSizeDescription,
                  groupData.maxParticipants === size.id && styles.selectedGroupSizeDescription
                ]}>
                  {size.description}
                </Text>
              </View>
              <Icon
                name="people-outline"
                size={20}
                color={groupData.maxParticipants === size.id ? colors.light.cardBackground : colors.light.secondaryText}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Group Settings</Text>
      <Text style={styles.stepSubtitle}>Configure how your group works</Text>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Allow Invites</Text>
            <Text style={styles.switchDescription}>Members can invite others</Text>
          </View>
          <Switch
            value={groupData.allowInvites}
            onValueChange={(value) => updateGroupData('allowInvites', value)}
            trackColor={{ false: colors.light.border, true: colors.light.primaryOrangeVariants.light }}
            thumbColor={groupData.allowInvites ? colors.light.primaryOrange : colors.light.secondaryText}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Require Approval</Text>
            <Text style={styles.switchDescription}>Approve new members before they join</Text>
          </View>
          <Switch
            value={groupData.requireApproval}
            onValueChange={(value) => updateGroupData('requireApproval', value)}
            trackColor={{ false: colors.light.border, true: colors.light.primaryOrangeVariants.light }}
            thumbColor={groupData.requireApproval ? colors.light.primaryOrange : colors.light.secondaryText}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Allow Member Plans</Text>
            <Text style={styles.switchDescription}>Members can create their own plans</Text>
          </View>
          <Switch
            value={groupData.allowMemberPlans}
            onValueChange={(value) => updateGroupData('allowMemberPlans', value)}
            trackColor={{ false: colors.light.border, true: colors.light.primaryOrangeVariants.light }}
            thumbColor={groupData.allowMemberPlans ? colors.light.primaryOrange : colors.light.secondaryText}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Group Features</Text>
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Icon name="trophy-outline" size={24} color={colors.light.warning} />
            <Text style={styles.featureTitle}>Leaderboard</Text>
            <Text style={styles.featureDescription}>Track member progress</Text>
          </View>
          <View style={styles.featureCard}>
            <Icon name="chatbubbles-outline" size={24} color={colors.light.info} />
            <Text style={styles.featureTitle}>Group Chat</Text>
            <Text style={styles.featureDescription}>Communicate with members</Text>
          </View>
          <View style={styles.featureCard}>
            <Icon name="analytics-outline" size={24} color={colors.light.success} />
            <Text style={styles.featureTitle}>Analytics</Text>
            <Text style={styles.featureDescription}>View group statistics</Text>
          </View>
          <View style={styles.featureCard}>
            <Icon name="calendar-outline" size={24} color={colors.light.primaryOrange} />
            <Text style={styles.featureTitle}>Events</Text>
            <Text style={styles.featureDescription}>Schedule group activities</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tracking Type</Text>
      <Text style={styles.stepSubtitle}>How will your group track progress?</Text>

      <View style={styles.trackingTypesContainer}>
        {trackingTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.trackingTypeCard,
              groupData.trackingType === type.id && styles.selectedTrackingTypeCard
            ]}
            onPress={() => updateGroupData('trackingType', type.id)}
          >
            <View style={styles.trackingTypeHeader}>
              <Icon
                name={type.icon}
                size={24}
                color={groupData.trackingType === type.id ? colors.light.cardBackground : colors.light.primaryOrange}
              />
              <View style={styles.trackingTypeInfo}>
                <Text style={[
                  styles.trackingTypeTitle,
                  groupData.trackingType === type.id && styles.selectedTrackingTypeTitle
                ]}>
                  {type.label}
                </Text>
                <Text style={[
                  styles.trackingTypeDescription,
                  groupData.trackingType === type.id && styles.selectedTrackingTypeDescription
                ]}>
                  {type.description}
                </Text>
              </View>
            </View>
            <View style={styles.trackingTypeExamples}>
              {type.examples.map((example, index) => (
                <Text key={index} style={[
                  styles.trackingTypeExample,
                  groupData.trackingType === type.id && styles.selectedTrackingTypeExample
                ]}>
                  • {example}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Group Flows</Text>
      <Text style={styles.stepSubtitle}>Create up to 10 different flows for your group</Text>

      <View style={styles.flowsContainer}>
        {groupData.flows.map((flow, index) => (
          <View key={flow.id} style={styles.flowCard}>
            <View style={styles.flowHeader}>
              <Text style={styles.flowNumber}>Flow {index + 1}</Text>
              {groupData.flows.length > 1 && (
                <TouchableOpacity
                  style={styles.removeFlowButton}
                  onPress={() => removeFlow(flow.id)}
                >
                  <Icon name="close-circle-outline" size={20} color={colors.light.error} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.flowForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Flow Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Go to office, 2 miles running"
                  value={flow.title}
                  onChangeText={(text) => updateFlow(index, 'title', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief description of this flow"
                  value={flow.description}
                  onChangeText={(text) => updateFlow(index, 'description', text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tracking Type</Text>
                <View style={styles.trackingTypeButtons}>
                  {trackingTypes.slice(0, 3).map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.trackingTypeButton,
                        flow.trackingType === type.id && styles.selectedTrackingTypeButton
                      ]}
                      onPress={() => updateFlow(index, 'trackingType', type.id)}
                    >
                      <Icon 
                        name={type.icon} 
                        size={16} 
                        color={flow.trackingType === type.id ? colors.light.cardBackground : colors.light.primaryOrange} 
                      />
                      <Text style={[
                        styles.trackingTypeButtonText,
                        flow.trackingType === type.id && styles.selectedTrackingTypeButtonText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.frequencyButtons}>
                  {frequencyOptions.map((freq) => (
                    <TouchableOpacity
                      key={freq.id}
                      style={[
                        styles.frequencyButton,
                        flow.frequency === freq.id && styles.selectedFrequencyButton
                      ]}
                      onPress={() => setFlowFrequency(index, freq.id)}
                    >
                      <Icon 
                        name={freq.icon} 
                        size={16} 
                        color={flow.frequency === freq.id ? colors.light.cardBackground : colors.light.primaryOrange} 
                      />
                      <Text style={[
                        styles.frequencyButtonText,
                        flow.frequency === freq.id && styles.selectedFrequencyButtonText
                      ]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Weekly Day Selection */}
                {flow.frequency === 'weekly' && (
                  <View style={styles.daySelectionContainer}>
                    <Text style={styles.daySelectionLabel}>Select Days of Week</Text>
                    <View style={styles.dayButtons}>
                      {weekDays.map((day) => (
                        <TouchableOpacity
                          key={day.id}
                          style={[
                            styles.dayButton,
                            flow.selectedDays?.includes(day.id) && styles.selectedDayButton
                          ]}
                          onPress={() => toggleDaySelection(index, day.id, 'weekly')}
                        >
                          <Text style={[
                            styles.dayButtonText,
                            flow.selectedDays?.includes(day.id) && styles.selectedDayButtonText
                          ]}>
                            {day.short}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Monthly Day Selection */}
                {flow.frequency === 'monthly' && (
                  <View style={styles.daySelectionContainer}>
                    <Text style={styles.daySelectionLabel}>Select Dates in Month</Text>
                    <View style={styles.monthDayButtons}>
                      {monthDays.map((day) => (
                        <TouchableOpacity
                          key={day.id}
                          style={[
                            styles.monthDayButton,
                            flow.selectedDays?.includes(day.id) && styles.selectedMonthDayButton
                          ]}
                          onPress={() => toggleDaySelection(index, day.id, 'monthly')}
                        >
                          <Text style={[
                            styles.monthDayButtonText,
                            flow.selectedDays?.includes(day.id) && styles.selectedMonthDayButtonText
                          ]}>
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Time Setting */}
                <View style={styles.timeSettingContainer}>
                  <Text style={styles.timeSettingLabel}>Reminder Time (Optional)</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                      setTimePickerFlowIndex(index);
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timePickerText}>
                      {flow.reminderTime ? 
                        new Date(`2000-01-01T${flow.reminderTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                        'Set Time'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {flow.trackingType === 'quantitative' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Goal & Unit</Text>
                  <View style={styles.goalInputRow}>
                    <TextInput
                      style={[styles.textInput, styles.goalInput]}
                      placeholder="Goal"
                      value={flow.goal}
                      onChangeText={(text) => updateFlow(index, 'goal', text)}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.textInput, styles.unitInput]}
                      placeholder="Unit"
                      value={flow.unit}
                      onChangeText={(text) => updateFlow(index, 'unit', text)}
                    />
                  </View>
                </View>
              )}

              {(flow.trackingType === 'time-based') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Duration</Text>
                  <TimePicker
                    initialHours={parseInt(flow.goal) || 0}
                    initialMinutes={parseInt(flow.unit) || 0}
                    onTimeChange={(hours, minutes) => {
                      updateFlow(index, 'goal', hours.toString());
                      updateFlow(index, 'unit', minutes.toString());
                    }}
                  />
                </View>
              )}
            </View>
          </View>
        ))}

        {groupData.flows.length < 10 && (
          <TouchableOpacity style={styles.addFlowButton} onPress={addFlow}>
            <Icon name="add-circle-outline" size={24} color={colors.light.primaryOrange} />
            <Text style={styles.addFlowButtonText}>Add Another Flow</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Group Summary</Text>
      <Text style={styles.stepSubtitle}>Review your group settings</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Icon name="people-outline" size={32} color={colors.light.primaryOrange} />
          <View style={styles.summaryTitleContainer}>
            <Text style={styles.summaryTitle}>{groupData.title || 'Untitled Group'}</Text>
            <Text style={styles.summarySubtitle}>Group • {groupData.maxParticipants} members max</Text>
          </View>
        </View>

        <Text style={styles.summaryDescription}>{groupData.description || 'No description'}</Text>

        <View style={styles.summaryDetails}>
          <View style={styles.summaryDetail}>
            <Icon name="grid-outline" size={16} color={colors.light.secondaryText} />
            <Text style={styles.summaryDetailText}>
              {categories.find(c => c.id === groupData.category)?.label}
            </Text>
          </View>
          <View style={styles.summaryDetail}>
            <Icon name="bar-chart-outline" size={16} color={colors.light.secondaryText} />
            <Text style={styles.summaryDetailText}>
              {trackingTypes.find(t => t.id === groupData.trackingType)?.label}
            </Text>
          </View>
          <View style={styles.summaryDetail}>
            <Icon name="people-outline" size={16} color={colors.light.secondaryText} />
            <Text style={styles.summaryDetailText}>
              {groupData.maxParticipants} members
            </Text>
          </View>
        </View>

        <View style={styles.summarySettings}>
          <Text style={styles.summarySettingsTitle}>Group Settings</Text>
          <View style={styles.summarySettingsList}>
            <View style={styles.summarySetting}>
              <Icon 
                name={groupData.allowInvites ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={groupData.allowInvites ? colors.light.success : colors.light.error} 
              />
              <Text style={styles.summarySettingText}>
                {groupData.allowInvites ? 'Invites allowed' : 'Invites disabled'}
              </Text>
            </View>
            <View style={styles.summarySetting}>
              <Icon 
                name={groupData.requireApproval ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={groupData.requireApproval ? colors.light.success : colors.light.error} 
              />
              <Text style={styles.summarySettingText}>
                {groupData.requireApproval ? 'Approval required' : 'Auto-join enabled'}
              </Text>
            </View>
            <View style={styles.summarySetting}>
              <Icon 
                name={groupData.allowMemberPlans ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={groupData.allowMemberPlans ? colors.light.success : colors.light.error} 
              />
              <Text style={styles.summarySettingText}>
                {groupData.allowMemberPlans ? 'Member plans allowed' : 'Member plans disabled'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.nextStepsCard}>
        <Text style={styles.nextStepsTitle}>Next Steps</Text>
        <View style={styles.nextStepsList}>
          <View style={styles.nextStepItem}>
            <Icon name="person-add-outline" size={20} color={colors.light.primaryOrange} />
            <Text style={styles.nextStepText}>Invite members to your group</Text>
          </View>
          <View style={styles.nextStepItem}>
            <Icon name="share-outline" size={20} color={colors.light.primaryOrange} />
            <Text style={styles.nextStepText}>Share group link with others</Text>
          </View>
          <View style={styles.nextStepItem}>
            <Icon name="analytics-outline" size={20} color={colors.light.primaryOrange} />
            <Text style={styles.nextStepText}>Start tracking group progress</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return renderStep1();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-outline" size={24} color={colors.light.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Footer - Positioned absolutely above tab bar */}
      <View style={[styles.footer, { 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom + 80, // Clear the tab bar with compact spacing
        minHeight: 80,
        justifyContent: 'center',
        backgroundColor: colors.light.background,
        borderTopWidth: 1,
        borderTopColor: colors.light.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
      }]}>
        <View style={styles.footerButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.footerButton, styles.footerButtonSecondary]}
              onPress={prevStep}
            >
              <Text style={styles.footerButtonTextSecondary}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonPrimary, loading && styles.footerButtonDisabled]}
            onPress={currentStep === 5 ? handleSubmit : nextStep}
            disabled={loading}
          >
            <Text style={styles.footerButtonTextPrimary}>
              {currentStep === 5 ? 'Create Group' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={groupData.flows[timePickerFlowIndex]?.reminderTime ? 
            new Date(`2000-01-01T${groupData.flows[timePickerFlowIndex].reminderTime}`) : 
            new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime && timePickerFlowIndex !== null) {
              const timeString = selectedTime.toTimeString().slice(0, 5); // HH:MM format
              updateFlow(timePickerFlowIndex, 'reminderTime', timeString);
            }
            setTimePickerFlowIndex(null);
          }}
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
  headerTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: layout.spacing.lg,
    gap: layout.spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.border,
  },
  activeStepDot: {
    backgroundColor: colors.light.primaryOrangeVariants.light,
  },
  currentStepDot: {
    backgroundColor: colors.light.primaryOrange,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.spacing.lg,
  },
  stepContent: {
    paddingBottom: layout.spacing.xl,
  },
  stepTitle: {
    ...typography.styles.title1,
    color: colors.light.primaryText,
    fontWeight: '700',
    marginBottom: layout.spacing.sm,
  },
  stepSubtitle: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.xl,
  },
  inputGroup: {
    marginBottom: layout.spacing.xl,
  },
  inputLabel: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
  },
  textInput: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
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
  categoryCard: {
    width: (layout.spacing.lg * 2 + layout.spacing.sm * 2) * 2,
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: layout.spacing.sm,
  },
  selectedCategoryCard: {
    backgroundColor: colors.light.primaryOrange,
    borderColor: colors.light.primaryOrange,
  },
  categoryText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: colors.light.cardBackground,
    fontWeight: '600',
  },
  groupSizeOptions: {
    gap: layout.spacing.sm,
  },
  groupSizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    backgroundColor: colors.light.cardBackground,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  selectedGroupSizeOption: {
    backgroundColor: colors.light.primaryOrangeVariants.light,
    borderColor: colors.light.primaryOrange,
  },
  groupSizeInfo: {
    flex: 1,
  },
  groupSizeLabel: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '500',
    marginBottom: layout.spacing.xs,
  },
  selectedGroupSizeLabel: {
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  groupSizeDescription: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  selectedGroupSizeDescription: {
    color: colors.light.primaryOrangeVariants.dark,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    ...typography.styles.body,
    color: colors.light.primaryText,
    fontWeight: '500',
    marginBottom: layout.spacing.xs,
  },
  switchDescription: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.md,
  },
  featureCard: {
    width: (layout.spacing.lg * 2 + layout.spacing.md * 2) * 2,
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.md,
    borderRadius: layout.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: layout.spacing.sm,
  },
  featureTitle: {
    ...typography.styles.caption1,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  featureDescription: {
    ...typography.styles.caption2,
    color: colors.light.secondaryText,
    textAlign: 'center',
  },
  trackingTypesContainer: {
    gap: layout.spacing.md,
  },
  trackingTypeCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  selectedTrackingTypeCard: {
    backgroundColor: colors.light.primaryOrangeVariants.light,
    borderColor: colors.light.primaryOrange,
  },
  trackingTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
    gap: layout.spacing.md,
  },
  trackingTypeInfo: {
    flex: 1,
  },
  trackingTypeTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  selectedTrackingTypeTitle: {
    color: colors.light.primaryOrange,
  },
  trackingTypeDescription: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  selectedTrackingTypeDescription: {
    color: colors.light.primaryOrangeVariants.dark,
  },
  trackingTypeExamples: {
    gap: layout.spacing.xs,
  },
  trackingTypeExample: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  selectedTrackingTypeExample: {
    color: colors.light.primaryOrangeVariants.dark,
  },
  summaryCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    marginBottom: layout.spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
    gap: layout.spacing.md,
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.styles.title2,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  summarySubtitle: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  summaryDescription: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    marginBottom: layout.spacing.md,
  },
  summaryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.md,
    marginBottom: layout.spacing.md,
  },
  summaryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.xs,
  },
  summaryDetailText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  summarySettings: {
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    paddingTop: layout.spacing.md,
  },
  summarySettingsTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.sm,
  },
  summarySettingsList: {
    gap: layout.spacing.sm,
  },
  summarySetting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.sm,
  },
  summarySettingText: {
    ...typography.styles.caption1,
    color: colors.light.secondaryText,
  },
  nextStepsCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  nextStepsTitle: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
    marginBottom: layout.spacing.md,
  },
  nextStepsList: {
    gap: layout.spacing.md,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.md,
  },
  nextStepText: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
  },
  footer: {
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: layout.spacing.md,
  },
  footerButton: {
    flex: 1,
    paddingVertical: layout.spacing.md,
    borderRadius: layout.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonPrimary: {
    backgroundColor: colors.light.primaryOrange,
  },
  footerButtonSecondary: {
    backgroundColor: colors.light.cardBackground,
    borderWidth: 1,
    borderColor: colors.light.primaryOrange,
  },
  footerButtonDisabled: {
    opacity: 0.4,
  },
  footerButtonTextPrimary: {
    ...typography.styles.body,
    color: colors.light.cardBackground,
    fontWeight: typography.weights.bold,
  },
  footerButtonTextSecondary: {
    ...typography.styles.body,
    color: colors.light.primaryOrange,
    fontWeight: typography.weights.bold,
  },
  // Flow management styles
  flowsContainer: {
    gap: layout.spacing.lg,
  },
  flowCard: {
    backgroundColor: colors.light.cardBackground,
    padding: layout.spacing.lg,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.md,
  },
  flowNumber: {
    ...typography.styles.title3,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  removeFlowButton: {
    padding: layout.spacing.xs,
  },
  flowForm: {
    gap: layout.spacing.md,
  },
  inputGroup: {
    gap: layout.spacing.xs,
  },
  inputLabel: {
    ...typography.styles.caption1,
    color: colors.light.primaryText,
    fontWeight: '600',
  },
  textInput: {
    ...typography.styles.body,
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    color: colors.light.primaryText,
  },
  trackingTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.sm,
  },
  trackingTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.background,
    gap: layout.spacing.xs,
    marginRight: layout.spacing.xs,
    marginBottom: layout.spacing.xs,
  },
  trackingTypeButtonText: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '500',
  },
  selectedTrackingTypeButton: {
    backgroundColor: colors.light.primaryOrange,
  },
  selectedTrackingTypeButtonText: {
    color: colors.light.cardBackground,
  },
  goalInputRow: {
    flexDirection: 'row',
    gap: layout.spacing.sm,
  },
  goalInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  addFlowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.lg,
    paddingHorizontal: layout.spacing.md,
    borderRadius: layout.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.light.primaryOrange,
    borderStyle: 'dashed',
    backgroundColor: colors.light.primaryOrangeVariants.light,
    gap: layout.spacing.sm,
  },
  addFlowButtonText: {
    ...typography.styles.body,
    color: colors.light.primaryOrange,
    fontWeight: '600',
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.sm,
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.sm,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.primaryOrange,
    backgroundColor: colors.light.background,
    gap: layout.spacing.xs,
    marginRight: layout.spacing.xs,
    marginBottom: layout.spacing.xs,
  },
  daySelectionContainer: {
    marginTop: layout.spacing.md,
    padding: layout.spacing.md,
    backgroundColor: colors.light.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  daySelectionLabel: {
    fontSize: typography.sizes.footnote,
    color: colors.light.primaryText,
    fontWeight: typography.weights.medium,
    marginBottom: layout.spacing.sm,
  },
  dayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: layout.spacing.xs,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayButton: {
    backgroundColor: colors.light.primaryOrange,
    borderColor: colors.light.primaryOrange,
  },
  dayButtonText: {
    fontSize: typography.sizes.footnote,
    color: colors.light.primaryText,
    fontWeight: typography.weights.medium,
  },
  selectedDayButtonText: {
    color: colors.light.cardBackground,
    fontWeight: typography.weights.bold,
  },
  monthDayButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.spacing.xs,
  },
  monthDayButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMonthDayButton: {
    backgroundColor: colors.light.primaryOrange,
    borderColor: colors.light.primaryOrange,
  },
  monthDayButtonText: {
    fontSize: typography.sizes.caption,
    color: colors.light.primaryText,
    fontWeight: typography.weights.medium,
  },
  selectedMonthDayButtonText: {
    color: colors.light.cardBackground,
    fontWeight: typography.weights.bold,
  },
  timeSettingContainer: {
    marginTop: layout.spacing.md,
    padding: layout.spacing.md,
    backgroundColor: colors.light.background,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  timeSettingLabel: {
    fontSize: typography.sizes.footnote,
    color: colors.light.primaryText,
    fontWeight: typography.weights.medium,
    marginBottom: layout.spacing.sm,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.spacing.sm,
  },
  timeInput: {
    width: 60,
    textAlign: 'center',
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
  timeSeparator: {
    fontSize: typography.sizes.body,
    color: colors.light.primaryText,
    fontWeight: typography.weights.bold,
  },
  timeLabel: {
    fontSize: typography.sizes.caption,
    color: colors.light.secondaryText,
    marginLeft: layout.spacing.sm,
  },
  timePickerButton: {
    backgroundColor: colors.light.cardBackground,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.md,
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: typography.sizes.body,
    color: colors.light.primaryOrange,
    fontWeight: typography.weights.medium,
  },
  frequencyButtonText: {
    ...typography.styles.caption1,
    color: colors.light.primaryOrange,
    fontWeight: '500',
  },
  selectedFrequencyButton: {
    backgroundColor: colors.light.primaryOrange,
  },
  selectedFrequencyButtonText: {
    color: colors.light.cardBackground,
  },
});

export default CreateGroupWizard;
