# Home Page UI/UX Reference

## Overview
This document serves as a comprehensive reference for the Home Page UI/UX design, implementation, and user experience patterns in the Flow mobile application.

## Design System

### Color Palette
- **Primary Background**: `#FEDFCD` (Light peach/cream)
- **Card Background**: `#FFFFFF` (White)
- **Primary Orange**: `#FF8C00` (Orange)
- **Primary Orange Light**: `#FFB366` (Light orange)
- **Success Green**: `#D1FAE5` (Light green)
- **Error Red**: `#FEE2E2` (Light red)
- **Neutral Yellow**: `#FEF3C7` (Light yellow/beige)

### Typography
- **Font Family**: System (iOS) / Roboto (Android)
- **Greeting Text**: Small size for subtlety
- **Caption Text**: Small size for secondary information
- **Flow Titles**: Medium weight, readable size
- **Button Text**: Bold weight for actions

### Layout & Spacing
- **Container Padding**: `layout.spacing.md` (16px)
- **Card Padding**: `layout.spacing.lg` (24px)
- **Element Spacing**: `layout.spacing.sm` (12px)
- **Squircle Radius**: 18px (approximated squircle formula)

## Component Architecture

### 1. Header Section
**Location**: Top of screen
**Components**:
- App logo/name ("Flow")
- Notification bell (🔔) with badge count
- Info button (ⓘ) for FTUE tour

**Styling**:
- Background: `#FEDFCD`
- Safe area aware
- Horizontal padding: 16px
- Icon size: 24px

### 2. Greeting Section
**Location**: Below header
**Content**:
- Personalized greeting with user name
- Small, subtle text size
- Caption text for additional context

**Styling**:
- Background: `#FEDFCD` (matches page background)
- Reduced text size for subtlety
- Proper spacing from header and Flow Grid

### 3. Flow Grid Component
**Location**: Main content area
**Features**:
- **Left Panel**: Flow names (white background)
- **Right Panel**: Status circles (orange background)
- **Date Header**: Weekday and date numbers
- **Interactive Elements**: Swipe navigation, status circle taps

**Layout Proportions**:
- **Parent Panel**: 6 units total
- **Left Panel**: 2 units (flow names)
- **Right Panel**: 4 units (status circles)
- **Gap**: 1px between panels

**Styling**:
- **Parent Panel**: Squircle corners (18px radius)
- **Left Panel**: White background, squircle corners
- **Right Panel**: Orange background (`#FFB366`), squircle corners with straight left edge
- **Gap**: 1px between left and right panels
- **Date Header**: Squircle corners, current date highlighted

**Interactive Behavior**:
- **Swipe**: Left/right to navigate date ranges
- **Tap Status Circles**: Mark habits complete (✅) or missed (❌)
- **Cheat Mode**: Respects past date editing restrictions

### 4. Motivation Card
**Location**: Below Flow Grid
**Content**:
- Daily inspirational quote
- "Quote of the day" title

**Styling**:
- **Background**: Linear gradient (`#FF8C00` → `#FFB366`)
- **Squircle corners**: 18px radius
- **Text**: White text on gradient background
- **Spacing**: Proper gaps from Flow Grid and Today's Flows

### 5. Today's Flows Section
**Location**: Below motivation card
**Content**:
- Section title: "Today Flows"
- List of flows for today using `UnifiedFlowCard`

**Styling**:
- **Background**: `#FFFFFF` (white)
- **Title**: Medium weight, primary text color
- **Card Layout**: 3:2:5 proportions (name:time:buttons)

### 6. UnifiedFlowCard Component
**Purpose**: Displays individual flow cards with unified UI for all tracking types

**Layout Proportions**:
- **Flow Name**: 3 units (left side)
- **Time**: 2 units (center)
- **Buttons**: 5 units (right side)

**Time Display**:
- **Format**: AM/PM format (e.g., "2:30 PM")
- **Color Logic**: Orange (`#F4B400`) for future times, Red (`#FF4444`) for passed times
- **Icon**: Clock icon with time

**Button Colors**:
- **Green** (`#D1FAE5`): Positive actions (Complete, Start)
- **Red** (`#FEE2E2`): Negative actions (Miss, Skip, Stop)
- **Yellow/Beige** (`#FEF3C7`): Neutral actions (Break)

