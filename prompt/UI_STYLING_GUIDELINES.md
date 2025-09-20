# Stats & Flow Details UI Styling Guidelines

## Overview
This document provides comprehensive guidelines for UI styling and layout patterns specifically used in the **Stats** and **Flow Details** screens of the Flow mobile application. It serves as a reference for maintaining consistency and implementing analytics-related features.

## Table of Contents
1. [Stats Screen Overview](#stats-screen-overview)
2. [Flow Details Screen Overview](#flow-details-screen-overview)
3. [Design System](#design-system)
4. [Component Patterns](#component-patterns)
5. [Layout Guidelines](#layout-guidelines)
6. [Color Usage](#color-usage)
7. [Typography](#typography)
8. [Spacing & Sizing](#spacing--sizing)
9. [Animation Guidelines](#animation-guidelines)
10. [Heat Map Implementation](#heat-map-implementation)
11. [Chart Configuration](#chart-configuration)
12. [Analytics Components](#analytics-components)
13. [Best Practices](#best-practices)

## Stats Screen Overview

### Location
`/apps/mobile/src/screens/stats/Stats.js`

### Purpose
Main statistics dashboard showing overall analytics, daily performance trends, flow performance, achievements, and insights.

### Key Components
- **Analytics Dashboard**: Key metrics (Total Flows, Success Rate, Active Streak, Total Points)
- **Daily Performance Trend**: Line chart showing completion rates over time
- **Flow Performance**: Individual flow cards with performance metrics
- **Achievements**: Achievement badges and progress indicators
- **Overall Insights**: Contextual recommendations and analysis

### Layout Structure
```
Header (Title + Subtitle)
View Mode Selector (Overview/Summary)
Timeframe Selector (7D, 30D, 1Y)
Analytics Cards (2x2 grid)
Daily Performance Chart
Flow Performance Cards
Achievements Panel
Overall Insights Panel
```

## Flow Details Screen Overview

### Location
`/apps/mobile/src/components/FlowStats/FlowStatsDetail.js`

### Purpose
Detailed analytics for individual flows with type-specific metrics, heat maps, and insights.

### Key Components
- **Header**: Back button + Flow title + Flow type
- **Timeframe Selector**: 7D, 30D, 1Y buttons
- **Primary Metric**: Highlighted main statistic
- **Secondary Metrics**: 2x2 grid of supporting metrics
- **Chart**: 7-day trend visualization
- **Heat Map**: 30-day activity visualization
- **Type-Specific Stats**: Additional metrics for Quantitative/Time-based flows
- **Insights**: Contextual recommendations

### Layout Structure
```
Header (Back + Title + Subtitle)
Timeframe Selector
Primary Metric Card
Secondary Metrics Grid (2x2)
Chart Section
Heat Map Section
Type-Specific Stats (if applicable)
Insights Section
```

### Flow Type Variations
- **Binary Flows**: Success rate, streaks, completion metrics
- **Quantitative Flows**: Total value, daily averages, goal achievement
- **Time-based Flows**: Total time, session analysis, focus scores

## Design System

### Centralized Style System
The app uses a centralized style system located in `/apps/mobile/styles/`:

```javascript
import { colors, typography, layout } from '../../../styles';
```

### Key Files
- `colors.js` - Color palette and theme definitions
- `typography.js` - Font sizes, weights, and text styles
- `layout.js` - Spacing, shadows, border radius, and layout constants
- `index.js` - Main export file

## Component Patterns

### Card Components
Use the centralized `Card` component for consistent styling:

```javascript
import Card from '../common/card';

// Usage
<Card variant="default" padding="lg" margin="md">
  {/* Content */}
</Card>
```

### Metric Cards
For displaying statistics and metrics:

```javascript
const MetricCard = ({ title, value, subtitle, icon, color }) => (
  <View style={styles.metricCard}>
    <LinearGradient
      colors={[color + '20', color + '10']}
      style={styles.metricGradient}
    >
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: themeColors.primaryText }]}>{value}</Text>
      <Text style={[styles.metricTitle, { color: themeColors.secondaryText }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: themeColors.tertiaryText }]}>{subtitle}</Text>
      )}
    </LinearGradient>
  </View>
);
```

### Button Patterns
Consistent button styling across the app:

```javascript
// Timeframe Selector Buttons
<TouchableOpacity
  style={[
    styles.timeframeButton,
    selectedTimeframe === timeframe && styles.activeTimeframeButton,
    { backgroundColor: selectedTimeframe === timeframe ? colors.light.primaryOrange : themeColors.cardBackground }
  ]}
  onPress={() => setSelectedTimeframe(timeframe)}
>
  <Text
    style={[
      styles.timeframeText,
      { color: selectedTimeframe === timeframe ? '#FFFFFF' : themeColors.primaryText }
    ]}
  >
    {timeframe}
  </Text>
</TouchableOpacity>
```

## Layout Guidelines

### Container Structure
Standard container pattern for screens:

```javascript
<SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
  <ScrollView
    contentContainerStyle={styles.contentContainer}
    showsVerticalScrollIndicator={false}
  >
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

### Grid Layouts
For metric cards and similar components:

```javascript
const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: layout.spacing.md,
  },
  metricCard: {
    width: '48%',
    marginBottom: layout.spacing.sm,
  },
});
```

### Header Patterns
Consistent header structure:

```javascript
<View style={styles.header}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="arrow-back" size={24} color={themeColors.primaryText} />
  </TouchableOpacity>
  <View style={styles.headerContent}>
    <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>{title}</Text>
    <Text style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>{subtitle}</Text>
  </View>
</View>
```

## Color Usage

### Theme Colors
Always use theme-aware colors:

```javascript
const themeColors = theme === 'light' ? colors.light : colors.dark;
const isDark = theme === 'dark';
```

### Color Palette
Standard color usage:

```javascript
// Primary colors
colors.light.primaryOrange    // Main brand color
colors.light.success          // Success states
colors.light.error           // Error states
colors.light.warning         // Warning states
colors.light.info            // Information states

// Text colors
themeColors.primaryText      // Main text
themeColors.secondaryText    // Secondary text
themeColors.tertiaryText     // Tertiary text

// Background colors
themeColors.background       // Screen background
themeColors.cardBackground   // Card backgrounds
```

### Gradient Usage
For metric cards and highlights:

```javascript
<LinearGradient
  colors={[color + '20', color + '10']}
  style={styles.metricGradient}
>
  {/* Content */}
</LinearGradient>
```

## Typography

### Text Styles
Use centralized typography styles:

```javascript
// Headers
...typography.styles.largeTitle  // Main titles
...typography.styles.title1      // Section titles
...typography.styles.title2      // Subsection titles
...typography.styles.title3      // Card titles

// Body text
...typography.styles.body        // Regular text
...typography.styles.caption     // Small text, labels

// Custom sizing
fontSize: 12,                    // Small buttons
fontSize: 10,                    // Very small text
fontSize: 11,                    // Medium small text
```

### Font Weights
Consistent weight usage:

```javascript
fontWeight: '700'  // Bold titles and values
fontWeight: '600'  // Semi-bold headers
fontWeight: '400'  // Regular text (default)
```

## Spacing & Sizing

### Spacing System
Use centralized spacing:

```javascript
layout.spacing.xs    // 4px - Very small spacing
layout.spacing.sm    // 8px - Small spacing
layout.spacing.md    // 16px - Medium spacing
layout.spacing.lg    // 24px - Large spacing
layout.spacing.xl    // 32px - Extra large spacing
```

### Component Sizing
Standard component dimensions:

```javascript
// Buttons
paddingVertical: layout.spacing.xs,     // Small buttons
paddingHorizontal: layout.spacing.sm,   // Small buttons
paddingVertical: layout.spacing.sm,     // Medium buttons
paddingHorizontal: layout.spacing.md,   // Medium buttons

// Cards
padding: layout.spacing.sm,             // Small cards
padding: layout.spacing.md,             // Medium cards
padding: layout.spacing.lg,             // Large cards

// Border radius
borderRadius: layout.borderRadius.sm,   // Small radius
borderRadius: layout.borderRadius.md,   // Medium radius
borderRadius: layout.borderRadius.lg,   // Large radius
```

### Heat Map Sizing
Specific sizing for heat map components:

```javascript
// Heat map squares
width: 28,
height: 28,
borderRadius: 6,

// Legend colors
width: 14,
height: 14,
borderRadius: 3,
```

## Animation Guidelines

### Staggered Animations
For heat maps and grid layouts:

```javascript
const [animatedValues] = useState(() => 
  data.map(() => new Animated.Value(0))
);

React.useEffect(() => {
  const animations = animatedValues.map((animValue, index) => 
    Animated.timing(animValue, {
      toValue: 1,
      duration: 300,
      delay: index * 20,
      useNativeDriver: true,
    })
  );
  
  Animated.stagger(50, animations).start();
}, []);
```

### Scale Animations
For interactive elements:

```javascript
transform: [
  {
    scale: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    }),
  },
],
```

### Performance Best Practices
- Always use `useNativeDriver: true` for transform and opacity animations
- Keep animation durations between 200-400ms
- Use staggered delays of 20-50ms for sequential animations

## Heat Map Implementation

### Color Intensity System
6-level intensity system:

```javascript
const getIntensityColor = (intensity) => {
  if (intensity === 0) return colors.light.progressBackground + '15';
  if (intensity <= 0.2) return '#FFE4B5';
  if (intensity <= 0.4) return '#FFD700';
  if (intensity <= 0.6) return '#FF8C00';
  if (intensity <= 0.8) return '#FF6347';
  return '#FF4500';
};
```

### Interactive Features
Day selection and information display:

```javascript
<TouchableOpacity
  style={[
    styles.heatMapDay,
    {
      backgroundColor: getIntensityColor(day.intensity),
      borderColor: day.isToday ? colors.light.primaryOrange : 'transparent',
      borderWidth: day.isToday ? 3 : 0,
      shadowColor: day.intensity > 0.5 ? colors.light.primaryOrange : 'transparent',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: day.intensity > 0.5 ? 0.3 : 0,
      shadowRadius: 4,
      elevation: day.intensity > 0.5 ? 3 : 0,
    }
  ]}
  onPress={() => setSelectedDay(selectedDay === day.date ? null : day.date)}
  activeOpacity={0.7}
>
```

### Statistics Display
Heat map statistics bar:

```javascript
<View style={styles.heatMapStats}>
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color: colors.light.success }]}>{activeDays}</Text>
    <Text style={[styles.statLabel, { color: themeColors.secondaryText }]}>Active Days</Text>
  </View>
  {/* More stats */}
</View>
```

## Chart Configuration

### Light Theme Charts
Standard chart configuration for light theme:

```javascript
const chartConfig = {
  backgroundColor: '#FFFFFF',
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 12,
  },
  propsForDots: {
    r: '3',
    strokeWidth: '2',
    stroke: '#FF9500',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#E5E5E5',
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 10,
    fill: '#000000',
  },
  propsForVerticalLabels: {
    fontSize: 10,
    fill: '#000000',
  },
  propsForHorizontalLabels: {
    fontSize: 10,
    fill: '#000000',
  },
};
```

### Chart Dimensions
Standard chart sizing:

```javascript
// Line charts
width={screenWidth - 64}
height={160}

// Heat maps
width={screenWidth - 64}
height={220}
```

## Analytics Components

### Stats Service Integration
Both screens use the centralized stats service for data processing:

```javascript
import statsService from '../../services/statsService';

// Calculate overall stats
const overallStats = statsService.calculateOverallStats(flows, {
  timeframe: selectedTimeframe,
  selectedPeriod: 'weekly',
  selectedYear: moment().year()
});

// Calculate flow-specific stats
const flowStats = statsService.calculateFlowStats(flow, {
  timeframe: selectedTimeframe,
  selectedPeriod: 'weekly',
  selectedYear: moment().year()
});
```

### Timeframe Selector Pattern
Consistent timeframe selection across both screens:

```javascript
<View style={styles.timeframeSelector}>
  {['7D', '30D', '1Y'].map((timeframe) => (
    <TouchableOpacity
      key={timeframe}
      style={[
        styles.timeframeButton,
        selectedTimeframe === timeframe && styles.activeTimeframeButton,
        { backgroundColor: selectedTimeframe === timeframe ? colors.light.primaryOrange : themeColors.cardBackground }
      ]}
      onPress={() => setSelectedTimeframe(timeframe)}
    >
      <Text
        style={[
          styles.timeframeText,
          { color: selectedTimeframe === timeframe ? '#FFFFFF' : themeColors.primaryText }
        ]}
      >
        {timeframe}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

### View Mode Toggle (Stats Screen Only)
Toggle between Overview and Summary views:

```javascript
<View style={styles.viewModeSelector}>
  {['Overview', 'Summary'].map((mode) => (
    <TouchableOpacity
      key={mode}
      style={[
        styles.viewModeButton,
        viewMode === mode && styles.activeViewModeButton,
        { backgroundColor: viewMode === mode ? colors.light.primaryOrange : themeColors.cardBackground }
      ]}
      onPress={() => setViewMode(mode)}
    >
      <Text
        style={[
          styles.viewModeText,
          { color: viewMode === mode ? '#FFFFFF' : themeColors.primaryText }
        ]}
      >
        {mode}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

### Flow Performance Cards
Clickable cards for individual flow analytics:

```javascript
<TouchableOpacity
  style={styles.flowCard}
  onPress={() => navigation.navigate('FlowStatsDetail', { flowId: flow.id })}
>
  <Text style={[styles.flowCardTitle, { color: themeColors.primaryText }]}>
    {flow.title}
  </Text>
  <Text style={[styles.flowStatValue, { color: themeColors.primaryText }]}>
    {performancePercentage}%
  </Text>
  <Text style={[styles.flowStatLabel, { color: themeColors.secondaryText }]}>
    Performance
  </Text>
  <View style={styles.flowProgressBar}>
    <View 
      style={[
        styles.flowProgressFill, 
        { 
          width: `${performancePercentage}%`,
          backgroundColor: colors.light.primaryOrange 
        }
      ]} 
    />
  </View>
</TouchableOpacity>
```

### Achievement Badges
Visual achievement indicators:

```javascript
<View style={styles.achievementCard}>
  <View style={styles.achievementIcon}>
    <Ionicons name="trophy" size={24} color={colors.light.warning} />
  </View>
  <View style={styles.achievementContent}>
    <Text style={[styles.achievementTitle, { color: themeColors.primaryText }]}>
      {achievement.title}
    </Text>
    <Text style={[styles.achievementDescription, { color: themeColors.secondaryText }]}>
      {achievement.description}
    </Text>
    <View style={styles.achievementProgress}>
      <View 
        style={[
          styles.achievementProgressFill, 
          { 
            width: `${achievement.progress}%`,
            backgroundColor: colors.light.success 
          }
        ]} 
      />
    </View>
  </View>
</View>
```

### Insights Panel
Contextual recommendations and analysis:

```javascript
<Card variant="default" padding="lg" margin="md">
  <Text style={[styles.insightsTitle, { color: themeColors.primaryText }]}>Insights</Text>
  <View style={styles.insightsList}>
    {insights.map((insight, index) => (
      <View key={index} style={styles.insightItem}>
        <Ionicons name={insight.icon} size={20} color={insight.color} />
        <Text style={[styles.insightText, { color: themeColors.primaryText }]}>
          {insight.text}
        </Text>
      </View>
    ))}
  </View>
</Card>
```

## Best Practices

### Code Organization
1. **Import Order**: React imports first, then third-party, then local imports
2. **Component Structure**: Props, state, effects, functions, render
3. **Style Organization**: Group related styles together
4. **Consistent Naming**: Use descriptive names for styles and components

### Performance
1. **Memoization**: Use `useMemo` for expensive calculations
2. **Native Driver**: Always use native driver for animations
3. **Efficient Rendering**: Minimize re-renders with proper dependency arrays
4. **Image Optimization**: Use appropriate image sizes and formats

### Accessibility
1. **Touch Targets**: Minimum 44px touch targets
2. **Color Contrast**: Ensure sufficient contrast ratios
3. **Text Sizing**: Use readable font sizes
4. **Screen Reader**: Provide meaningful labels and descriptions

### Error Handling
1. **Empty States**: Provide meaningful empty state messages
2. **Loading States**: Show loading indicators for async operations
3. **Error Boundaries**: Implement error boundaries for component trees
4. **Graceful Degradation**: Handle missing data gracefully

### Testing
1. **Component Testing**: Test component behavior and rendering
2. **Style Testing**: Verify styles are applied correctly
3. **Animation Testing**: Test animation performance and behavior
4. **Accessibility Testing**: Verify accessibility features work

## Common Patterns

### Empty States
```javascript
<View style={styles.emptyState}>
  <Text style={[styles.emptyIcon, { color: themeColors.secondaryText }]}>📊</Text>
  <Text style={[styles.emptyTitle, { color: themeColors.primaryText }]}>No Data Available</Text>
  <Text style={[styles.emptySubtitle, { color: themeColors.secondaryText }]}>
    Unable to load data. Please try again.
  </Text>
</View>
```

### Loading States
```javascript
{loading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.light.primaryOrange} />
    <Text style={[styles.loadingText, { color: themeColors.secondaryText }]}>Loading...</Text>
  </View>
) : (
  {/* Content */}
)}
```

### Section Headers
```javascript
<View style={styles.sectionHeader}>
  <Ionicons name="calendar" size={24} color={colors.light.primaryOrange} />
  <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>Section Title</Text>
</View>
```

## Future Considerations

### Scalability
- Consider component composition patterns for complex layouts
- Implement design tokens for consistent theming
- Use TypeScript for better type safety
- Consider implementing a design system library

### Performance
- Implement virtual scrolling for large lists
- Use React.memo for expensive components
- Consider lazy loading for heavy components
- Implement proper image caching strategies

### Maintainability
- Document component APIs and usage patterns
- Implement consistent error handling patterns
- Use proper state management for complex state
- Implement proper testing strategies

---

## Screen-Specific Implementation Notes

### Stats Screen (`/apps/mobile/src/screens/stats/Stats.js`)
- **Navigation**: Uses `StatsStack` navigation
- **Data Source**: `FlowsContext` for flow data
- **Service Integration**: `statsService.calculateOverallStats()`
- **View Modes**: Overview (detailed) and Summary (simplified)
- **Timeframe Support**: 7D, 30D, 1Y with dynamic data updates

### Flow Details Screen (`/apps/mobile/src/components/FlowStats/FlowStatsDetail.js`)
- **Navigation**: Accessed via `FlowStatsDetail` route
- **Data Source**: Individual flow from `FlowsContext`
- **Service Integration**: `statsService.calculateFlowStats()`
- **Flow Type Support**: Binary, Quantitative, Time-based with type-specific analytics
- **Interactive Features**: Heat map day selection, timeframe switching

### Navigation Integration
```javascript
// StatsStack.js
import FlowStatsDetail from '../components/FlowStats/FlowStatsDetail';

<Stack.Screen 
  name="FlowStatsDetail" 
  component={FlowStatsDetail}
  options={{ headerShown: false }}
/>
```

### Data Flow
1. **Stats Screen**: Displays overall analytics and flow performance cards
2. **Flow Cards**: Clickable cards navigate to Flow Details
3. **Flow Details**: Shows individual flow analytics with heat maps
4. **Back Navigation**: Returns to Stats screen

---

*This document specifically covers the Stats and Flow Details screens. It should be updated as new analytics features are added or existing patterns evolve.*
