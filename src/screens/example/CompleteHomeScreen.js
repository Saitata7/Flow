// screens/example/CompleteHomeScreen.js
// Complete example demonstrating ALL centralized style system features
// Shows typography, layout, colors, components, and utilities

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Switch,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import ALL centralized styles and utilities
import {
  // Core modules
  colors,
  typography,
  layout,
  spacing,
  shadows,
  radius,
  
  // Typography helpers
  typo,
  
  // Layout helpers
  flexCenter,
  flexRow,
  flexRowBetween,
  container,
  screen,
  
  // Common styles
  commonStyles,
  
  // Utility functions
  withOpacity,
  responsiveFontSize,
  responsiveWidth,
  responsiveHeight,
  platformStyle,
  useAppTheme,
  getColor,
  
  // Theme
  theme,
} from '../../../styles';

// Import ALL shared components
import { Button, Card, Icon, Toast } from '../../components';

const CompleteHomeScreen = ({ navigation }) => {
  const { colors: themeColors, isDark } = useAppTheme();
  const [showToast, setShowToast] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [switchValue, setSwitchValue] = useState(false);

  const handleButtonPress = (type) => {
    setShowToast(true);
    Alert.alert('Button Pressed', `${type} button was pressed!`);
  };

  const handleToastDismiss = () => {
    setShowToast(false);
  };

  return (
    <ScrollView style={[screen, { backgroundColor: themeColors.background }]}>
      {/* Header Section with Typography Examples */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[typo.h1, { color: themeColors.primaryText }]}>
          Welcome Back!
        </Text>
        <Text style={[typo.body, { color: themeColors.secondaryText }]}>
          Let's build some great flows today
        </Text>
        <Text style={[typo.caption, { color: themeColors.tertiaryText }]}>
          Using centralized style system
        </Text>
      </View>

      {/* Typography Showcase */}
      <Card variant="elevated" padding="lg" margin="md">
        <Text style={[typo.h2, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Typography System
        </Text>
        <Text style={[typo.h3, { color: themeColors.primaryText }]}>Heading 3</Text>
        <Text style={[typo.body, { color: themeColors.primaryText }]}>Body text with proper line height</Text>
        <Text style={[typo.caption, { color: themeColors.secondaryText }]}>Caption text</Text>
        <Text style={[typo.button, { color: themeColors.primaryOrange }]}>Button text style</Text>
        <Text style={[typo.label, { color: themeColors.primaryText }]}>Label text style</Text>
      </Card>

      {/* Color System Showcase */}
      <Card variant="outlined" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Color System
        </Text>
        <View style={styles.colorGrid}>
          <View style={[styles.colorItem, { backgroundColor: themeColors.primaryOrange }]}>
            <Text style={[typo.caption, { color: themeColors.cardBackground }]}>Primary</Text>
          </View>
          <View style={[styles.colorItem, { backgroundColor: themeColors.success }]}>
            <Text style={[typo.caption, { color: themeColors.cardBackground }]}>Success</Text>
          </View>
          <View style={[styles.colorItem, { backgroundColor: themeColors.error }]}>
            <Text style={[typo.caption, { color: themeColors.cardBackground }]}>Error</Text>
          </View>
          <View style={[styles.colorItem, { backgroundColor: themeColors.warning }]}>
            <Text style={[typo.caption, { color: themeColors.cardBackground }]}>Warning</Text>
          </View>
        </View>
      </Card>

      {/* Layout Helpers Showcase */}
      <Card variant="filled" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Layout Helpers
        </Text>
        
        {/* Flex Center Example */}
        <View style={[styles.layoutExample, flexCenter, { backgroundColor: withOpacity(themeColors.primaryOrange, 0.1) }]}>
          <Text style={[typo.caption, { color: themeColors.primaryText }]}>Flex Center</Text>
        </View>

        {/* Flex Row Example */}
        <View style={[styles.layoutExample, flexRow, { backgroundColor: withOpacity(themeColors.success, 0.1) }]}>
          <Text style={[typo.caption, { color: themeColors.primaryText }]}>Flex Row</Text>
          <Icon name="checkmark" size="small" color={themeColors.success} />
        </View>

        {/* Space Between Example */}
        <View style={[styles.layoutExample, flexRowBetween, { backgroundColor: withOpacity(themeColors.info, 0.1) }]}>
          <Text style={[typo.caption, { color: themeColors.primaryText }]}>Space Between</Text>
          <Text style={[typo.caption, { color: themeColors.primaryText }]}>Right</Text>
        </View>
      </Card>

      {/* Spacing System Showcase */}
      <Card variant="default" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Spacing System
        </Text>
        <View style={styles.spacingExample}>
          <View style={[styles.spacingBox, { marginBottom: spacing.xs }]}>
            <Text style={[typo.caption, { color: themeColors.primaryText }]}>XS: {spacing.xs}px</Text>
          </View>
          <View style={[styles.spacingBox, { marginBottom: spacing.sm }]}>
            <Text style={[typo.caption, { color: themeColors.primaryText }]}>SM: {spacing.sm}px</Text>
          </View>
          <View style={[styles.spacingBox, { marginBottom: spacing.md }]}>
            <Text style={[typo.caption, { color: themeColors.primaryText }]}>MD: {spacing.md}px</Text>
          </View>
          <View style={[styles.spacingBox, { marginBottom: spacing.lg }]}>
            <Text style={[typo.caption, { color: themeColors.primaryText }]}>LG: {spacing.lg}px</Text>
          </View>
        </View>
      </Card>

      {/* Button Variants Showcase */}
      <Card variant="elevated" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Button Variants
        </Text>
        
        <View style={styles.buttonGrid}>
          <Button
            variant="primary"
            title="Primary"
            onPress={() => handleButtonPress('Primary')}
            style={styles.buttonItem}
          />
          <Button
            variant="secondary"
            title="Secondary"
            onPress={() => handleButtonPress('Secondary')}
            style={styles.buttonItem}
          />
          <Button
            variant="text"
            title="Text"
            onPress={() => handleButtonPress('Text')}
            style={styles.buttonItem}
          />
          <Button
            variant="fab"
            title="+"
            onPress={() => handleButtonPress('FAB')}
            style={styles.buttonItem}
          />
        </View>

        <View style={styles.buttonSizes}>
          <Button
            variant="primary"
            size="small"
            title="Small"
            onPress={() => handleButtonPress('Small')}
            style={styles.buttonItem}
          />
          <Button
            variant="primary"
            size="medium"
            title="Medium"
            onPress={() => handleButtonPress('Medium')}
            style={styles.buttonItem}
          />
          <Button
            variant="primary"
            size="large"
            title="Large"
            onPress={() => handleButtonPress('Large')}
            style={styles.buttonItem}
          />
        </View>
      </Card>

      {/* Card Variants Showcase */}
      <Card variant="default" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Card Variants
        </Text>
        
        <Card variant="default" padding="md" margin="sm">
          <Text style={[typo.body, { color: themeColors.primaryText }]}>Default Card</Text>
        </Card>
        
        <Card variant="elevated" padding="md" margin="sm">
          <Text style={[typo.body, { color: themeColors.primaryText }]}>Elevated Card</Text>
        </Card>
        
        <Card variant="outlined" padding="md" margin="sm">
          <Text style={[typo.body, { color: themeColors.primaryText }]}>Outlined Card</Text>
        </Card>
        
        <Card variant="filled" padding="md" margin="sm">
          <Text style={[typo.body, { color: themeColors.primaryText }]}>Filled Card</Text>
        </Card>
      </Card>

      {/* Icon Showcase */}
      <Card variant="outlined" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Icon System
        </Text>
        
        <View style={styles.iconGrid}>
          <Icon name="heart" size="small" color={themeColors.error} />
          <Icon name="star" size="medium" color={themeColors.warning} />
          <Icon name="checkmark-circle" size="large" color={themeColors.success} />
          <Icon name="add" size="xl" color={themeColors.primaryOrange} />
        </View>

        <View style={styles.iconGrid}>
          <Icon 
            name="notifications" 
            size="medium" 
            color={themeColors.primaryText}
            badge={5}
          />
          <Icon 
            name="settings" 
            size="medium" 
            color={themeColors.primaryText}
            onPress={() => Alert.alert('Settings', 'Settings pressed!')}
          />
        </View>
      </Card>

      {/* Input Examples */}
      <Card variant="filled" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Input Components
        </Text>
        
        <Text style={[typo.label, { color: themeColors.primaryText, marginBottom: spacing.xs }]}>
          Text Input
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
          placeholder="Enter text here..."
          placeholderTextColor={themeColors.placeholderText}
          value={inputValue}
          onChangeText={setInputValue}
        />

        <View style={[flexRowBetween, { marginTop: spacing.sm }]}>
          <Text style={[typo.label, { color: themeColors.primaryText }]}>
            Switch Toggle
          </Text>
          <Switch
            value={switchValue}
            onValueChange={setSwitchValue}
            trackColor={{ false: themeColors.progressBackground, true: themeColors.primaryOrange }}
            thumbColor={themeColors.cardBackground}
          />
        </View>
      </Card>

      {/* Responsive Design Examples */}
      <Card variant="elevated" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Responsive Design
        </Text>
        
        <View style={[styles.responsiveContainer, { width: responsiveWidth(90) }]}>
          <Text style={[typo.body, { fontSize: responsiveFontSize(16), color: themeColors.primaryText }]}>
            Responsive width: 90% of screen
          </Text>
          <Text style={[typo.caption, { fontSize: responsiveFontSize(14), color: themeColors.secondaryText }]}>
            Responsive font size
          </Text>
        </View>
      </Card>

      {/* Utility Functions Examples */}
      <Card variant="default" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Utility Functions
        </Text>
        
        <View style={styles.utilityExamples}>
          <View style={[styles.utilityBox, { backgroundColor: withOpacity(themeColors.primaryOrange, 0.3) }]}>
            <Text style={[typo.caption, { color: themeColors.primaryText }]}>
              withOpacity(primaryOrange, 0.3)
            </Text>
          </View>
          
          <View style={[styles.utilityBox, { backgroundColor: getColor('success', isDark) }]}>
            <Text style={[typo.caption, { color: themeColors.cardBackground }]}>
              getColor('success', isDark)
            </Text>
          </View>
        </View>
      </Card>

      {/* Common Styles Examples */}
      <Card variant="outlined" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Common Styles
        </Text>
        
        <Text style={[commonStyles.heading, { color: themeColors.primaryText }]}>
          Common Heading Style
        </Text>
        <Text style={[commonStyles.body, { color: themeColors.primaryText }]}>
          Common body style with proper spacing and typography
        </Text>
        <Text style={[commonStyles.caption, { color: themeColors.secondaryText }]}>
          Common caption style
        </Text>
        
        <View style={[commonStyles.centerContainer, { backgroundColor: withOpacity(themeColors.primaryOrange, 0.1) }]}>
          <Text style={[typo.caption, { color: themeColors.primaryText }]}>
            Common center container
          </Text>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, flexRow]}>
        <Button
          variant="fab"
          title="+"
          onPress={() => handleButtonPress('FAB')}
          style={styles.fab}
        />
        <Button
          variant="primary"
          title="View All Features"
          onPress={() => handleButtonPress('View All')}
          fullWidth
          style={styles.fullButton}
        />
      </View>

      {/* Toast Example */}
      {showToast && (
        <Toast
          type="success"
          message="Feature Demonstrated!"
          description="This shows the centralized style system in action"
          onDismiss={handleToastDismiss}
          duration={3000}
        />
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.cardShadow,
  },
  colorGrid: {
    ...flexRow,
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  colorItem: {
    width: 60,
    height: 40,
    ...flexCenter,
    borderRadius: radius.sm,
  },
  layoutExample: {
    height: 40,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  spacingExample: {
    marginTop: spacing.sm,
  },
  spacingBox: {
    height: 20,
    backgroundColor: colors.light.primaryOrange,
    borderRadius: radius.sm,
    ...flexCenter,
  },
  buttonGrid: {
    ...flexRow,
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  buttonSizes: {
    ...flexRow,
    justifyContent: 'space-between',
  },
  buttonItem: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  iconGrid: {
    ...flexRow,
    justifyContent: 'space-around',
    marginVertical: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.body,
  },
  responsiveContainer: {
    ...flexCenter,
    padding: spacing.md,
    backgroundColor: colors.light.progressBackground,
    borderRadius: radius.md,
  },
  utilityExamples: {
    ...flexRow,
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  utilityBox: {
    flex: 1,
    height: 40,
    marginHorizontal: spacing.xs,
    ...flexCenter,
    borderRadius: radius.sm,
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
  bottomSpacing: {
    height: 100,
  },
});

export default CompleteHomeScreen;
