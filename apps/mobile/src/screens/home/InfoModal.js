import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, layout } from '../../../styles';
import { ThemeContext } from '../../context/ThemeContext';
import { Button } from '../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const InfoModal = ({ visible, onClose }) => {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  const themeColors = colors[theme] || colors.light;
  const [hasSeenHomeInfo, setHasSeenHomeInfo] = useState(false);

  useEffect(() => {
    checkHasSeenHomeInfo();
  }, []);

  const checkHasSeenHomeInfo = async () => {
    try {
      const seen = await AsyncStorage.getItem('hasSeenHomeInfo');
      setHasSeenHomeInfo(seen === 'true');
    } catch (error) {
      console.error('Error checking hasSeenHomeInfo:', error);
    }
  };

  const markAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenHomeInfo', 'true');
      setHasSeenHomeInfo(true);
    } catch (error) {
      console.error('Error saving hasSeenHomeInfo:', error);
    }
  };

  const handleClose = () => {
    markAsSeen();
    onClose();
  };

  const infoSections = [
    {
      icon: 'home',
      title: 'Welcome to Flow',
      description: 'Your personal habit tracking companion. Track your daily flows, build better habits, and achieve your goals.',
    },
    {
      icon: 'checkmark-circle',
      title: 'Track Your Habits',
      description: 'Tap the circles in the habit tracker to mark your daily progress. Green means completed, red means missed.',
    },
    {
      icon: 'add-circle',
      title: 'Add New Flows',
      description: 'Use the "Add Flow" button to create new habits and track different types of activities.',
    },
    {
      icon: 'bar-chart',
      title: 'View Your Progress',
      description: 'Check the Stats tab to see your progress over time and celebrate your achievements.',
    },
    {
      icon: 'people',
      title: 'Join Plans',
      description: 'Discover community challenges and personal development plans in the Plans tab.',
    },
    {
      icon: 'settings',
      title: 'Manage Settings',
      description: 'Customize your experience and manage your account settings.',
    },
  ];

  const renderInfoSection = (section, index) => (
    <View key={index} style={styles.infoSection}>
      <View style={[styles.iconContainer, { backgroundColor: themeColors.primaryOrange }]}>
        <Ionicons
          name={section.icon}
          size={24}
          color={themeColors.cardBackground}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.sectionTitle, { color: themeColors.primaryText }]}>
          {section.title}
        </Text>
        <Text style={[styles.sectionDescription, { color: themeColors.secondaryText }]}>
          {section.description}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.cardBackground }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <View style={[styles.logoContainer, { backgroundColor: themeColors.primaryOrange }]}>
                <Text style={[styles.logoText, { color: themeColors.cardBackground }]}>
                  Flow
                </Text>
              </View>
              <Text style={[styles.headerTitle, { color: themeColors.primaryText }]}>
                How to Use Flow
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={themeColors.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {infoSections.map(renderInfoSection)}
            
            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={[styles.tipsTitle, { color: themeColors.primaryText }]}>
                💡 Pro Tips
              </Text>
              <View style={styles.tipItem}>
                <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
                  • Set realistic goals to build momentum
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
                  • Track your mood to understand patterns
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
                  • Use reminders to stay consistent
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={[styles.tipText, { color: themeColors.secondaryText }]}>
                  • Celebrate small wins to stay motivated
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Button
              variant="primary"
              title="Got it!"
              onPress={handleClose}
              style={styles.gotItButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: screenHeight * 0.8,
    borderRadius: layout.radii.large,
    ...layout.elevation.high,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layout.spacing.md,
  },
  logoText: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.bold,
  },
  headerTitle: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  closeButton: {
    padding: layout.spacing.sm,
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.lg,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: layout.spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layout.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    marginBottom: layout.spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.sizes.body,
    lineHeight: 22,
  },
  tipsSection: {
    marginTop: layout.spacing.md,
    padding: layout.spacing.md,
    backgroundColor: colors.light.background,
    borderRadius: layout.radii.base,
  },
  tipsTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    marginBottom: layout.spacing.md,
  },
  tipItem: {
    marginBottom: layout.spacing.sm,
  },
  tipText: {
    fontSize: typography.sizes.body,
    lineHeight: 20,
  },
  modalFooter: {
    padding: layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  gotItButton: {
    borderRadius: layout.radii.base,
  },
});

export default InfoModal;
