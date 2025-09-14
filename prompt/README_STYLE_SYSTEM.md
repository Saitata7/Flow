# 🎨 Centralized Style System - Complete Guide

This guide shows you how to use the centralized style system in your React Native Habit Tracker app. Everything is now organized, consistent, and easy to maintain!

## 📁 File Structure

```
styles/
├── index.js          # Main export file with all utilities
├── colors.js         # Color palette (light/dark themes)
├── typography.js     # Font families, sizes, weights
└── layout.js         # Spacing, shadows, dimensions

src/components/
├── index.js          # Component exports
└── common/
    ├── Button.js     # Refactored button component
    ├── card.js       # Refactored card component
    ├── Icon.js       # Refactored icon component
    └── Toast.js      # Refactored toast component

src/screens/
├── home/
│   └── HomePage.js   # Refactored home page
└── example/
    ├── HomeScreen.js      # Basic example
    └── CompleteHomeScreen.js  # Complete showcase
```

## 🚀 Quick Start

### 1. Import Everything You Need

```javascript
// Import all centralized styles and utilities
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
  responsiveFontSize,
  responsiveWidth,
  responsiveHeight,
  platformStyle,
  useAppTheme,
  getColor,
} from '../../styles';

// Import shared components
import { Button, Card, Icon, Toast } from '../../components';
```

### 2. Use in Your Components

```javascript
export default function MyScreen() {
  const { colors: themeColors, isDark } = useAppTheme();

  return (
    <ScrollView style={[screen, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[typo.h1, { color: themeColors.primaryText }]}>
          Welcome!
        </Text>
      </View>

      {/* Card */}
      <Card variant="elevated" padding="lg" margin="md">
        <Text style={[typo.body, { color: themeColors.primaryText }]}>
          Content goes here
        </Text>
        <Button
          variant="primary"
          title="Action"
          onPress={() => console.log('Pressed')}
        />
      </Card>
    </ScrollView>
  );
}
```

## 🎨 Complete Style System Reference

### **Colors** (`colors`)
```javascript
import { colors, useAppTheme } from '../../styles';

// Static colors
const primaryColor = colors.light.primaryOrange;
const errorColor = colors.light.error;

// Dynamic colors with theme
const { colors: themeColors } = useAppTheme();
const textColor = themeColors.primaryText;
```

**Available Colors:**
- **Primary**: `primaryOrange`, `primaryOrangeVariants`
- **Semantic**: `success`, `error`, `warning`, `info`
- **Text**: `primaryText`, `secondaryText`, `tertiaryText`
- **Background**: `background`, `cardBackground`
- **Habit-specific**: `habitCompleted`, `habitMissed`, `progressFill`

### **Typography** (`typo`)
```javascript
import { typo, typography } from '../../styles';

// Pre-composed styles
<Text style={typo.h1}>Main Heading</Text>
<Text style={typo.h2}>Sub Heading</Text>
<Text style={typo.h3}>Section Heading</Text>
<Text style={typo.body}>Body text</Text>
<Text style={typo.caption}>Small text</Text>
<Text style={typo.button}>Button text</Text>
<Text style={typo.label}>Label text</Text>

// Custom typography
<Text style={{
  fontSize: typography.sizes.title2,
  fontFamily: typography.fonts.family.bold,
  color: colors.light.primaryText
}}>
  Custom Text
</Text>
```

### **Layout Helpers** (`layout`)
```javascript
import { flexCenter, flexRow, flexRowBetween, container, screen } from '../../styles';

// Common layouts
<View style={[screen, flexCenter]}>
  <Text>Centered content</Text>
</View>

<View style={[container, flexRow]}>
  <Text>Row layout</Text>
</View>

<View style={[container, flexRowBetween]}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>
```

### **Spacing** (`spacing`)
```javascript
import { spacing } from '../../styles';

// Use consistent spacing
<View style={{ 
  padding: spacing.md, 
  margin: spacing.lg,
  gap: spacing.sm 
}}>
  <Text>Content</Text>
</View>
```

**Available Spacing:**
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `xxl`: 48px

### **Shadows & Radius** (`shadows`, `radius`)
```javascript
import { shadows, radius } from '../../styles';

// Apply shadows
<View style={[styles.card, shadows.cardShadow]}>
  <Text>Card with shadow</Text>
</View>

// Use radius values
<View style={{ borderRadius: radius.squircle }}>
  <Text>Rounded corners</Text>
</View>
```

**Available Radius:**
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 20px
- `squircle`: 22px
- `pill`: 25px
- `circle`: 50px

## 🧩 Component Usage