**Gradient Backgrounds**:
- **Completed Flows**: White to green gradient (`#FFFFFF` → `#D1FAE5`)
- **Missed Flows**: White to red gradient (`#FFFFFF` → `#FEE2E2`)
- **Direction**: Left to right gradient

### 7. Add Flow Button (FAB)
**Location**: Bottom-right corner
**Styling**:
- **Background**: Linear gradient (`#FFB366` → `#FF8C00`)
- **Shape**: Squircle corners (pill radius)
- **Size**: 56px height
- **Position**: Fixed, above bottom navigation
- **Text**: "+ Add Flow"

### 8. Bottom Tab Navigation
**Location**: Bottom of screen
**Styling**:
- **Background**: Card background color
- **Height**: Responsive (76px Android, 80px iOS)
- **Padding**: Increased bottom spacing (24px Android, insets.bottom + 16px iOS)
- **Position**: `bottom: -1` to eliminate 1px gap
- **Shadow**: Platform-specific shadows and elevation

## User Experience Patterns

### First-Time User Experience (FTUE)
**Trigger**: Manual only (info button ⓘ)
**Steps**:
1. **Welcome**: Introduction to Flow
2. **Flow Grid**: Swipe navigation and status circle interaction
3. **Add New Flow**: Gradient button explanation
4. **Complete**: Success message

**Features**:
- **Dark overlay**: Dims background to focus attention
- **Animated tooltips**: Smooth scale animations
- **Progress indicators**: Dots showing current step
- **Skip option**: Users can skip the tour
- **Manual trigger**: Only shows when user requests it

### Interaction Patterns
- **Swipe Navigation**: Horizontal swiping on Flow Grid
- **Tap Interactions**: Status circles, buttons, cards
- **Visual Feedback**: Animations, color changes, haptics
- **Safe Areas**: Respects device safe areas and notches

### Responsive Design
- **Screen Sizes**: Adapts to different device sizes
- **Orientation**: Supports portrait orientation
- **Platform Differences**: iOS and Android specific styling
- **Accessibility**: Proper touch targets and contrast ratios

## Technical Implementation

### State Management
- **FlowsContext**: Manages flow data and operations
- **ThemeContext**: Handles light/dark theme switching
- **useFTUE Hook**: Manages first-time user experience
- **AsyncStorage**: Persists FTUE completion status

### Performance Considerations
- **FlatList**: Efficient rendering of flow lists
- **Memoization**: Optimized re-renders
- **Lazy Loading**: Components loaded as needed
- **Image Optimization**: Proper asset handling

### Navigation
- **TabNavigator**: Bottom tab navigation
- **Stack Navigation**: Modal and detail screens
- **Deep Linking**: Support for direct navigation
- **Back Handling**: Proper back button behavior

## Future Considerations

### Scalability
- **Component Reusability**: Modular design for easy extension
- **Theme System**: Centralized styling for consistency
- **Internationalization**: Ready for multiple languages
- **Accessibility**: WCAG compliance considerations

### Enhancement Opportunities
- **Animations**: More sophisticated micro-interactions
- **Personalization**: User-customizable layouts
- **Analytics**: User behavior tracking
- **Offline Support**: Enhanced offline functionality

## Design Principles

### Consistency
- **Color Usage**: Consistent color application across components
- **Spacing**: Uniform spacing system throughout
- **Typography**: Consistent font usage and sizing
- **Interactions**: Predictable interaction patterns

### Accessibility
- **Touch Targets**: Minimum 44px touch targets
- **Color Contrast**: Sufficient contrast ratios
- **Screen Readers**: Proper accessibility labels
- **Keyboard Navigation**: Support for external keyboards

### Performance
- **Smooth Animations**: 60fps target for animations
- **Fast Loading**: Optimized component loading
- **Memory Management**: Proper cleanup and disposal
- **Battery Efficiency**: Optimized rendering cycles

## Maintenance Notes

### Code Organization
- **Component Structure**: Clear separation of concerns
- **Style Management**: Centralized styling system
- **Documentation**: Comprehensive inline documentation
- **Testing**: Unit and integration test coverage

### Update Procedures
- **Style Changes**: Update centralized style system
- **Component Updates**: Maintain backward compatibility
- **Theme Updates**: Test across light/dark themes
- **Performance**: Monitor and optimize as needed

---

*This document should be updated whenever significant changes are made to the Home Page UI/UX. Last updated: [Current Date]*
