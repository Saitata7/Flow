import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, layout } from '../../../styles';
import AnalyticsDashboard from './AnalyticsDashboard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ResponsiveTest = ({ flows, theme = 'light' }) => {
  const [orientation, setOrientation] = useState('portrait');
  const [screenSize, setScreenSize] = useState('normal');

  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      const newOrientation = width > height ? 'landscape' : 'portrait';
      const newScreenSize = width < 400 ? 'small' : width > 600 ? 'large' : 'normal';
      
      setOrientation(newOrientation);
      setScreenSize(newScreenSize);
    };

    const subscription = Dimensions.addEventListener('change', updateLayout);
    updateLayout();

    return () => subscription?.remove();
  }, []);

  const themeColors = theme === 'light' ? colors.light : colors.dark;

  const getResponsiveStyles = () => {
    const baseStyles = {
      container: {
        flex: 1,
        backgroundColor: themeColors.background,
      },
      header: {
        padding: layout.spacing.md,
        alignItems: 'center',
        backgroundColor: themeColors.cardBackground,
        ...layout.elevation.low,
      },
      headerTitle: {
        ...typography.largeTitle,
        fontWeight: '700',
        color: themeColors.primaryText,
        marginBottom: layout.spacing.xs,
      },
      headerSubtitle: {
        ...typography.styles.body,
        color: themeColors.secondaryText,
        textAlign: 'center',
      },
      infoContainer: {
        padding: layout.spacing.md,
        backgroundColor: themeColors.cardBackground,
        margin: layout.spacing.md,
        borderRadius: layout.radii.large,
        ...layout.elevation.low,
      },
      infoText: {
        ...typography.styles.body,
        color: themeColors.primaryText,
        marginBottom: layout.spacing.sm,
      },
      dashboardContainer: {
        flex: 1,
      },
    };

    // Adjust for screen size
    if (screenSize === 'small') {
      baseStyles.headerTitle = {
        ...baseStyles.headerTitle,
        fontSize: 24,
      };
      baseStyles.infoContainer = {
        ...baseStyles.infoContainer,
        padding: layout.spacing.sm,
        margin: layout.spacing.sm,
      };
    } else if (screenSize === 'large') {
      baseStyles.headerTitle = {
        ...baseStyles.headerTitle,
        fontSize: 32,
      };
      baseStyles.infoContainer = {
        ...baseStyles.infoContainer,
        padding: layout.spacing.lg,
        margin: layout.spacing.lg,
      };
    }

    // Adjust for orientation
    if (orientation === 'landscape') {
      baseStyles.header = {
        ...baseStyles.header,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      };
      baseStyles.headerTitle = {
        ...baseStyles.headerTitle,
        marginBottom: 0,
      };
    }

    return baseStyles;
  };

  const styles = getResponsiveStyles();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Modern design inspired by Robinhood
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          📱 Screen Size: {screenSize} ({screenWidth}x{screenHeight})
        </Text>
        <Text style={styles.infoText}>
          📐 Orientation: {orientation}
        </Text>
        <Text style={styles.infoText}>
          🎨 Theme: {theme}
        </Text>
        <Text style={styles.infoText}>
          📊 Flows: {flows?.length || 0} active
        </Text>
      </View>

      <View style={styles.dashboardContainer}>
        <AnalyticsDashboard flows={flows} theme={theme} />
      </View>
    </SafeAreaView>
  );
};

export default ResponsiveTest;
