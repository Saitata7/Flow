# 🎨 Centralized Style System Guide

This guide explains how to use the centralized style system in your React Native Habit Tracker app.

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
```

## 🚀 Quick Start

### Import Styles
```javascript
// Import everything from styles
import { colors, typography, layout, spacing, shadows, typo, flexCenter } from '../styles';

// Or import specific utilities
import { colors, spacing } from '../styles';
```

### Import Components
```javascript
// Import shared components
import { Button, Card, Icon, Toast } from '../components';

// Or import individually
import Button from '../components/common/Button';
```

## 🎨 Color System

### Usage
```javascript
import { colors, useAppTheme } from '../styles';

// Static colors
const primaryColor = colors.light.primaryOrange;
const errorColor = colors.light.error;

// Dynamic colors with theme
const { colors: themeColors } = useAppTheme();
const textColor = themeColors.primaryText;
```

### Available Colors
- **Primary**: `primaryOrange`, `primaryOrangeVariants`
- **Semantic**: `success`, `error`, `warning`, `info`
- **Text**: `primaryText`, `secondaryText`, `tertiaryText`
- **Background**: `background`, `cardBackground`
- **Habit-specific**: `habitCompleted`, `habitMissed`, `progressFill`

## 📝 Typography System

### Usage
```javascript
import { typo, typography } from '../styles';

// Pre-composed styles
<Text style={typo.h1}>Main Heading</Text>
<Text style={typo.body}>Body text</Text>
<Text style={typo.caption}>Small text</Text>

// Custom typography
<Text style={{
  fontSize: typography.sizes.title2,
  fontFamily: typography.fonts.family.bold,
  color: colors.light.primaryText
}}>
  Custom Text
</Text>
```

### Available Typography
- **Headings**: `typo.h1`, `typo.h2`, `typo.h3`
- **Body**: `typo.body`, `typo.caption`
- **UI**: `typo.button`, `typo.label`

## 📐 Layout System

### Spacing
```javascript
import { spacing } from '../styles';

// Use consistent spacing
<View style={{ padding: spacing.md, margin: spacing.lg }}>
  <Text>Content</Text>
</View>
```

### Layout Helpers
```javascript
import { flexCenter, flexRow, container, screen } from '../styles';

// Common layouts
<View style={[screen, flexCenter]}>
  <Text>Centered content</Text>
</View>

<View style={[container, flexRow]}>
  <Text>Row layout</Text>
</View>
```

### Shadows & Radius
```javascript
import { shadows, radius } from '../styles';

// Apply shadows
<View style={[styles.card, shadows.cardShadow]}>
  <Text>Card with shadow</Text>
</View>

// Use radius values
<View style={{ borderRadius: radius.squircle }}>
  <Text>Rounded corners</Text>
</View>
```

## 🧩 Component Usage

### Button Component
```javascript
import { Button } from '../components';

// Different variants
<Button variant="primary" title="Primary Button" onPress={handlePress} />
<Button variant="secondary" title="Secondary Button" onPress={handlePress} />
<Button variant="text" title="Text Button" onPress={handlePress} />
<Button variant="fab" title="+" onPress={handlePress} />

// With props
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
/>
```

### Card Component
```javascript
import { Card } from '../components';

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
```

### Icon Component
```javascript
import { Icon } from '../components';

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

### Toast Component
```javascript
import { Toast } from '../components';

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

## 🎯 Example Screen

Here's a complete example of how to use the style system in a screen:

```javascript
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, typo, spacing, flexCenter, container } from '../styles';
import { Button, Card, Icon } from '../components';

export default function ProfileScreen() {
  return (
    <ScrollView style={[container, { backgroundColor: colors.light.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typo.h1, { color: colors.light.primaryText }]}>
          Profile
        </Text>
      </View>

      {/* Profile Card */}
      <Card variant="elevated" padding="lg" margin="md">
        <View style={[flexCenter, { marginBottom: spacing.md }]}>
          <Icon name="person-circle" size="xl" color={colors.light.primaryOrange} />
          <Text style={[typo.h2, { color: colors.light.primaryText, marginTop: spacing.sm }]}>
            John Doe
          </Text>
        </View>
        
        <Button
          variant="primary"
          title="Edit Profile"
          onPress={() => console.log('Edit profile')}
          fullWidth
        />
      </Card>

      {/* Stats */}
      <Card variant="default" padding="md">
        <Text style={[typo.h3, { color: colors.light.primaryText }]}>
          Statistics
        </Text>
        {/* Stats content */}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
});
```

## 🔧 Adding New Styles

### Adding New Colors
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
import { colors } from '../styles';
const newColor = colors.light.newColor;
```

### Adding New Typography
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
import { typography } from '../styles';
<Text style={typography.styles.customHeading}>Custom Heading</Text>
```

### Adding New Layout Helpers
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
import { customLayout } from '../styles';
<View style={customLayout.customContainer}>
  <Text>Content</Text>
</View>
```

## 📱 Best Practices

### 1. Use Theme Hook for Dynamic Colors
```javascript
import { useAppTheme } from '../styles';

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

### 2. Compose Styles Efficiently
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

### 3. Use Responsive Helpers
```javascript
import { responsiveWidth, responsiveFontSize } from '../styles';

const styles = StyleSheet.create({
  responsiveContainer: {
    width: responsiveWidth(90), // 90% of screen width
    fontSize: responsiveFontSize(16), // Responsive font size
  },
});
```

### 4. Leverage Common Styles
```javascript
import { commonStyles } from '../styles';

// Use pre-composed common styles
<Text style={commonStyles.heading}>Heading</Text>
<View style={commonStyles.centerContainer}>
  <Text>Centered content</Text>
</View>
```

## 🎨 Naming Conventions

### Colors
- Use semantic names: `primaryText`, `error`, `success`
- Use descriptive names: `cardBackground`, `progressFill`
- Group related colors: `primaryOrangeVariants.light`

### Typography
- Use size-based names: `h1`, `h2`, `body`, `caption`
- Use purpose-based names: `button`, `label`, `heading`

### Layout
- Use descriptive names: `flexCenter`, `container`, `screen`
- Use size-based names: `spacing.sm`, `radius.md`

### Components
- Use PascalCase: `Button`, `Card`, `Icon`
- Use descriptive names: `HabitCard`, `ProgressBar`

## 🚀 Migration Guide

### From Old Style System
1. Replace hardcoded colors with `colors.light.*`
2. Replace hardcoded spacing with `spacing.*`
3. Replace hardcoded typography with `typo.*`
4. Use layout helpers instead of inline styles

### Before (Old Way)
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
});
```

### After (New Way)
```javascript
import { container, spacing, typo, colors } from '../styles';

const styles = StyleSheet.create({
  container: {
    ...container,
    padding: spacing.md,
    backgroundColor: colors.light.background,
  },
  title: {
    ...typo.h1,
    color: colors.light.primaryText,
  },
});
```

## 🎯 Benefits

✅ **Consistency**: All components use the same design tokens  
✅ **Maintainability**: Change colors/spacing in one place  
✅ **Type Safety**: Better IntelliSense and error catching  
✅ **Performance**: Pre-composed StyleSheet objects  
✅ **Theming**: Easy light/dark mode switching  
✅ **Responsive**: Built-in responsive helpers  
✅ **Clean Code**: Less repetitive styling code  

---

**Happy Styling! 🎨✨**
