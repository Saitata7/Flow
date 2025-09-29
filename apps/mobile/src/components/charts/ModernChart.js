import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors, typography, layout } from '../../../styles';

const { width: screenWidth } = Dimensions.get('window');

const ModernChart = ({
  type = 'line',
  data,
  title,
  subtitle,
  height = 200,
  showTooltip = true,
  interactive = true,
  theme = 'light',
  onDataPointPress,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const themeColors = theme === 'light' ? colors.light : colors.dark;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme === 'dark' ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '3',
      stroke: '#FF9500',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: themeColors.border,
      strokeWidth: 1,
    },
    fillShadowGradient: '#FF9500',
    fillShadowGradientOpacity: 0.1,
  };

  const handleDataPointPress = (data) => {
    if (onDataPointPress) {
      onDataPointPress(data);
    }
    if (showTooltip) {
      setTooltipData(data);
      setTooltipVisible(true);
      setTimeout(() => setTooltipVisible(false), 2000);
    }
  };

  const renderTooltip = () => {
    if (!tooltipVisible || !tooltipData) return null;

    return (
      <Animated.View
        style={[
          styles.tooltip,
          {
            backgroundColor: themeColors.cardBackground,
            opacity: animatedValue,
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.tooltipTitle, { color: themeColors.primaryText }]}>
          {tooltipData.label}
        </Text>
        <Text style={[styles.tooltipValue, { color: themeColors.primaryOrange }]}>
          {tooltipData.value}
        </Text>
      </Animated.View>
    );
  };

  const renderChart = () => {
    const commonProps = {
      width: screenWidth - 64,
      height,
      chartConfig,
      style: styles.chart,
      withDots: interactive,
      withShadow: false,
      withInnerLines: true,
      withOuterLines: false,
    };

    switch (type) {
      case 'line':
        return (
          <LineChart
            {...commonProps}
            data={data}
            bezier
            onDataPointClick={handleDataPointPress}
          />
        );
      case 'bar':
        return (
          <BarChart
            {...commonProps}
            data={data}
            showValuesOnTopOfBars
            onDataPointClick={handleDataPointPress}
          />
        );
      case 'pie':
        return (
          <PieChart
            {...commonProps}
            data={data}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: themeColors.primaryText }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      <Animated.View
        style={[
          styles.chartContainer,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {renderChart()}
        {renderTooltip()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: layout.spacing.sm,
  },
  header: {
    marginBottom: layout.spacing.md,
    alignItems: 'center',
  },
  title: {
    ...typography.styles.title2,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  subtitle: {
    ...typography.styles.body,
    opacity: 0.8,
  },
  chartContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  chart: {
    marginVertical: layout.spacing.sm,
    borderRadius: layout.radii.large,
  },
  tooltip: {
    position: 'absolute',
    top: -50,
    paddingHorizontal: layout.spacing.md,
    paddingVertical: layout.spacing.sm,
    borderRadius: layout.radii.base,
    ...layout.elevation.medium,
    zIndex: 1000,
  },
  tooltipTitle: {
    ...typography.styles.caption,
    fontWeight: '600',
    marginBottom: layout.spacing.xs,
  },
  tooltipValue: {
    ...typography.styles.title3,
    fontWeight: '700',
  },
});

export default ModernChart;
