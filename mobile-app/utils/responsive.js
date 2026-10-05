import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const wp = (percent) => (width * percent) / 100;

export const hp = (percent) => (height * percent) / 100;

export const rf = (size) => {
  const scale = width / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const isSmallScreen = width < 360;
export const isTablet = width >= 768;
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;