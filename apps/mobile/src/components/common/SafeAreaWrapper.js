import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../../styles';

const SafeAreaWrapper = ({ children, style, excludeBottom = false }) => {
  const insets = useSafeAreaInsets();
  
  // Calculate bottom safe area including tab bar height
  // Tab bar is typically 49-83px depending on device
  const tabBarHeight = Platform.OS === 'ios' ? 49 : 56;
  const bottomSafeArea = excludeBottom ? 0 : Math.max(insets.bottom, tabBarHeight);
  
  const containerStyle = [
    styles.container,
    {
      paddingBottom: bottomSafeArea + layout.spacing.md, // Extra spacing above tab bar
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
