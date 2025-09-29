import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../../styles';

const SafeAreaWrapper = ({ children, style, excludeTop = false, excludeBottom = false }) => {
  const insets = useSafeAreaInsets();
  
  // Calculate top safe area (status bar + notch)
  const topSafeArea = excludeTop ? 0 : insets.top;
  
  // Calculate bottom safe area including tab bar height
  // Tab bar height is 60px base + bottom safe area inset (as per TabNavigator)
  const baseTabHeight = 60;
  const tabBarHeight = baseTabHeight + insets.bottom;
  const bottomSafeArea = excludeBottom ? 0 : tabBarHeight;
  
  const containerStyle = [
    styles.container,
    {
      paddingTop: topSafeArea,
      paddingBottom: excludeBottom ? 0 : bottomSafeArea + layout.spacing.base + layout.spacing.lg,
    },
    style,
  ];

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
