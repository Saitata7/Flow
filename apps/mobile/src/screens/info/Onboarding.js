// screens/splash/Onboarding.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { colors, typography, layout } from '../../../styles';
import useFirstTime from '../../hooks/useFirstTime'; // To mark onboarding as complete

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Welcome to Flow Tracker',
    description: 'Build better flows one day at a time.',
    icon: '🌊',
  },
  {
    title: 'Track Your Progress',
    description: 'See your streaks and achievements.',
    icon: '📊',
  },
  {
    title: 'Get Started',
    description: 'Create your first flow now!',
    icon: '🚀',
  },
];

const Onboarding = ({ navigation }) => {
  const { markFirstLaunchComplete } = useFirstTime();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    markFirstLaunchComplete();
    // Add a small delay to ensure navigation stack is ready
    setTimeout(() => {
      navigation.replace('Auth'); // Navigate to Auth stack
    }, 100);
  };

  const handleSkip = () => {
    handleFinish();
  };

  return (
    <View style={styles.container}>
      <View style={styles.slide}>
        <Text style={styles.icon}>{slides[currentSlide].icon}</Text>
        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.description}>{slides[currentSlide].description}</Text>
      </View>
      
      {/* Pagination dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.activeDot
            ]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
  },
  icon: {
    fontSize: 80,
    marginBottom: layout.spacing.lg,
  },
  title: {
    ...typography.styles.title1,
    color: colors.light.primaryText,
    marginBottom: layout.spacing.md,
    textAlign: 'center',
  },
  description: {
    ...typography.styles.body,
    color: colors.light.secondaryText,
    textAlign: 'center',
    paddingHorizontal: layout.spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layout.spacing.xl,
  },
  dot: {
    backgroundColor: colors.light.progressBackground,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.light.primaryOrange,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: layout.spacing.lg,
  },
  skipButton: {
    padding: layout.spacing.md,
  },
  skipText: {
    ...typography.styles.headline,
    color: colors.light.secondaryText,
  },
  nextButton: {
    backgroundColor: colors.light.primaryOrange,
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.md,
    borderRadius: 8,
  },
  nextText: {
    ...typography.styles.headline,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default Onboarding;