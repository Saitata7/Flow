// assets/icons/HomeIcon.js
import React from 'react';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

const HomeIcon = (props) => {
  const { color = '#292D32', filled = false, ...otherProps } = props;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...otherProps}>
      <G clipPath="url(#clip0_17_71)">
        {/* Background fill when selected */}
        {filled && (
          <Path
            d="M10.07 2.81999L3.13997 8.36999C2.73411 8.73053 2.42127 9.1837 2.22802 9.69102C2.03477 10.1983 1.96683 10.7448 2.02997 11.284L3.35997 19.244C3.50027 19.9536 3.87754 20.5944 4.42991 21.0614C4.98228 21.5283 5.67695 21.7937 6.39997 21.814H17.597C17.319 21.7903 19.0119 21.5237 19.5636 21.0573C20.1153 20.5909 20.4935 19.952 20.637 19.244L21.967 11.284C22.0248 10.7458 21.9543 10.2015 21.7614 9.69569C21.5685 9.18991 21.2586 8.73699 20.857 8.37399L13.93 2.82999C13.3737 2.41223 12.6973 2.18553 12.0016 2.18373C11.306 2.18192 10.6284 2.40511 10.07 2.81999Z"
            fill={color}
          />
        )}
        <Path
          d="M12 18V15"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M10.07 2.81999L3.13997 8.36999C2.73411 8.73053 2.42127 9.1837 2.22802 9.69102C2.03477 10.1983 1.96683 10.7448 2.02997 11.284L3.35997 19.244C3.50027 19.9536 3.87754 20.5944 4.42991 21.0614C4.98228 21.5283 5.67695 21.7937 6.39997 21.814H17.597C17.319 21.7903 19.0119 21.5237 19.5636 21.0573C20.1153 20.5909 20.4935 19.952 20.637 19.244L21.967 11.284C22.0248 10.7458 21.9543 10.2015 21.7614 9.69569C21.5685 9.18991 21.2586 8.73699 20.857 8.37399L13.93 2.82999C13.3737 2.41223 12.6973 2.18553 12.0016 2.18373C11.306 2.18192 10.6284 2.40511 10.07 2.81999Z"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_17_71">
          <Rect width={24} height={24} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default HomeIcon;
