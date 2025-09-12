// screens/example/HomeScreen.js
// Example screen demonstrating the centralized style system
// Shows how to use global typography, layout helpers, and colors

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput 
} from 'react-native';
import { 
  colors, 
  typography, 
  layout, 
  spacing, 
  shadows, 
  radius,
  typo,
  flexCenter,
  flexRow,
  flexRowBetween,
  container,
  screen,
  commonStyles,
  withOpacity,
  responsiveWidth,
  useAppTheme 
} from '../../../styles';
import { Button, Card, Icon, Toast } from '../../components';

const HomeScreen = ({ navigation }) => {
  const { colors: themeColors, isDark } = useAppTheme();
  const [showToast, setShowToast] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleButtonPress = () => {
    setShowToast(true);
  };

  const handleToastDismiss = () => {
    setShowToast(false);
  };

  return (
    <ScrollView style={[screen, { backgroundColor: themeColors.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[typo.h1, { color: themeColors.primaryText }]}>
          Welcome Back!
        </Text>
        <Text style={[typo.body, { color: themeColors.secondaryText }]}>
          Let's build some great flows today
        </Text>
      </View>

      {/* Stats Cards Row */}
      <View style={styles.statsRow}>
        <Card variant="elevated" padding="md" style={styles.statCard}>
          <View style={flexCenter}>
            <Text style={[typo.h2, { color: themeColors.primaryText }]}>7</Text>
            <Text style={[typo.caption, { color: themeColors.secondaryText }]}>
              Day Streak
            </Text>
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.statCard}>
          <View style={flexCenter}>
            <Text style={[typo.h2, { color: themeColors.success }]}>12</Text>
            <Text style={[typo.caption, { color: themeColors.secondaryText }]}>
              Completed
            </Text>
          </View>
        </Card>

        <Card variant="elevated" padding="md" style={styles.statCard}>
          <View style={flexCenter}>
            <Text style={[typo.h2, { color: themeColors.primaryOrange }]}>5</Text>
            <Text style={[typo.caption, { color: themeColors.secondaryText }]}>
              In Progress
            </Text>
          </View>
        </Card>
      </View>

      {/* Today's Flows Section */}
      <Card variant="default" padding="lg" margin="md">
        <View style={flexRowBetween}>
          <Text style={[typo.h3, { color: themeColors.primaryText }]}>
            Today's Flows
          </Text>
          <Icon 
            name="add-circle-outline" 
            size="medium" 
            color={themeColors.primaryOrange}
            onPress={() => console.log('Add flow')}
          />
        </View>

        {/* Flow List */}
        <View style={styles.flowList}>
          {['Morning Run', 'Read 30 min', 'Meditate'].map((flow, index) => (
            <View key={index} style={[styles.flowItem, flexRowBetween]}>
              <View style={flexRow}>
                <View style={[
                  styles.flowIndicator, 
                  { backgroundColor: themeColors.success }
                ]} />
                <Text style={[typo.body, { color: themeColors.primaryText }]}>
                  {flow}
                </Text>
              </View>
              <Icon 
                name="checkmark-circle" 
                size="small" 
                color={themeColors.success}
              />
            </View>
          ))}
        </View>
      </Card>

      {/* Input Section */}
      <Card variant="outlined" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Add New Flow
        </Text>
        
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: themeColors.progressBackground,
              color: themeColors.primaryText,
              borderColor: themeColors.tertiaryText
            }
          ]}
          placeholder="Enter flow name..."
          placeholderTextColor={themeColors.placeholderText}
          value={inputValue}
          onChangeText={setInputValue}
        />

        <View style={[styles.buttonRow, flexRow]}>
          <Button
            variant="primary"
            title="Add Flow"
            onPress={handleButtonPress}
            style={styles.button}
          />
          <Button
            variant="secondary"
            title="Cancel"
            onPress={() => setInputValue('')}
            style={styles.button}
          />
        </View>
      </Card>

      {/* Progress Section */}
      <Card variant="filled" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Weekly Progress
        </Text>
        
        <View style={styles.progressContainer}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <View key={day} style={styles.progressDay}>
              <Text style={[typo.caption, { color: themeColors.secondaryText }]}>
                {day}
              </Text>
              <View style={[
                styles.progressCircle,
                { 
                  backgroundColor: index < 5 
                    ? themeColors.success 
                    : themeColors.progressBackground 
                }
              ]} />
            </View>
          ))}
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, flexRow]}>
        <Button
          variant="fab"
          title="+"
          onPress={() => console.log('FAB pressed')}
          style={styles.fab}
        />
        <Button
          variant="primary"
          title="View All Flows"
          onPress={() => console.log('View all')}
          fullWidth
          style={styles.fullButton}
        />
      </View>

      {/* Toast Example */}
      {showToast && (
        <Toast
          type="success"
          message="Habit Added!"
          description="Great job starting a new habit"
          onDismiss={handleToastDismiss}
          duration={3000}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.cardShadow,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  flowList: {
    marginTop: spacing.sm,
  },
  flowItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.tertiaryText,
  },
  flowIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sizes.body,
  },
  buttonRow: {
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDay: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: spacing.xs,
  },
  actionButtons: {
    padding: spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  fullButton: {
    flex: 1,
  },
});

export default HomeScreen;