### **Button Component**
```javascript
import { Button } from '../../components';

// Different variants
<Button variant="primary" title="Primary Button" onPress={handlePress} />
<Button variant="secondary" title="Secondary Button" onPress={handlePress} />
<Button variant="text" title="Text Button" onPress={handlePress} />
<Button variant="fab" title="+" onPress={handlePress} />

// With all props
<Button
  variant="primary"
  size="large"
  title="Large Button"
  onPress={handlePress}
  loading={isLoading}
  disabled={isDisabled}
  fullWidth
  icon="add"
  iconPosition="left"
  style={customStyle}
/>
```

### **Card Component**
```javascript
import { Card } from '../../components';

// Different variants
<Card variant="default">
  <Text>Default card</Text>
</Card>

<Card variant="elevated" padding="lg" margin="md">
  <Text>Elevated card with custom padding</Text>
</Card>

<Card variant="outlined" padding="sm">
  <Text>Outlined card</Text>
</Card>

<Card variant="filled" padding="lg">
  <Text>Filled card</Text>
</Card>
```

### **Icon Component**
```javascript
import { Icon } from '../../components';

// Basic usage
<Icon name="add" size="medium" color={colors.light.primaryOrange} />

// With interaction
<Icon 
  name="heart" 
  size="large" 
  color={colors.light.error}
  onPress={handleLike}
  badge={5}
/>

// Different sizes
<Icon name="star" size="small" />
<Icon name="star" size="medium" />
<Icon name="star" size="large" />
<Icon name="star" size={32} />
```

### **Toast Component**
```javascript
import { Toast } from '../../components';

// Different types
<Toast 
  type="success" 
  message="Habit completed!" 
  onDismiss={handleDismiss} 
/>

<Toast 
  type="error" 
  message="Failed to save" 
  description="Please try again"
  onDismiss={handleDismiss}
  duration={5000}
/>

// With action
<Toast 
  type="info" 
  message="New update available"
  action={{ text: "Update", onPress: handleUpdate }}
  onDismiss={handleDismiss}
/>
```

## 🛠️ Utility Functions

### **Color Utilities**
```javascript
import { withOpacity, getColor, useAppTheme } from '../../styles';

// Add opacity to colors
const semiTransparent = withOpacity(colors.light.primaryOrange, 0.5);

// Get colors dynamically
const dynamicColor = getColor('primaryOrange', isDark);

// Use theme hook
const { colors: themeColors, isDark } = useAppTheme();
```

### **Responsive Utilities**
```javascript
import { responsiveFontSize, responsiveWidth, responsiveHeight } from '../../styles';

// Responsive sizing
<View style={{ 
  width: responsiveWidth(90), // 90% of screen width
  height: responsiveHeight(20), // 20% of screen height
}}>
  <Text style={{ fontSize: responsiveFontSize(16) }}>
    Responsive text
  </Text>
</View>
```

### **Platform Utilities**
```javascript
import { platformStyle } from '../../styles';

// Platform-specific styles
<View style={platformStyle(
  { paddingTop: 20 }, // iOS
  { paddingTop: 10 }  // Android
)}>
  <Text>Platform-specific content</Text>
</View>
```

## 📱 Complete Example Screen

Here's a complete example showing how to use everything:

```javascript
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { 
  colors, 
  typo, 
  spacing, 
  flexCenter, 
  container, 
  screen,
  useAppTheme,
  withOpacity 
} from '../../styles';
import { Button, Card, Icon, Toast } from '../../components';

export default function ExampleScreen() {
  const { colors: themeColors, isDark } = useAppTheme();
  const [showToast, setShowToast] = useState(false);

  return (
    <ScrollView style={[screen, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[typo.h1, { color: themeColors.primaryText }]}>
          Example Screen
        </Text>
        <Text style={[typo.body, { color: themeColors.secondaryText }]}>
          Using centralized styles
        </Text>
      </View>

      {/* Content Card */}
      <Card variant="elevated" padding="lg" margin="md">
        <Text style={[typo.h3, { color: themeColors.primaryText, marginBottom: spacing.sm }]}>
          Features
        </Text>
        
        <View style={[flexCenter, { marginBottom: spacing.md }]}>
          <Icon name="star" size="large" color={themeColors.primaryOrange} />
        </View>

        <Text style={[typo.body, { color: themeColors.primaryText, marginBottom: spacing.md }]}>
          This screen demonstrates all the centralized style system features.
        </Text>

        <Button
          variant="primary"
          title="Show Toast"
          onPress={() => setShowToast(true)}
          fullWidth
        />
      </Card>

      {/* Toast */}
      {showToast && (
        <Toast
          type="success"
          message="Toast shown!"
          onDismiss={() => setShowToast(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
```

