// assets/icons/StatsIcon.js
import React from 'react';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

const StatsIcon = (props) => {
  const { color = '#292D32', filled = false, ...otherProps } = props;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...otherProps}>
      <G clipPath="url(#clip0_17_54)">
        {/* Background fill when selected */}
        {filled && (
          <Path
            d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
            fill={color}
          />
        )}
        <Path
          d="M6.88 18.15V16.08"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M12 18.15V14.01"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M17.12 18.15V11.93"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M17.12 5.85001L16.66 6.39001C14.1069 9.37082 10.6885 11.482 6.88 12.43"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M14.19 5.85001H17.12V8.77001"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
          stroke={filled ? '#FFFFFF' : color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_17_54">
          <Rect width={24} height={24} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default StatsIcon;
