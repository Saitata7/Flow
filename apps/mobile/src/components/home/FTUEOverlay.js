// components/home/FTUEOverlay.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, typography } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FTUE_STORAGE_KEY = 'hasSeenHomeFTUE';

const FTUEOverlay = ({ visible, onComplete }) => {
  const { theme } = React.useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [tooltipScale] = useState(new Animated.Value(0));

  const ftueSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Flow! 👋',
      description: 'Let\'s take a quick tour of your home screen',
      target: null,
      position: { top: 100, left: 20, right: 20 },
      arrow: 'down',
    },
    {
      id: 'flowgrid',
      title: 'Flow Grid',
      description: 'Swipe left/right to navigate dates. Tap status circles to mark habits complete ✅ or missed ❌',
      target: 'flowgrid',
      position: { top: 200, left: 20, right: 20 },
      arrow: 'down',
    },
    {
      id: 'addflow',
      title: 'Add New Flow',
      description: 'Tap this beautiful gradient button to create new habits',
      target: 'addflow',
      position: { top: screenHeight / 2 - 100, left: 20, right: 20 },
      arrow: null,
    },
    {
      id: 'complete',
      title: 'You\'re all set! 🎉',
      description: 'Start tracking your habits and building better routines. Good luck!',
      target: null,
      position: { top: screenHeight / 2 - 100, left: 20, right: 20 },
      arrow: null,
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(tooltipScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(tooltipScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNext = async () => {
    if (currentStep < ftueSteps.length - 1) {
      setCurrentStep(prev => Math.min(prev + 1, ftueSteps.length - 1));
    } else {
      // Mark FTUE as completed
      await AsyncStorage.setItem(FTUE_STORAGE_KEY, 'true');
      onComplete();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(FTUE_STORAGE_KEY, 'true');
    onComplete();
  };

  const currentStepData = ftueSteps[currentStep];

  if (!visible || !currentStepData || currentStep >= ftueSteps.length) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        {/* Dark overlay */}
        <View style={styles.darkOverlay} />
        
        {/* Tooltip */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              ...currentStepData.position,
              transform: [{ scale: tooltipScale }],
            },
          ]}
        >
          {/* Arrow */}
          {currentStepData.arrow && (
            <View style={[
              styles.arrow,
              styles[`arrow${currentStepData.arrow.charAt(0).toUpperCase() + currentStepData.arrow.slice(1)}`]
            ]} />
          )}
          
          {/* Tooltip Content */}
          <View style={[styles.tooltipContent, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.tooltipTitle, { color: themeColors.primaryText }]}>
              {currentStepData.title}
            </Text>
            <Text style={[styles.tooltipDescription, { color: themeColors.secondaryText }]}>
              {currentStepData.description}
            </Text>
            
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                {ftueSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: index <= currentStep 
                          ? themeColors.primaryOrange 
                          : themeColors.progressBackground
                      }
                    ]}
                  />
                ))}
              </View>
            </View>
            
            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={[styles.skipButtonText, { color: themeColors.secondaryText }]}>
                  Skip Tour
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: themeColors.primaryOrange }]}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === ftueSteps.length - 1 ? 'Get Started!' : 'Next'}
                </Text>
                {currentStep < ftueSteps.length - 1 && (
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 10000,
  },
  tooltipContent: {
    borderRadius: 18,
    padding: layout.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
    marginBottom: layout.spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tooltipDescription: {
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * 1.4,
    marginBottom: layout.spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  progressContainer: {
    marginBottom: layout.spacing.md,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.md,
  },
  skipButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.sm,
    paddingHorizontal: layout.spacing.lg,
    borderRadius: layout?.radii?.large || 28,
  },
  nextButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginRight: layout.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  arrowDown: {
    top: -8,
    left: '50%',
    marginLeft: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  arrowUp: {
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
});

export default FTUEOverlay;
