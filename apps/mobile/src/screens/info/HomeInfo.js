// screens/info/HomeInfo.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, layout, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HomeInfo = ({ navigation }) => {
  const { theme } = React.useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;

  const infoSteps = [
    {
      id: 1,
      title: "Welcome to Flow!",
      description: "Your personal habit tracking companion",
      icon: "home",
      color: themeColors.primaryOrange,
    },
    {
      id: 2,
      title: "Flow Grid",
      description: "Track your daily habits across multiple days. Swipe left/right to navigate dates, tap status circles to mark completion.",
      icon: "grid",
      color: themeColors.primaryBlue,
    },
    {
      id: 3,
      title: "Today's Flows",
      description: "View and interact with your flows for today. Each card shows your progress and allows quick actions.",
      icon: "list",
      color: themeColors.primaryGreen,
    },
    {
      id: 4,
      title: "Add New Flow",
      description: "Tap the orange gradient button to create new habits and track your progress.",
      icon: "add-circle",
      color: themeColors.primaryOrange,
    },
    {
      id: 5,
      title: "Navigation",
      description: "Use the bottom tabs to navigate between Home and Stats sections.",
      icon: "navigate",
      color: themeColors.primaryPurple,
    },
  ];

  const renderInfoStep = (step) => (
    <View key={step.id} style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: step.color }]}>
        <Ionicons name={step.icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: themeColors.primaryText }]}>
          {step.title}
        </Text>
        <Text style={[styles.stepDescription, { color: themeColors.secondaryText }]}>
          {step.description}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.cardBackground }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={themeColors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>
          How to Use Home
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, { backgroundColor: themeColors.cardBackground }]}>
          <LinearGradient
            colors={[themeColors.primaryOrange, themeColors.primaryOrangeVariants.light]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.welcomeGradient}
          >
            <Ionicons name="home" size={32} color="#FFFFFF" />
            <Text style={styles.welcomeTitle}>Welcome to Flow!</Text>
            <Text style={styles.welcomeSubtitle}>
              Let's get you started with your habit tracking journey
            </Text>
          </LinearGradient>
        </View>

        {/* Info Steps */}
        <View style={styles.stepsContainer}>
          {infoSteps.map(renderInfoStep)}
        </View>

        {/* Tips Section */}
        <View style={[styles.tipsSection, { backgroundColor: themeColors.cardBackground }]}>
          <Text style={[styles.tipsTitle, { color: themeColors.primaryText }]}>
            💡 Pro Tips
          </Text>
          <View style={styles.tipItem}>
            <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
              • Swipe horizontally on the Flow Grid to see different date ranges
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
              • Tap status circles to quickly mark habits as done or missed
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
              • Use the notification bell to stay updated on your progress
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
              • Check your stats regularly to see your improvement over time
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { backgroundColor: themeColors.cardBackground }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.primaryOrange }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: layout.spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.spacing.md,
  },
  welcomeSection: {
    marginTop: layout.spacing.lg,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: layout.spacing.lg,
  },
  welcomeGradient: {
    padding: layout.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: typography.sizes.title1,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginTop: layout.spacing.sm,
    marginBottom: layout.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.body,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  stepsContainer: {
    marginBottom: layout.spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.lg,
    paddingHorizontal: layout.spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.spacing.md,
  },
  stepContent: {
    flex: 1,
    paddingTop: layout.spacing.xs,
  },
  stepTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
    marginBottom: layout.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  stepDescription: {
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * 1.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tipsSection: {
    borderRadius: 18,
    padding: layout.spacing.lg,
    marginBottom: layout.spacing.lg,
  },
  tipsTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
    marginBottom: layout.spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tipItem: {
    marginBottom: layout.spacing.sm,
  },
  tipText: {
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * 1.4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  bottomSpacing: {
    height: layout.spacing.xl,
  },
  actionContainer: {
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    borderRadius: layout.button.pillRadius,
    paddingVertical: layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default HomeInfo;