## 🔧 Adding New Styles

### **Adding New Colors**
1. Add to `styles/colors.js`:
```javascript
export const colors = {
  light: {
    // ... existing colors
    newColor: '#FF6B6B',
  },
  dark: {
    // ... existing colors
    newColor: '#FF8E8E',
  },
};
```

2. Use in components:
```javascript
import { colors } from '../../styles';
const newColor = colors.light.newColor;
```

### **Adding New Typography**
1. Add to `styles/typography.js`:
```javascript
export const typography = {
  styles: {
    // ... existing styles
    customHeading: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 30,
    },
  },
};
```

2. Use in components:
```javascript
import { typography } from '../../styles';
<Text style={typography.styles.customHeading}>Custom Heading</Text>
```

### **Adding New Layout Helpers**
1. Add to `styles/index.js`:
```javascript
export const customLayout = {
  customContainer: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.light.background,
  },
};
```

2. Use in components:
```javascript
import { customLayout } from '../../styles';
<View style={customLayout.customContainer}>
  <Text>Content</Text>
</View>
```

## 📱 Best Practices

### **1. Use Theme Hook for Dynamic Colors**
```javascript
import { useAppTheme } from '../../styles';

const MyComponent = () => {
  const { colors: themeColors, isDark } = useAppTheme();
  
  return (
    <View style={{ backgroundColor: themeColors.background }}>
      <Text style={{ color: themeColors.primaryText }}>
        Dynamic content
      </Text>
    </View>
  );
};
```

### **2. Compose Styles Efficiently**
```javascript
// Good: Compose styles
const styles = StyleSheet.create({
  container: {
    ...container,
    ...flexCenter,
    padding: spacing.lg,
  },
});

// Avoid: Inline styles
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
```

### **3. Use Responsive Helpers**
```javascript
import { responsiveWidth, responsiveFontSize } from '../../styles';

const styles = StyleSheet.create({
  responsiveContainer: {
    width: responsiveWidth(90), // 90% of screen width
    fontSize: responsiveFontSize(16), // Responsive font size
  },
});
```

### **4. Leverage Common Styles**
```javascript
import { commonStyles } from '../../styles';

// Use pre-composed common styles
<Text style={commonStyles.heading}>Heading</Text>
<View style={commonStyles.centerContainer}>
  <Text>Centered content</Text>
</View>
```

## 🎯 Benefits

✅ **Consistency**: All components use the same design tokens  
✅ **Maintainability**: Change colors/spacing in one place  
✅ **Type Safety**: Better IntelliSense and error catching  
✅ **Performance**: Pre-composed StyleSheet objects  
✅ **Theming**: Easy light/dark mode switching  
✅ **Responsive**: Built-in responsive helpers  
✅ **Clean Code**: Less repetitive styling code  
✅ **Scalability**: Easy to add new styles and components  

## 🚀 Migration Guide

### **From Old Style System**
1. Replace hardcoded colors with `colors.light.*`
2. Replace hardcoded spacing with `spacing.*`
3. Replace hardcoded typography with `typo.*`
4. Use layout helpers instead of inline styles
5. Replace custom components with shared components

### **Before (Old Way)**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF0E6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  button: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
  },
});
```

### **After (New Way)**
```javascript
import { container, typo, colors, spacing, radius } from '../../styles';
import { Button } from '../../components';

const styles = StyleSheet.create({
  container: {
    ...container,
    backgroundColor: colors.light.background,
  },
  title: {
    ...typo.h1,
    color: colors.light.primaryText,
  },
});

// Use shared Button component instead of custom button
<Button variant="primary" title="Action" onPress={handlePress} />
```

## 🎨 Naming Conventions

### **Colors**
- Use semantic names: `primaryText`, `error`, `success`
- Use descriptive names: `cardBackground`, `progressFill`
- Group related colors: `primaryOrangeVariants.light`

### **Typography**
- Use size-based names: `h1`, `h2`, `body`, `caption`
- Use purpose-based names: `button`, `label`, `heading`

### **Layout**
- Use descriptive names: `flexCenter`, `container`, `screen`
- Use size-based names: `spacing.sm`, `radius.md`

### **Components**
- Use PascalCase: `Button`, `Card`, `Icon`
- Use descriptive names: `HabitCard`, `ProgressBar`

---

**Your React Native app now has a professional, scalable style system! 🎉✨**

Start using it in your screens and enjoy the benefits of consistent, maintainable styling!
